"""
=============================================================================
  Climate Time-Series Forecasting — Temperature & Precipitation (Pressure)
  Using Facebook Prophet on ERA5 NetCDF data (1996–2026)
=============================================================================

INSTALLATION:
    pip install xarray netcdf4 pandas prophet matplotlib scipy

USAGE (command line):
    python forecast.py --lat 28.61 --lon 77.21 --years 5

USAGE (as a module):
    from forecast import run_forecast
    run_forecast(user_lat=28.61, user_lon=77.21, forecast_years=5)

DATA FILES (adjust DATA_DIR below if paths differ):
    - data/raw/all.nc        → contains: t2m (2m temperature)
    - data/raw/all3.nc       → contains: t2m, sp (surface pressure)

NOTE:
    Neither file contains a direct precipitation variable (tp/cp/rr).
    This script forecasts:
      • Temperature  → t2m  from all3.nc  (Kelvin → °C)
      • Pressure     → sp   from all3.nc  (Pa → hPa), used as weather proxy
    If you later add a precipitation NetCDF, set PRECIP_VAR and PRECIP_FILE
    constants below.
=============================================================================
"""

import os
import sys
import argparse
import warnings
import logging

import numpy as np
import pandas as pd
import xarray as xr
import matplotlib.pyplot as plt
import matplotlib.gridspec as gridspec
from matplotlib.patches import Patch

# Suppress noisy convergence warnings from Stan (Prophet backend)
warnings.filterwarnings("ignore")
logging.getLogger("prophet").setLevel(logging.ERROR)
logging.getLogger("cmdstanpy").setLevel(logging.ERROR)

from prophet import Prophet

# ─────────────────────────────────────────────────────────────────────────────
#  CONFIGURATION  (edit these paths to match your environment)
# ─────────────────────────────────────────────────────────────────────────────
_SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))

# Root of the technex project (two levels up from globe/backend)
_PROJECT_ROOT = os.path.abspath(os.path.join(_SCRIPT_DIR, "..", ".."))

# The NetCDF files have been moved directly into the backend folder
DATA_DIR        = _SCRIPT_DIR
MODELS_DIR      = os.path.join(_PROJECT_ROOT, "models")
# Save plots directly into the FastAPI static directory so they can be served
OUTPUT_DIR      = os.path.join(_SCRIPT_DIR, "static", "forecasts")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)
TEMP_PRECIP_FILE = os.path.join(DATA_DIR, "all3.nc")       # t2m + sp
TEMP_ONLY_FILE   = os.path.join(DATA_DIR, "all.nc")        # fallback t2m

TEMP_VAR    = "t2m"    # 2-metre temperature [K]
PRESSURE_VAR = "sp"    # Surface pressure [Pa]

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
#  1 ·  DATA EXTRACTION
# ─────────────────────────────────────────────────────────────────────────────

