# Antigravity Automation Script: Future Predictor Integration

**ATTENTION FELLOW AI:** 
The user has transported this `predictor_dir` folder to a clean build of their project. Your directive is to seamlessly integrate the contents of this folder into their active repository. 

Follow these steps exactly in sequence using your code modification tools.

## Phase 1: File Migration

The user's repository root represents the active project. Move these files from this `predictor_dir` folder into their proper destinations:

1. **Move `forecast.py`** -> `globe/backend/forecast.py`
2. **Move `predictor.html`** -> `frontend/public/predictor.html` (Note: Place it in the React `public` folder so it acts as a static unrouted page).

*(Note: The `all.nc` and `all3.nc` files are already located natively inside the destination's `globe/backend/` folder! You do not need to move any datasets.)*

## Phase 2: React Dashboard Update

1. Read `frontend/src/pages/Researchers.tsx`.
2. Locate the "Future Predictor" UI card (around lines 365-375).
3. Using your `multi_replace_file_content` tool, add the `cursor-pointer` class and an `onClick` parameter to the main wrapper `div` of that card:
```tsx
onClick={() => window.location.href = '/predictor.html'}
```
*This instantly wires up the static frontend page you placed in the public folder.*

## Phase 3: FastAPI Backend Injection

You must add the forecasting logic to `globe/backend/main.py`.

1. **Imports:** Add `import os`, `from pydantic import BaseModel`, and `from forecast import run_forecast` to the top of the file.
2. **CORS:** Ensure `CORSMiddleware` in `main.py` explicitly has `allow_credentials=True` and `allow_origins=["*"]`.
3. **Static Mounting:** Before any catch-all routes like `app.mount("/", ...)`, you must inject this logic to serve the generated plot images:
```python
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(os.path.join(static_dir, "forecasts"), exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")
```
4. **The Route:** Append this endpoint logic to the file:
```python
class ForecastRequest(BaseModel):
    lat: float
    lon: float
    years: int = 5

@app.post("/forecast")
def generate_forecast(req: ForecastRequest):
    try:
        result = run_forecast(user_lat=req.lat, user_lon=req.lon, forecast_years=req.years)
        plot_filename = os.path.basename(result["plot_path"])
        static_url = f"http://localhost:8000/static/forecasts/{plot_filename}"
        return {"status": "success", "image_url": static_url}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": str(e)}
```

## Phase 4: Verification

1. Run `pip install prophet xarray netcdf4 matplotlib` in the `globe/backend` directory.
2. Tell the user the integration is complete and verify that `uvicorn` and `npm run dev` start successfully!
