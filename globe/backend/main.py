from fastapi import FastAPI, Query, HTTPException
from fastapi.responses import PlainTextResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import re
import json
import asyncio
import httpx
from pydantic import BaseModel
from groq import AsyncGroq
from dotenv import load_dotenv
import xarray as xr
import numpy as np
import pandas as pd
import urllib.request
import json
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import LinearSegmentedColormap
from ml_utils import apply_climate_clustering, ClimateInterpolator
from forecast import run_forecast

load_dotenv()

# --- Guided Tour Config ---
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
if not GROQ_API_KEY:
    print("WARNING: GROQ_API_KEY is not set in environment variables.")

app = FastAPI()
groq_client = AsyncGroq(api_key=GROQ_API_KEY)

# --- Request model for Guided Tour ---
class TourRequest(BaseModel):
    location: str
    description: str

# --- Request model for Story Mode ---
class StoryRequest(BaseModel):
    location: str
    date: str  # YYYY-MM-DD

# ─────────────────────────────────────────────────────────────────────────────
#  STORY MODE: pre-stored phrase lookup tables
# ─────────────────────────────────────────────────────────────────────────────

# Temperature phrases (keyed by tier: 0=extreme cold … 6=extreme heat)
_TEMP_PHRASES = [
    "The air bites with a deep, bone-chilling cold — the kind that turns every breath into a small cloud and keeps the world wrapped in frost.",
    "A bitter chill hangs over everything, layers of clothing feel barely enough, and every gust of wind is an unwelcome reminder of winter's grip.",
    "Pleasantly cool with a crisp edge — perfect sweater weather, where the air feels refreshing and the world smells clean.",
    "Mild and comfortable, with temperatures sitting right in that sweet spot where neither coat nor fan is needed.",
    "Warm enough to feel the sun on your skin all day, the kind of heat that invites afternoon naps in the shade.",
    "Quite hot and muggy — steps slow down naturally, shade becomes precious, and cold drinks disappear fast.",
    "An oppressive, scorching heat — the pavement shimmers, the sky feels heavy, and venturing outside without protection is simply unwise.",
]

def _temp_tier(temp_c: float) -> int:
    """Map °C to a 0–6 tier index."""
    if temp_c < -10:   return 0
    if temp_c < 0:     return 1
    if temp_c < 10:    return 2
    if temp_c < 18:    return 3
    if temp_c < 26:    return 4
    if temp_c < 34:    return 5
    return 6

# Precipitation phrases (keyed by tier: 0=arid … 5=extreme wet)
_PRECIP_PHRASES = [
    "The skies are bone-dry — not a cloud dares to linger, and the earth has clearly gone weeks without so much as a drizzle.",
    "Rainfall is scarce and occasional at best, leaving the landscape parched and dusty under a relentless open sky.",
    "An average amount of moisture in the air — the odd shower passes through, but nothing remarkable either way.",
    "Noticeably wet, with regular rainfall keeping the ground damp and the air carrying that fresh, earthy petrichor.",
    "Heavy rains are frequent — streets can flood by afternoon, umbrellas live in bags, and the world smells permanently of damp soil.",
    "The skies open relentlessly — an almost tropical deluge, where the rain isn't so much falling as pouring in curtains.",
]

def _precip_tier(precip_mm: float) -> int:
    """Map annual mm to a 0–5 tier index."""
    if precip_mm < 50:    return 0
    if precip_mm < 200:   return 1
    if precip_mm < 450:   return 2
    if precip_mm < 700:   return 3
    if precip_mm < 1000:  return 4
    return 5

# Pressure phrases (keyed by tier: 0=very low … 4=very high)
_PRESSURE_PHRASES = [
    "Atmospheric pressure is unusually low — the air feels thin and heavy at once, a classic harbinger of stormy weather rolling in.",
    "Pressure is on the lower side, lending the air a restless, brooding quality — the kind of atmosphere that makes weather feel unpredictable.",
    "Pressure sits right around the norm — the atmosphere feels settled, with no dramatic weather signals in either direction.",
    "High pressure has settled in, bringing stable, clear conditions and a certain stillness to the air that feels almost imposed.",
    "Very high pressure dominates — skies are brilliantly clear, the air is crisp and dry, and the weather is almost unnaturally calm and settled.",
]