def extract_timeseries(user_lat: float, user_lon: float) -> pd.DataFrame:
    """
    Open the NetCDF file, select the nearest grid-point to (user_lat, user_lon),
    and return a tidy DataFrame with columns:
        ds          – datetime index (valid_time decoded to pandas Timestamps)
        temperature – 2m temperature in °C
        pressure    – surface pressure in hPa  (weather proxy for rain)

    Parameters
    ----------
    user_lat : float   Latitude  ( –90 to 90 )
    user_lon : float   Longitude (  0 to 360 ) or (–180 to 180)
    """
    print(f"\n[1/4] Loading dataset: {os.path.basename(TEMP_PRECIP_FILE)}")

    # Prefer all3.nc (has both t2m + sp). Fall back to all2cols.nc if needed.
    nc_file = TEMP_PRECIP_FILE if os.path.exists(TEMP_PRECIP_FILE) else TEMP_ONLY_FILE
    if not os.path.exists(nc_file):
        raise FileNotFoundError(
            f"NetCDF file not found. Expected at:\n  {TEMP_PRECIP_FILE}\n  {TEMP_ONLY_FILE}"
        )

    ds = xr.open_dataset(nc_file, engine="netcdf4")

    # ── normalise longitudes if dataset uses 0–360 range ──────────────────────
    lon_max = float(ds.longitude.max())
    lon_min = float(ds.longitude.min())
    uses_0_360 = lon_max > 180 and lon_min >= 0

    query_lon = user_lon
    if uses_0_360 and user_lon < 0:
        query_lon = user_lon + 360.0  # convert –180/180 → 0/360

    # ── extract nearest point (returns 1-D time series) ──────────────────────
    print(f"  Selecting nearest grid-point to Lat={user_lat:.4f}, Lon={user_lon:.4f}")
    point_ds = ds.sel(latitude=user_lat, longitude=query_lon, method="nearest")

    actual_lat = float(point_ds.latitude)
    actual_lon = float(point_ds.longitude)
    if uses_0_360 and actual_lon > 180:
        actual_lon -= 360.0
    print(f"  Nearest grid-point found → Lat={actual_lat:.4f}, Lon={actual_lon:.4f}")

    # ── decode time dimension ─────────────────────────────────────────────────
    time_dim  = "valid_time" if "valid_time" in ds.coords else "time"
    times_raw = pd.to_datetime(point_ds[time_dim].values)

    # ── build tidy DataFrame ──────────────────────────────────────────────────
    data = {"ds": times_raw}

    # Temperature: K → °C
    if TEMP_VAR in point_ds:
        data["temperature"] = point_ds[TEMP_VAR].values - 273.15
    else:
        raise KeyError(f"Variable '{TEMP_VAR}' not found in dataset. Available: {list(ds.data_vars)}")

    # Pressure: Pa → hPa     (or skip if not present)
    if PRESSURE_VAR in point_ds:
        data["pressure"] = point_ds[PRESSURE_VAR].values / 100.0
    else:
        print(f"  [!] Variable '{PRESSURE_VAR}' not in dataset – skipping pressure forecast.")
        data["pressure"] = None

    df = pd.DataFrame(data)
    df = df.dropna(subset=["ds", "temperature"])
    df = df.sort_values("ds").reset_index(drop=True)

    print(f"  Extracted {len(df)} time-steps  ({df['ds'].min().date()} → {df['ds'].max().date()})")
    ds.close()
    return df, actual_lat, actual_lon


# ─────────────────────────────────────────────────────────────────────────────
#  2 ·  PROPHET FORECASTING
# ─────────────────────────────────────────────────────────────────────────────

def _fit_prophet_temperature(
    df_input: pd.DataFrame,
    forecast_periods: int,
    freq: str = "MS",
) -> pd.DataFrame:
    """
    Fit a Prophet model tuned for temperature:
      - High seasonality flexibility  (seasonality_prior_scale=10)
      - Decadal custom seasonality    (captures slow climate-change drift)
      - Mild changepoint scale        (avoids spurious trend jumps)
    """
    prophet_df = df_input[["ds", "temperature"]].rename(columns={"temperature": "y"}).dropna()
    print(f"\n[2/4] Fitting Prophet model for Temperature (°C)  ({len(prophet_df)} pts)…")

    model = Prophet(
        yearly_seasonality=True,
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode="additive",
        changepoint_prior_scale=0.05,    # mild — avoids overfitting sparse data
        seasonality_prior_scale=10.0,    # rich yearly amplitude (needed for monsoon swings)
        uncertainty_samples=500,
        interval_width=0.90,
    )
    # Slow decadal climate-change trend
    model.add_seasonality(name="decadal", period=365.25 * 10, fourier_order=3)
    model.fit(prophet_df)

    last_date   = prophet_df["ds"].max()
    future_dates = pd.date_range(start=last_date, periods=forecast_periods + 1, freq=freq)[1:]
    full_future  = pd.concat([prophet_df[["ds"]], pd.DataFrame({"ds": future_dates})], ignore_index=True)
    forecast     = model.predict(full_future)
    forecast["is_future"] = forecast["ds"] > last_date

    print(f"  Temperature fit done. Forecasting {forecast_periods} months ahead.")
    return forecast, model, prophet_df


