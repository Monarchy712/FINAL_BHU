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

# ML Interpolators for Spatial Globe
spatial_interpolator = ClimateInterpolator("./all3.nc")
spatial_interpolator.pre_slice_cities(CITIES)

precip_interpolator = ClimateInterpolator("./all.nc")
precip_interpolator.pre_slice_cities(CITIES)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"]
)

# Serve static files
os.makedirs("./static/tiles", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

def generate_image_for_date(year: int, month: int, day: int) -> str:
    """
    Selects the closest timestep in the dataset for the given year/month/day
    and saves a transparent-background heatmap PNG for Cesium overlay.
    """
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

app.mount("/", StaticFiles(directory="../frontend", html=True), name="frontend")