def _pressure_tier(hpa: float) -> int:
    """Map hPa to a 0–4 tier index."""
    if hpa < 990:    return 0
    if hpa < 1005:   return 1
    if hpa < 1020:   return 2
    if hpa < 1030:   return 3
    return 4

# Overall experience phrases — indexed as (temp_tier, precip_tier)
# We compute a combined "outdoor experience" from the top two variables.
_EXPERIENCE_PHRASES = {
    # (temp_tier 0-1 = cold, precip 0-1 = dry)
    (0, 0): "All told, stepping outside means braving a biting, dry cold — still and silent in a way that only deep winter can manage.",
    (0, 1): "Cold and mostly dry, like a clear winter's morning that demands full winter gear and rewards you with a sharp, invigorating clarity.",
    (0, 2): "Frigid and occasionally damp — a wintry mix where the chill seeps in from every direction.",
    (0, 3): "Bitterly cold with persistent rain or sleet — the worst of both worlds, making outdoors thoroughly inhospitable.",
    (0, 4): "Freezing rain and relentless wet — the streets are treacherous, the sky oppressive, and the outdoors best observed from a window.",
    (0, 5): "An extreme combination of arctic cold and heavy precipitation — conditions that halt everything and demand shelter.",
    (1, 0): "Cold and dry — the kind of weather where the air stings but at least stays honest. Good for a brisk walk if you dress for it.",
    (1, 1): "Chilly and relatively dry, with an occasional shower to keep things interesting. Coat weather, definitely.",
    (1, 2): "Cool with a decent chance of rain — carry an umbrella and dress in layers, and it's actually a pleasant enough day.",
    (1, 3): "Cold and frequently wet — outdoor plans need commitment and waterproofing.",
    (1, 4): "Raw and thoroughly wet, with heavy rain keeping temperatures feeling even lower than they are.",
    (1, 5): "Cold and pounded by rain — unpleasant by any measure, a day spent mostly indoors.",
    (2, 0): "Cool and dry, with a freshness to the air that makes even a short walk feel refreshing. Ideal conditions for most outdoor activities.",
    (2, 1): "Pleasantly cool with minimal rain — a great day for a walk or a run, with the sky doing its best impression of behaving.",
    (2, 2): "Mild and gently showery — the kind of weather that makes things green and smells like the earth is breathing.",
    (2, 3): "Cool but wet — rain arrives regularly enough to be part of the day's rhythm rather than a surprise.",
    (2, 4): "Crisp but drenched — the rain is a constant companion, turning paths into streams and making umbrellas a wardrobe essential.",
    (2, 5): "Cool but relentlessly rainy — the air is fresh but the skies never quite let up.",
    (3, 0): "Comfortable and dry — neither too hot nor too cold, with blue skies and a pleasant breeze. Frankly, ideal.",
    (3, 1): "Mild and mostly dry — a good day by most measures, with only occasional clouds interrupting the calm.",
    (3, 2): "Temperate with regular showers — pleasant between the rain, lively when it falls.",
    (3, 3): "Warm and noticeably wet — the humidity starts to creep up, and the frequent rain keeps things lush.",
    (3, 4): "Warm and very rainy — the kind of day where everything stays damp and the air smells perpetually of rain.",
    (3, 5): "Mild temperatures but absolutely relentless rain — a monsoon-like persistence that keeps most people indoors.",
    (4, 0): "Warm and gloriously dry — the sun has full reign here, and the outdoors rewards those who venture out with a golden, sun-soaked afternoon.",
    (4, 1): "Warm with only light rain at most — pleasant, summery conditions with occasional relief from a passing cloud.",
    (4, 2): "Warm and occasionally rainy — a comfortable heat with refreshing showers to keep things bearable.",
    (4, 3): "Warm and frequently wet — the heat makes the rain feel almost tropical, steamy and lush.",
    (4, 4): "Hot and perpetually rainy — oppressive in its humidity, with the heat making every raincloud feel like a small relief.",
    (4, 5): "Warm temperatures lost under unrelenting rain — stepping outside means accepting that you will be soaked within minutes.",
    (5, 0): "Hot and bone-dry — the sun is merciless, the air shimmers, and shade becomes the most valuable commodity around.",
    (5, 1): "Hot with only rare relief from rain — long, punishing days under a heavy sun with little respite.",
    (5, 2): "Hot and occasionally stormy — the heat builds until afternoon thunderstorms crash in, releasing tension as much as rain.",
    (5, 3): "Hot and damp — a humid, sticky combination where sweating barely helps and the world feels wrapped in a warm, wet blanket.",
    (5, 4): "Sweltering heat meets heavy rain — the air is thick and steamy, every surface damp, the outdoors both exhausting and drenching.",
    (5, 5): "Extreme heat combined with near-constant rain — a tropical intensity that makes outdoor life a constant negotiation with the elements.",
    (6, 0): "Scorching and arid — a furnace-like heat that bakes everything in sight. Sunscreen, water, and shade are non-negotiable survival tools.",
    (6, 1): "Extreme heat with very little rain — the landscape bakes and cracks, and even the hardy seek shelter by midday.",
    (6, 2): "Fiercely hot with occasional rains that evaporate almost before they hit the ground, doing little to relieve the oppressive heat.",
    (6, 3): "Blistering heat paired with regular rain — a brutal tropical combination that makes the outdoors feel like a sauna at full blast.",
    (6, 4): "Extreme heat and heavy, frequent rain — the rare, punishing conditions of a rainforest in high summer, overwhelming in every sense.",
    (6, 5): "An almost elemental ferocity — the heat is extreme and the rains torrential, the kind of weather that simply commands respect and surrender.",
}