def _fit_prophet_pressure(
    df_input: pd.DataFrame,
    forecast_periods: int,
    freq: str = "MS",
) -> pd.DataFrame:
    """
    Fit a Prophet model tuned specifically for surface pressure:
      - Extremely tight changepoints  (changepoint_prior_scale=0.005) → rigidly flat trend, no drift
      - High Fourier order            (fourier_order=12) → captures exact complex shape of the annual cycle
      - High seasonality scale        (seasonality_prior_scale=10.0) → allows the pattern to reach full historical amplitude
      - NO decadal custom seasonality
      - Narrower interval width       (interval_width=0.80) → more decisive, narrower confidence bands
    """
    df_pres = df_input[["ds", "pressure"]].rename(columns={"pressure": "y"}).dropna()
    print(f"\n[2b/4] Fitting Prophet model for Surface Pressure (hPa)  ({len(df_pres)} pts)…")

    model = Prophet(
        yearly_seasonality=False,        # Custom yearly added below
        weekly_seasonality=False,
        daily_seasonality=False,
        seasonality_mode="additive",
        changepoint_prior_scale=0.005,   # Force baseline trend to be almost completely flat
        seasonality_prior_scale=10.0,    # Let the seasonal cycle be strong enough to hit all peaks
        uncertainty_samples=100,         # Reduce sampling noise in the confidence bands
        interval_width=0.80,             # Show a tighter, more decisive 80% confidence band
    )
    # High fourier_order tightly traces the exact historical pattern of monsoon dips/winter peaks
    model.add_seasonality(name="yearly", period=365.25, fourier_order=12)
    model.fit(df_pres)

    last_date    = df_pres["ds"].max()
    future_dates = pd.date_range(start=last_date, periods=forecast_periods + 1, freq=freq)[1:]
    full_future  = pd.concat([df_pres[["ds"]], pd.DataFrame({"ds": future_dates})], ignore_index=True)
    forecast     = model.predict(full_future)
    forecast["is_future"] = forecast["ds"] > last_date

    print(f"  Pressure fit done. Forecasting {forecast_periods} months ahead.")
    return forecast, model, df_pres


# ─────────────────────────────────────────────────────────────────────────────
#  3 ·  VISUALISATION
# ─────────────────────────────────────────────────────────────────────────────

def _plot_forecast(
    ax: plt.Axes,
    history_df: pd.DataFrame,
    forecast_df: pd.DataFrame,
    label: str,
    unit: str,
    color_hist: str = "#4C9BE8",
    color_fore: str = "#E8844C",
) -> None:
    """
    Draw observed history + forecast + confidence bands on a single Axes.
    """
    hist_fc   = forecast_df[~forecast_df["is_future"]]
    future_fc = forecast_df[forecast_df["is_future"]]

    # Historical data points
    ax.plot(
        history_df["ds"], history_df["y"],
        color=color_hist, linewidth=1.4, alpha=0.85, label="Historical data", zorder=3
    )
    # Prophet fitted line (historical period)
    ax.plot(
        hist_fc["ds"], hist_fc["yhat"],
        color=color_hist, linewidth=1.0, linestyle="--", alpha=0.55, label="Model fit"
    )
    # Future forecast
    ax.plot(
        future_fc["ds"], future_fc["yhat"],
        color=color_fore, linewidth=2.0, linestyle="--", label="Forecast", zorder=4
    )
    # Confidence band (future)
    ax.fill_between(
        future_fc["ds"],
        future_fc["yhat_lower"],
        future_fc["yhat_upper"],
        color=color_fore, alpha=0.18, label="90% confidence band"
    )
    # Confidence band (historical — lighter)
    ax.fill_between(
        hist_fc["ds"],
        hist_fc["yhat_lower"],
        hist_fc["yhat_upper"],
        color=color_hist, alpha=0.10
    )

    # Vertical separator line at the forecast boundary
    split_date = forecast_df.loc[forecast_df["is_future"], "ds"].min()
    ax.axvline(split_date, color="#888888", linewidth=1.0, linestyle=":", alpha=0.7)
    ax.text(
        split_date, ax.get_ylim()[1],
        "  Forecast →", fontsize=8, color="#666666", va="top", ha="left"
    )

    ax.set_ylabel(f"{label} ({unit})", fontsize=10)
    ax.legend(fontsize=8, loc="upper left")
    ax.grid(True, alpha=0.25, linestyle="--")
    ax.spines[["top", "right"]].set_visible(False)


