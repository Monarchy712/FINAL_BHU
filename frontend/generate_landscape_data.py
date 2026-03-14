"""
generate_landscape_data.py
Reads GlobalWeatherRepository.csv and regenerates city_landscape_data.json
with precise temperature, precipitation, and pressure data.
Also assigns climate_cluster based on real climate classification logic.

Key insight: precip_mm in csv is per hourly reading. 
Annual estimate = mean_precip_mm * 8760 (hours in a year)
"""

import pandas as pd
import numpy as np
import json
import os

CSV_PATH = 'src/data/GlobalWeatherRepository.csv'
OUTPUT_PATH = 'src/data/city_landscape_data.json'

def classify_climate(temp, annual_precip_mm, pressure):
    """
    Classify climate cluster based on temp, annual precipitation, and pressure.
    Uses simplified Köppen-Geiger inspired rules.
    annual_precip_mm is estimated by mean_per_reading * 8760
    """
    # Tropical: Hot + high rainfall
    if temp >= 22 and annual_precip_mm >= 1500:
        return 'Tropical'
    # Coastal: Moderate temp + some rainfall + near sea-level pressure
    elif temp >= 14 and annual_precip_mm >= 500 and pressure >= 990:
        return 'Coastal'
    # Polar: very cold OR very high altitude (low pressure)
    elif temp <= 0 or pressure < 700:
        return 'Polar'
    # Temperate: Mild temperature, decent rainfall
    elif temp >= 8 and annual_precip_mm >= 300:
        return 'Temperate'
    # Default: Arid (desert / dry steppe)
    else:
        return 'Arid'

def get_temp_trend(temps_series):
    """Determine temperature trend using linear regression over time."""
    if len(temps_series) < 3:
        return 'stable'
    x = np.arange(len(temps_series))
    slope = np.polyfit(x, temps_series, 1)[0]
    if slope > 0.03:
        return 'increasing'
    elif slope < -0.03:
        return 'decreasing'
    return 'stable'

def main():
    if not os.path.exists(CSV_PATH):
        print(f"Error: {CSV_PATH} not found")
        return

    print("Reading GlobalWeatherRepository.csv...")
    df = pd.read_csv(CSV_PATH)

    print("Available columns:", list(df.columns))
    print(f"Total records: {len(df)}")

    # Required columns
    required = ['location_name', 'country', 'temperature_celsius', 'precip_mm', 'pressure_mb']
    missing = [c for c in required if c not in df.columns]
    if missing:
        print(f"Missing columns: {missing}")
        return

    # Aggregate per city
    print("Aggregating per city...")
    grouped = df.groupby(['location_name', 'country'])

    results = []
    for (city, country), group in grouped:
        avg_temp = round(float(group['temperature_celsius'].mean()), 1)
        # store avg_precip in mm per reading (actual raw value for display)
        avg_precip_raw = round(float(group['precip_mm'].mean()), 2)
        # estimate annual precip for classification
        annual_precip = avg_precip_raw * 8760
        avg_press = round(float(group['pressure_mb'].mean()), 1)

        # Get temp trend
        temp_trend = get_temp_trend(group['temperature_celsius'].values)

        # Classify climate cluster using annual precipitation
        climate_cluster = classify_climate(avg_temp, annual_precip, avg_press)

        results.append({
            "city": city,
            "country": country,
            "avg_temp": avg_temp,
            "avg_press": avg_press,
            # Store annual_precip estimate (mm/year) for meaningful display
            "avg_precip": round(annual_precip, 0),
            "temp_trend": temp_trend,
            "climate_cluster": climate_cluster
        })

    # Sort alphabetically by city name
    results.sort(key=lambda x: x['city'])

    print(f"\nProcessed {len(results)} cities.")
    print(f"Sample: {results[0]}")

    # Show cluster distribution
    clusters = {}
    for r in results:
        c = r['climate_cluster']
        clusters[c] = clusters.get(c, 0) + 1
    print("Climate cluster distribution:", clusters)

    # Show some sample cities with their cluster
    print("\nSample cities with classification:")
    sample_cities = ['London', 'Singapore', 'Dubai', 'Moscow', 'Tokyo', 'Paris', 'Bangkok']
    for r in results:
        if r['city'] in sample_cities:
            print(f"  {r['city']} ({r['country']}): temp={r['avg_temp']}°C, annual_precip={r['avg_precip']}mm, cluster={r['climate_cluster']}")

    # Save output
    os.makedirs(os.path.dirname(OUTPUT_PATH), exist_ok=True)
    with open(OUTPUT_PATH, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"\nSuccessfully exported to {OUTPUT_PATH}")

if __name__ == '__main__':
    main()