def _get_experience(temp_tier: int, precip_tier: int) -> str:
    key = (temp_tier, min(precip_tier, 5))
    return _EXPERIENCE_PHRASES.get(key, "A day that defies easy description — the elements conspire in unexpected ways, and only those who venture outside will truly know.")

# Season names by month
_SEASON_LABELS = {
    12: "deep winter", 1: "deep winter", 2: "late winter",
    3: "early spring", 4: "spring", 5: "late spring",
    6: "early summer", 7: "midsummer", 8: "late summer",
    9: "early autumn", 10: "autumn", 11: "late autumn",
}

# --- Geocode via Nominatim ---
async def geocode_city(city_name: str) -> dict | None:
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(
                "https://nominatim.openstreetmap.org/search",
                params={"q": city_name, "format": "json", "limit": 1},
                headers={"User-Agent": "AI-Guided-Globe-Tour/1.0"},
            )
            data = resp.json()
            if data:
                return {"lat": float(data[0]["lat"]), "lng": float(data[0]["lon"])}
    except Exception as e:
        print(f'Geocode failed for "{city_name}": {e}')
    return None

CITIES = [
    # North America
    {"name": "New York", "lat": 40.7128, "lon": -74.0060},
    {"name": "Los Angeles", "lat": 34.0522, "lon": -118.2437},
    {"name": "Toronto", "lat": 43.6510, "lon": -79.3470},
    {"name": "Mexico City", "lat": 19.4326, "lon": -99.1332},
    {"name": "Chicago", "lat": 41.8781, "lon": -87.6298},
    {"name": "Houston", "lat": 29.7604, "lon": -95.3698},
    {"name": "Miami", "lat": 25.7617, "lon": -80.1918},
    {"name": "Vancouver", "lat": 49.2827, "lon": -123.1207},
    {"name": "Seattle", "lat": 47.6062, "lon": -122.3321},
    {"name": "Montreal", "lat": 45.5017, "lon": -73.5673},
    {"name": "Havana", "lat": 23.1136, "lon": -82.3666},

    # South America
    {"name": "Rio de Janeiro", "lat": -22.9068, "lon": -43.1729},
    {"name": "Buenos Aires", "lat": -34.6037, "lon": -58.3816},
    {"name": "Lima", "lat": -12.0464, "lon": -77.0428},
    {"name": "Sao Paulo", "lat": -23.5505, "lon": -46.6333},
    {"name": "Bogota", "lat": 4.7110, "lon": -74.0721},
    {"name": "Santiago", "lat": -33.4489, "lon": -70.6693},
    {"name": "Caracas", "lat": 10.4806, "lon": -66.9036},
    {"name": "Quito", "lat": -0.1807, "lon": -78.4678},
    {"name": "La Paz", "lat": -16.4897, "lon": -68.1193},

    # Europe
    {"name": "London", "lat": 51.5074, "lon": -0.1278},
    {"name": "Moscow", "lat": 55.7558, "lon": 37.6173},
    {"name": "Paris", "lat": 48.8566, "lon": 2.3522},
    {"name": "Istanbul", "lat": 41.0082, "lon": 28.9784},
    {"name": "Reykjavik", "lat": 64.1466, "lon": -21.9426},
    {"name": "Berlin", "lat": 52.5200, "lon": 13.4050},
    {"name": "Madrid", "lat": 40.4168, "lon": -3.7038},
    {"name": "Rome", "lat": 41.9028, "lon": 12.4964},
    {"name": "Athens", "lat": 37.9838, "lon": 23.7275},
    {"name": "Stockholm", "lat": 59.3293, "lon": 18.0686},
    {"name": "Oslo", "lat": 59.9139, "lon": 10.7522},
    {"name": "Kyiv", "lat": 50.4501, "lon": 30.5234},
    {"name": "Vienna", "lat": 48.2082, "lon": 16.3738},
    {"name": "Warsaw", "lat": 52.2297, "lon": 21.0122},

    # Africa
    {"name": "Cairo", "lat": 30.0444, "lon": 31.2357},
    {"name": "Johannesburg", "lat": -26.2041, "lon": 28.0473},
    {"name": "Nairobi", "lat": -1.2921, "lon": 36.8219},
    {"name": "Lagos", "lat": 6.5244, "lon": 3.3792},
    {"name": "Kinshasa", "lat": -4.4419, "lon": 15.2663},
    {"name": "Casablanca", "lat": 33.5731, "lon": -7.5898},
    {"name": "Addis Ababa", "lat": 9.0320, "lon": 38.7482},
    {"name": "Dakar", "lat": 14.7167, "lon": -17.4677},
    {"name": "Algiers", "lat": 36.7538, "lon": 3.0588},
    {"name": "Cape Town", "lat": -33.9249, "lon": 18.4241},
    {"name": "Accra", "lat": 5.6037, "lon": -0.1870},

    # Asia & Middle East
    {"name": "Tokyo", "lat": 35.6762, "lon": 139.6503},
    {"name": "Mumbai", "lat": 19.0760, "lon": 72.8777},
    {"name": "Beijing", "lat": 39.9042, "lon": 116.4074},
    {"name": "Dubai", "lat": 25.2048, "lon": 55.2708},
    {"name": "Singapore", "lat": 1.3521, "lon": 103.8198},
    {"name": "Seoul", "lat": 37.5665, "lon": 126.9780},
    {"name": "Bangkok", "lat": 13.7563, "lon": 100.5018},
    {"name": "Jakarta", "lat": -6.2088, "lon": 106.8456},
    {"name": "Shanghai", "lat": 31.2304, "lon": 121.4737},
    {"name": "New Delhi", "lat": 28.6139, "lon": 77.2090},
    {"name": "Manila", "lat": 14.5995, "lon": 120.9842},
    {"name": "Bangalore", "lat": 12.9716, "lon": 77.5946},
    {"name": "Karachi", "lat": 24.8607, "lon": 67.0011},
    {"name": "Dhaka", "lat": 23.8103, "lon": 90.4125},
    {"name": "Tehran", "lat": 35.6892, "lon": 51.3890},
    {"name": "Riyadh", "lat": 24.7136, "lon": 46.6753},
    {"name": "Tashkent", "lat": 41.2995, "lon": 69.2401},
    {"name": "Jerusalem", "lat": 31.7683, "lon": 35.2137},
    {"name": "Kuala Lumpur", "lat": 3.1390, "lon": 101.6869},
    {"name": "Ho Chi Minh", "lat": 10.8231, "lon": 106.6297},

    # Oceania & Remote
    {"name": "Sydney", "lat": -33.8688, "lon": 151.2093},
    {"name": "Melbourne", "lat": -37.8136, "lon": 144.9631},
    {"name": "Auckland", "lat": -36.8485, "lon": 174.7633},
    {"name": "Perth", "lat": -31.9505, "lon": 115.8605},
    {"name": "Honolulu", "lat": 21.3069, "lon": -157.8583},
    {"name": "Fiji (Suva)", "lat": -18.1416, "lon": 178.4419},
    {"name": "Port Moresby", "lat": -9.4431, "lon": 147.1803},
    {"name": "Nuuk", "lat": 64.1814, "lon": -51.6941}, # Greenland
    {"name": "Antarctica (McMurdo)", "lat": -77.8463, "lon": 166.6682},
]