def plot_and_save(
    lat: float,
    lon: float,
    history_temp: pd.DataFrame,
    forecast_temp: pd.DataFrame,
    history_pres: pd.DataFrame | None,
    forecast_pres: pd.DataFrame | None,
    forecast_years: int,
    output_path: str | None = None,
) -> str:
    """
    Build a clean 1- or 2-panel figure and save to disk.

    Returns the path to the saved image.
    """
    n_panels = 2 if (forecast_pres is not None) else 1
    fig = plt.figure(figsize=(15, 5 * n_panels), facecolor="#F5F7FA")

    # Optional: nice dark-ish style
    plt.rcParams.update({
        "font.family": "DejaVu Sans",
        "axes.facecolor": "#FFFFFF",
        "figure.facecolor": "#F5F7FA",
        "axes.spines.left": True,
        "axes.spines.bottom": True,
    })

    gs   = gridspec.GridSpec(n_panels, 1, hspace=0.45)
    axes = [fig.add_subplot(gs[i]) for i in range(n_panels)]

    # ── Temperature panel ───────────────────────────────────────────────────
    _plot_forecast(axes[0], history_temp, forecast_temp,
                   label="Temperature", unit="°C",
                   color_hist="#3A86FF", color_fore="#FF5733")
    axes[0].set_title(
        f"{forecast_years}-Year Temperature Forecast  |  Lat: {lat:.4f}, Lon: {lon:.4f}",
        fontsize=13, fontweight="bold", pad=12, color="#1A1A2E"
    )

    # ── Pressure panel  (if available) ──────────────────────────────────────
    if n_panels == 2 and forecast_pres is not None:
        _plot_forecast(axes[1], history_pres, forecast_pres,
                       label="Surface Pressure", unit="hPa",
                       color_hist="#06D6A0", color_fore="#FF8C42")
        axes[1].set_title(
            f"{forecast_years}-Year Surface Pressure Forecast  |  Lat: {lat:.4f}, Lon: {lon:.4f}",
            fontsize=13, fontweight="bold", pad=12, color="#1A1A2E"
        )

    axes[-1].set_xlabel("Date", fontsize=10)

    # ── Super-title and footer ───────────────────────────────────────────────
    fig.suptitle(
        "ERA5 Climate Forecasting — Prophet Time-Series Model",
        fontsize=15, fontweight="bold", y=1.01, color="#1A1A2E"
    )
    fig.text(
        0.99, -0.01,
        "Data: ERA5 Reanalysis (1996–2026)  |  Model: Facebook Prophet",
        ha="right", fontsize=7, color="#AAAAAA"
    )

    if output_path is None:
        safe_lat = f"{'N' if lat >= 0 else 'S'}{abs(lat):.2f}"
        safe_lon = f"{'E' if lon >= 0 else 'W'}{abs(lon):.2f}"
        fname    = f"forecast_{safe_lat}_{safe_lon}_{forecast_years}yr.png"
        output_path = os.path.join(OUTPUT_DIR, fname)

    plt.tight_layout()
    plt.savefig(output_path, dpi=180, bbox_inches="tight")
    plt.close(fig)

    print(f"\n[4/4] Plot saved → {output_path}")
    return output_path


# ─────────────────────────────────────────────────────────────────────────────
#  4 ·  MAIN PIPELINE
# ─────────────────────────────────────────────────────────────────────────────