NC_FILE = "./temperature.nc"

# Helper for Safe ML Interpolators 
def safe_load_interpolator(path, cities=None):
    if not os.path.exists(path):
        print(f"WARNING: Data file {path} not found. Some features will be disabled.")
        return None
    try:
        interp = ClimateInterpolator(path)
        if cities:
            interp.pre_slice_cities(cities)
        return interp
    except Exception as e:
        print(f"ERROR: Failed to load {path}: {e}")
        return None

# ML Interpolators for Spatial Globe
spatial_interpolator = safe_load_interpolator("./all3.nc", CITIES)
precip_interpolator = safe_load_interpolator("./all.nc", CITIES)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# Endpoint for frontend to fetch city list (name, lat, lon)
@app.get("/cities-list")
def get_cities_list():
    return {"cities": CITIES}

# Serve static files
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "tiles"), exist_ok=True)
os.makedirs(os.path.join(static_dir, "forecasts"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

class ForecastRequest(BaseModel):
    lat: float
    lon: float
    years: int = 5

@app.post("/forecast")
def generate_forecast(req: ForecastRequest):
    try:
        result = run_forecast(user_lat=req.lat, user_lon=req.lon, forecast_years=req.years)
        plot_filename = os.path.basename(result["plot_path"])
        # Use relative paths or dynamic host for production
        static_url = f"/static/forecasts/{plot_filename}"
        return {"status": "success", "image_url": static_url}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}

def generate_image_for_date(year: int, month: int, day: int) -> str:
    """
    Selects the closest timestep in the dataset for the given year/month/day
    and saves a transparent-background heatmap PNG for Cesium overlay.
    """
    if not os.path.exists(NC_FILE):
        print("WARNING: temperature.nc not found. Using placeholder image.")
        return "placeholder.png" # Assuming you handle this or let it 404 gracefully

    ds = xr.open_dataset(NC_FILE)

    # Find closest time index using fractional-year arithmetic
    if np.issubdtype(ds.time.dtype, np.floating):
        target_frac = year + (month - 0.5) / 12.0
        idx = np.argmin(np.abs(ds.time.values - target_frac))
    else:
        ds['time_dt'] = ds.time
        target_date = pd.Timestamp(year=year, month=month, day=day)
        idx = np.argmin(np.abs(ds['time_dt'].values - target_date))

    # Select temperature slice (anomaly) and reconstruct absolute temperature
    # by adding the climatological baseline for the requested month (0-indexed)
    anomaly = ds.temperature.isel(time=idx).values          # (lat, lon)
    clim    = ds.climatology.isel(month_number=month-1).values  # (lat, lon)
    # The anomaly is very small (±2-3 degrees) compared to the ±40 degree absolute scale,
    # so year-to-year changes are hard to see. Multiply anomaly by 3 to exaggerate it visually.
    temp_slice = (anomaly * 3.0) + clim  # emphasized absolute temperature

    # Apply land mask if available to clip to land borders
    if 'land_mask' in ds:
        mask = ds.land_mask.values
        # Set ocean values (where mask is 0) to NaN to make them transparent
        temp_slice = np.where(mask > 0.5, temp_slice, np.nan)

    # Build a masked array so matplotlib treats NaNs as transparent
    data = np.ma.masked_invalid(temp_slice)

    # Render with matplotlib: transparent background, no axes/borders
    # Custom vivid colormap: blue → cyan → green → yellow → red (no white)
    cmap = LinearSegmentedColormap.from_list(
        'vivid_temp',
        ['#0000cc', '#00aaff', '#00dd88', '#00ff00', '#aaff00', '#ffcc00', '#ff4400', '#cc0000'],
    )
    cmap.set_bad(alpha=0)  # NaN cells → fully transparent

    fig, ax = plt.subplots(figsize=(3.6, 1.8), dpi=100)
    fig.patch.set_alpha(0)
    ax.imshow(
        data,
        cmap=cmap,
        origin='lower',
        aspect='auto',
        vmin=-15,   # °C — shifted up so Greenland/Arctic easily hits saturated deep blue
        vmax=45,    # °C — shifted up so Sahara is red and India is orange
    )
    fig, ax = plt.subplots(figsize=(3.6, 1.8), dpi=100)
    fig.patch.set_alpha(0)
    ax.imshow(
        data,
        cmap=cmap,
        origin='lower',
        aspect='auto',
        vmin=-15,   # °C — shifted up so Greenland/Arctic easily hits saturated deep blue
        vmax=45,    # °C — shifted up so Sahara is red and India is orange
    )
    ax.axis('off')
    fig.subplots_adjust(left=0, right=1, top=1, bottom=0)

    filename = f"temp_{year}-{month:02d}-{day:02d}.png"
    output_path = os.path.join("./static/tiles", filename)
    fig.savefig(output_path, dpi=100, transparent=True, bbox_inches='tight', pad_inches=0)
    plt.close(fig)

    return filename

@app.get("/generate_image")
def generate_image(year: int = Query(...), month: int = Query(...), day: int = Query(...)):
    filename = generate_image_for_date(year, month, day)
    return PlainTextResponse(f"/static/tiles/{filename}")

@app.get("/city_data")
def city_data(year: int = Query(...)):
    if not os.path.exists(NC_FILE):
        return {"cities": [], "year": year, "error": "Climate data file (temperature.nc) not found on server."}
        
    ds = xr.open_dataset(NC_FILE)
    times = ds.time.values  # fractional years

    # Find all timesteps within the requested year
    year_mask = (times >= year) & (times < year + 1)
    year_indices = np.where(year_mask)[0]

    if len(year_indices) == 0:
        return {"cities": [], "year": year, "error": "No data for this year"}

    # Check if longitude uses 0-360 range
    lon_min = float(ds.longitude.min())
    lon_max = float(ds.longitude.max())
    uses_0_360 = lon_min >= 0 and lon_max > 180

    results = []
    for city in CITIES:
        try:
            city_lon = city["lon"]
            if uses_0_360 and city_lon < 0:
                city_lon = city_lon + 360

            # Get all temperature values for this year at this location
            temps = []
            clims = []
            for i, idx in enumerate(year_indices):
                t = float(ds.temperature.isel(time=int(idx)).sel(
                    latitude=city["lat"], longitude=city_lon, method="nearest"
                ).values)
                # month_number is 0-indexed in the slice
                month_num = i % 12
                c = float(ds.climatology.isel(month_number=month_num).sel(
                    latitude=city["lat"], longitude=city_lon, method="nearest"
                ).values)
                temps.append(t)
                clims.append(c)

            mean_anomaly = float(np.nanmean(temps))
            mean_clim = float(np.nanmean(clims))
            
            mean_anomaly = float(np.nanmean(temps))
            mean_clim = float(np.nanmean(clims))
            
            if np.isnan(mean_anomaly) or np.isnan(mean_clim):
                continue
                
            mean_abs = round((mean_anomaly * 3.0) + mean_clim, 2)

            results.append({
                "name": city["name"],
                "lat": city["lat"],
                "lon": city["lon"],
                "temp": mean_abs,
                "anomaly": round(mean_anomaly, 2),
                "pressure": 0.0,
                "precip": 0.0
            })
        except Exception as e:
            print(f"Error for {city['name']} (Intensity): {e}")

    return {"cities": results, "year": year}

@app.get("/city_data_spatial")
def city_data_spatial(year: int = Query(...)):
    """
    New endpoint for Spatial Globe using all3.nc and ML interpolation
    """
    if not spatial_interpolator or not precip_interpolator:
         return {"cities": [], "year": year, "error": "Climate ML models not loaded (data files missing)."}

    results = []
    for city in CITIES:
        try:
            # Temperature (t2m)
            temp_k = spatial_interpolator.get_annual_mean(city["lat"], city["lon"], year, "t2m")
            temp_c = round(temp_k - 273.15, 2)
            
            # Anomaly (compared to 20th century avg approx)
            anomaly = round(temp_c - 14.0, 2) 
            
            # Pressure (sp) - Convert Pa to hPa
            pressure_pa = spatial_interpolator.get_annual_mean(city["lat"], city["lon"], year, "sp")
            pressure_hpa = round(pressure_pa / 100.0, 1) if pressure_pa > 0 else 1013.2
            
            # Precip (tp) - ERA5 unit is meters, convert to mm
            try:
                precip_m = precip_interpolator.get_annual_mean(city["lat"], city["lon"], year, "tp")
                precip_mm = round(precip_m * 1000.0, 2)
            except:
                precip_mm = 0.0
            
            results.append({
                "name": city["name"],
                "lat": city["lat"],
                "lon": city["lon"],
                "temp": temp_c,
                "anomaly": anomaly,
                "pressure": pressure_hpa,
                "precip": precip_mm
            })
        except Exception as e:
            print(f"Error for {city['name']} (Spatial): {e}")
            
    # Apply ML clustering
    clustered_results = apply_climate_clustering(results)
    return {"cities": clustered_results, "year": year}

@app.post("/generate-tour")
async def generate_tour(body: TourRequest):
    location = body.location.strip()
    description = body.description.strip()

    if not location or not description:
        raise HTTPException(status_code=400, detail="location and description are required.")

    print(f'\n🗺️  Tour request — city: "{location}"')

    # ── Step 1: Groq narration ────────────────────────────────────────────────
    print("Step 1: Calling Groq...")
    prompt = f"""Role:
You are a High-Drama Cinematic Travel Storyteller who narrates journeys like an epic documentary voiceover.

Traveler Profile:
Interests: {description}
Origin City (Primary Anchor): {location}

Objective:
Create a dramatic four-city “Discovery Epic” exploring cities within approximately 750 km of {location}.
The journey must revolve around {location} as the central reference point.

City Selection Rules:

1. Primary Anchor Rule
{location} is the center of the journey.
Select exactly four major cities within approximately 750 km of {location}.

2. Interest City Rule
If {description} contains a specific city name, then:
Include one city geographically close to that mentioned city (within about 300 km if possible).
This city should still be within the 750 km radius of {location} whenever feasible.

3. Regional Relevance
Cities should be major, culturally or climatically distinct places.
Avoid obscure towns unless the traveler profile strongly suggests them.

Narration Requirements:

For each of the four cities, write one paragraph of approximately 35 words.

Each paragraph must include the following elements:

1. Cinematic Tone
Use highly evocative, dramatic narration.
The tone should feel like an epic travel documentary voiceover.

2. Climate Focus
Describe the climate and atmospheric feel of the city.
Highlight weather, air, temperature, terrain, and seasonal mood.

3. Comparison Rule
At least two of the four cities must include a dramatic comparison.
Compare their climate or atmosphere to {location}, or compare them to the previous city in the journey.

4. Personalization
Naturally weave elements from {description} into the narrative.
Make the journey feel uniquely designed for this traveler.

Do not choose one of the 4 cities as the origin city {location} or any of the cities mentioned in {description}. Use for comparison only.

Return ONLY valid JSON in this exact format:

{{
  "cities": [
    {{ "name": "...", "paragraph": "..." }},
    {{ "name": "...", "paragraph": "..." }},
    {{ "name": "...", "paragraph": "..." }},
    {{ "name": "...", "paragraph": "..." }}
  ]
}}

Rules:
- Return exactly four cities within 750km of {location}.
- Tone: High-drama, theatrical, and deeply personal.
- Each paragraph must be exactly between 30 and 42 words.
- Do not include any explanation or text outside the JSON."""

    try:
        chat_completion = await groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=800,
        )
    except Exception as e:
        print(f"Groq API error: {e}")
        raise HTTPException(status_code=500, detail=f"AI service error: {e}")

    raw_content = chat_completion.choices[0].message.content or ""
    print("Groq response:", raw_content[:500])

    # ── Step 2: Parse JSON ────────────────────────────────────────────────────
    json_match = re.search(r"\{[\s\S]*\}", raw_content)
    if not json_match:
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")

    try:
        parsed = json.loads(json_match.group())
    except json.JSONDecodeError as e:
        print(f"JSON parse error: {e}")
        raise HTTPException(status_code=500, detail="Failed to parse AI response. Please try again.")

    city_items = parsed.get("cities", [])
    if not isinstance(city_items, list) or len(city_items) == 0:
        print(f"Bad structure from Groq: {parsed}")
        raise HTTPException(status_code=500, detail="AI returned unexpected format. Please try again.")

    print("Cities from Groq:", ", ".join(c["name"] for c in city_items))

    # ── Step 3: Geocode all cities concurrently ───────────────────────────────
    print("Step 3: Geocoding cities...")
    geocode_tasks = [
        geocode_city(item["name"]) for item in city_items
    ]
    coords_list = await asyncio.gather(*geocode_tasks)

    cities = []
    for item, coords in zip(city_items, coords_list):
        if coords:
            cities.append({"name": item["name"], "paragraph": item["paragraph"], **coords})

    if not cities:
        raise HTTPException(status_code=500, detail="Could not geocode any cities. Please try again.")

    print("Cities resolved:", ", ".join(c["name"] for c in cities))
    print("✅ Tour generation complete.")

    return {"cities": cities}


# ─────────────────────────────────────────────────────────────────────────────
#  STORY MODE endpoint
# ─────────────────────────────────────────────────────────────────────────────

@app.post("/generate-story")
async def generate_story(body: StoryRequest):
    location = body.location.strip()
    date_str  = body.date.strip()

    if not location or not date_str:
        raise HTTPException(status_code=400, detail="location and date are required.")

    # Parse date
    try:
        parsed_date = pd.Timestamp(date_str)
        year  = parsed_date.year
        month = parsed_date.month
    except Exception:
        raise HTTPException(status_code=400, detail="date must be in YYYY-MM-DD format.")

    print(f"\n📖 Story request — location: \"{location}\", date: {date_str}")

    # Step 1: Geocode
    coords = await geocode_city(location)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Could not find location: {location}")

    lat, lon = coords["lat"], coords["lng"]
    print(f"   Resolved to lat={lat:.2f}, lon={lon:.2f}")

    # Step 2: Extract climate values from ML interpolators
    try:
        # Temperature in °C (all3.nc  → t2m in Kelvin)
        temp_k   = spatial_interpolator.get_annual_mean(lat, lon, year, "t2m")
        temp_c   = round(temp_k - 273.15, 2)

        # Surface pressure in hPa (all3.nc → sp in Pa)
        pressure_pa  = spatial_interpolator.get_annual_mean(lat, lon, year, "sp")
        pressure_hpa = round(pressure_pa / 100.0, 1) if pressure_pa > 0 else 1013.25

        # Annual-equivalent precipitation in mm (all.nc → tp in metres/timestep, ERA5 monthly)
        monthly_precip_m = precip_interpolator.get_monthly_profile(lat, lon, year, "tp")
        # ERA5 tp is accumulated per timestep; sum all months × 1000 for mm/year equivalent
        annual_precip_mm = sum(monthly_precip_m) * 1000.0

        print(f"   temp={temp_c:.1f}°C  pressure={pressure_hpa:.0f}hPa  precip≈{annual_precip_mm:.0f}mm")

    except Exception as e:
        print(f"   Climate extraction error: {e}")
        # Fallback values if extraction fails (e.g. data missing)
        temp_c, pressure_hpa, annual_precip_mm = 20.0, 1013.25, 500.0
        # raise HTTPException(status_code=500, detail="Failed to extract climate data for this location/year.")

    print(f"   temp={temp_c:.1f}°C  pressure={pressure_hpa:.0f}hPa  precip≈{annual_precip_mm:.0f}mm")

    # Step 3: Compute tiers
    t_tier = _temp_tier(temp_c)
    p_tier = _precip_tier(annual_precip_mm)
    pr_tier = _pressure_tier(pressure_hpa)

    # Step 4: Build story phrases
    season_label = _SEASON_LABELS.get(month, "that time of year")
    title_date   = parsed_date.strftime("%#d %B %Y")   # e.g. "15 July 1995"

    story = {
        "title":    location,
        "subtitle": f"{title_date} — {season_label}",
        "chapters": [
            {
                "icon":    "🌡️",
                "heading": "The Temperature",
                "line":    _TEMP_PHRASES[t_tier],
            },
            {
                "icon":    "🌧️",
                "heading": "The Rain",
                "line":    _PRECIP_PHRASES[p_tier],
            },
            {
                "icon":    "🌬️",
                "heading": "The Pressure",
                "line":    _PRESSURE_PHRASES[pr_tier],
            },
            {
                "icon":    "🌍",
                "heading": "What it's like outside",
                "line":    _get_experience(t_tier, p_tier),
            },
        ]
    }

    meta = {
        "location": location,
        "lat": round(lat, 4),
        "lon": round(lon, 4),
        "date": date_str,
        "year": year,
        "month": month,
        "season": season_label,
        "temp_tier": t_tier,
        "precip_tier": p_tier,
        "pressure_tier": pr_tier,
    }

    print("✅ Story generated.")
    return {"story": story, "meta": meta}


# Serving the built frontend
frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
if not os.path.exists(frontend_dist):
    frontend_dist = os.path.join(os.path.dirname(__file__), "static") # Fallback to internal static

app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="frontend")