def run_forecast(
    user_lat: float,
    user_lon: float,
    forecast_years: int = 5,
    output_path: str | None = None,
) -> dict:
    """
    End-to-end pipeline: extract → model → forecast → visualise.

    Parameters
    ----------
    user_lat       : latitude  ( –90   to  90 )
    user_lon       : longitude ( –180  to 180 )  [converted internally if needed]
    forecast_years : how many years ahead to forecast
    output_path    : optional explicit path for output PNG

    Returns
    -------
    dict with keys:
        'forecast_temperature' – Prophet forecast DataFrame for temperature
        'forecast_pressure'    – Prophet forecast DataFrame for pressure (or None)
        'plot_path'            – absolute path to the saved PNG
        'actual_lat'           – nearest grid-cell latitude
        'actual_lon'           – nearest grid-cell longitude
    """
    print("=" * 65)
    print("  ERA5 Climate Forecast Pipeline")
    print(f"  Location : Lat={user_lat:.4f}, Lon={user_lon:.4f}")
    print(f"  Horizon  : {forecast_years} years")
    print("=" * 65)

    # ── Step 1: Extract time-series ─────────────────────────────────────────
    df, actual_lat, actual_lon = extract_timeseries(user_lat, user_lon)
    forecast_periods = forecast_years * 12   # monthly horizon

    # ── Step 2: Forecast Temperature (tuned for high seasonal amplitude) ─────
    fc_temp, model_temp, hist_temp = _fit_prophet_temperature(
        df_input         = df,
        forecast_periods = forecast_periods,
        freq             = "MS",
    )

    # ── Step 3: Forecast Pressure (tuned for smooth, stable predictions) ─────
    fc_pres = hist_pres = model_pres = None
    if df["pressure"].notna().any() and len(df.dropna(subset=["pressure"])) > 5:
        fc_pres, model_pres, hist_pres = _fit_prophet_pressure(
            df_input         = df,
            forecast_periods = forecast_periods,
            freq             = "MS",
        )
    else:
        print("\n  [!] Pressure data unavailable – skipping second panel.")

    print("\n[3/4] Generating visualisation…")

    # ── Step 4: Plot ─────────────────────────────────────────────────────────
    saved_path = plot_and_save(
        lat           = actual_lat,
        lon           = actual_lon,
        history_temp  = hist_temp,
        forecast_temp = fc_temp,
        history_pres  = hist_pres,
        forecast_pres = fc_pres,
        forecast_years = forecast_years,
        output_path   = output_path,
    )

    print("\n✓ Pipeline complete.")
    print(f"  Temperature forecast ({forecast_years}yr): {fc_temp[fc_temp['is_future']]['yhat'].round(2).head(6).tolist()} …")
    if fc_pres is not None:
        print(f"  Pressure forecast  ({forecast_years}yr): {fc_pres[fc_pres['is_future']]['yhat'].round(1).head(6).tolist()} …")

    return {
        "forecast_temperature" : fc_temp,
        "forecast_pressure"    : fc_pres,
        "plot_path"            : saved_path,
        "actual_lat"           : actual_lat,
        "actual_lon"           : actual_lon,
    }


# ─────────────────────────────────────────────────────────────────────────────
#  CLI ENTRY-POINT
# ─────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="ERA5 Climate Time-Series Forecasting with Facebook Prophet",
        # Don't error if no args — we'll fall back to interactive prompts
        add_help=True,
    )
    parser.add_argument("--lat",   type=float, default=None, help="Latitude  (–90 to 90)")
    parser.add_argument("--lon",   type=float, default=None, help="Longitude (–180 to 180)")
    parser.add_argument("--years", type=int,   default=None, help="Forecast horizon in years (default: 5)")
    parser.add_argument("--out",   type=str,   default=None, help="Optional output PNG file path")

    args = parser.parse_args()

    # ── Interactive prompts if lat/lon not supplied via CLI ───────────────────
    if args.lat is None or args.lon is None:
        print("\n╔══════════════════════════════════════════════════╗")
        print("║   ERA5 Climate Forecast — Interactive Mode       ║")
        print("╚══════════════════════════════════════════════════╝")
        print("  Enter the location you want to forecast.")
        print("  (Tip: New Delhi = 28.61, 77.21 | London = 51.50, -0.12)\n")

        while True:
            try:
                lat_in = input("  Latitude  (–90 to  90): ").strip()
                args.lat = float(lat_in)
                if not (-90 <= args.lat <= 90):
                    raise ValueError
                break
            except ValueError:
                print("  ✗ Invalid. Please enter a decimal number between –90 and 90.")

        while True:
            try:
                lon_in = input("  Longitude (–180 to 180): ").strip()
                args.lon = float(lon_in)
                if not (-180 <= args.lon <= 180):
                    raise ValueError
                break
            except ValueError:
                print("  ✗ Invalid. Please enter a decimal number between –180 and 180.")

    if args.years is None:
        while True:
            try:
                yr_in = input("  Forecast horizon in years [default=5]: ").strip()
                args.years = int(yr_in) if yr_in else 5
                if args.years < 1:
                    raise ValueError
                break
            except ValueError:
                print("  ✗ Invalid. Please enter a positive integer (e.g. 5).")

    print()
    result = run_forecast(
        user_lat       = args.lat,
        user_lon       = args.lon,
        forecast_years = args.years,
        output_path    = args.out,
    )

    print(f"\nForecast plot: {result['plot_path']}")
