import numpy as np
import xarray as xr
import pandas as pd
from sklearn.cluster import KMeans
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import Ridge

class ClimateInterpolator:
    def __init__(self, nc_path):
        self.nc_path = nc_path
        self._ds = None
        self._model_cache = {} 
        self._result_cache = {} 
        self._pre_sliced_ds = {} # Optimal city lookup cache

    @property
    def ds(self):
        if self._ds is None:
            self._ds = xr.open_dataset(self.nc_path)
            # Pre-load coordinate data to speed up processing
            self._ds.load()
            if float(self._ds.longitude.max()) > 180:
                self._ds = self._ds.assign_coords(longitude=(((self._ds.longitude + 180) % 360) - 180))
                self._ds = self._ds.sortby('longitude')
        return self._ds

    def pre_slice_cities(self, cities):
        """Pre-extract data for all target cities to optimize runtime performance."""
        for city in cities:
            lat, lon = city['lat'], city['lon']
            ds_city = self.ds.sel(latitude=lat, longitude=lon, method="nearest")
            actual_lat = float(ds_city.latitude)
            actual_lon = float(ds_city.longitude)
            # Store the pre-extracted data slice
            self._pre_sliced_ds[(actual_lat, actual_lon)] = ds_city.compute()

    def _get_model(self, lat, lon, var_name):
        # Use the pre-sliced data if available, otherwise fallback to sel()
        cache_key_geo = (lat, lon) # We need to check nearest match
        
        # Finding nearest in pre-sliced keys (efficient since only 46 keys)
        min_dist = float('inf')
        ds_city = None
        for (clat, clon), sliced_ds in self._pre_sliced_ds.items():
            dist = (clat - lat)**2 + (clon - lon)**2
            if dist < min_dist:
                min_dist = dist
                ds_city = sliced_ds
        
        if ds_city is None:
            ds_city = self.ds.sel(latitude=lat, longitude=lon, method="nearest")
            
        actual_lat = float(ds_city.latitude)
        actual_lon = float(ds_city.longitude)
        cache_key = (actual_lat, actual_lon, var_name)
        
        if cache_key in self._model_cache:
            return self._model_cache[cache_key]

        # Statistical Reconstruction via Ridge Regression (Seasonal + Trend)
        times = pd.to_datetime(ds_city.valid_time.values)
        data = ds_city[var_name].values
        
        df = pd.DataFrame({'time': times, 'val': data})
        df['year'] = (df['time'].dt.year - 1996) / 30.0 # Standardized year
        df['month'] = df['time'].dt.month
        
        train_df = df.dropna(subset=['val'])
        if len(train_df) < 3:
            return None

        # Features: Sin/Cos of month (season) + standardized Year (trend)
        X_train = np.column_stack([
            np.sin(2 * np.pi * train_df['month'] / 12),
            np.cos(2 * np.pi * train_df['month'] / 12),
            train_df['year'] 
        ])
        y_train = train_df['val'].values
        
        # Ridge is much faster than RandomForest for this simple seasonal + trend fit
        model = Ridge(alpha=0.01)
        model.fit(X_train, y_train)
        
        self._model_cache[cache_key] = model
        return model

    def get_annual_mean(self, lat, lon, year, var_name):
        cache_key = (lat, lon, year, var_name)
        if cache_key in self._result_cache:
            return self._result_cache[cache_key]

        # 1. Try to find raw data for this specific year first
        # We need to find the ds_city first
        ds_city = None
        for (clat, clon), sliced_ds in self._pre_sliced_ds.items():
            dist = (clat - lat)**2 + (clon - lon)**2
            if dist < 0.0001: # Direct match
                ds_city = sliced_ds
                break
        
        if ds_city is None:
            # Fallback coordinate search
            ds_city = self.ds.sel(latitude=lat, longitude=lon, method="nearest")
        
        # Check for data in target year
        # Convert valid_time to year components for efficient filtering
        times = pd.to_datetime(ds_city.valid_time.values)
        year_mask = (times.year == year)
        raw_values = ds_city[var_name].values[year_mask]
        raw_values = raw_values[~np.isnan(raw_values)]
        
        if len(raw_values) > 0:
            result = float(np.mean(raw_values))
            self._result_cache[cache_key] = result
            return result

        # 2. Fallback to Statistical Reconstruction (Ridge) if year is completely missing
        model = self._get_model(lat, lon, var_name)
        if model is None:
            return 0.0

        # Predict all 12 months for average with the specific target year
        months = np.arange(1, 13)
        std_year = (year - 1996) / 30.0
        X_pred = np.column_stack([
            np.sin(2 * np.pi * months / 12),
            np.cos(2 * np.pi * months / 12),
            np.full_like(months, std_year, dtype=float)
        ])
        predictions = model.predict(X_pred)
        result = float(np.mean(predictions))
        self._result_cache[cache_key] = result
        return result

    def get_monthly_profile(self, lat, lon, year, var_name):
        """Return a list of 12 monthly mean values for the given year/location/variable."""
        # Find pre-sliced city data
        ds_city = None
        for (clat, clon), sliced_ds in self._pre_sliced_ds.items():
            dist = (clat - lat)**2 + (clon - lon)**2
            if dist < 0.0001:
                ds_city = sliced_ds
                break

        if ds_city is None:
            ds_city = self.ds.sel(latitude=lat, longitude=lon, method="nearest")

        times = pd.to_datetime(ds_city.valid_time.values)
        year_mask = (times.year == year)
        raw_data = ds_city[var_name].values

        monthly = []
        for m in range(1, 13):
            month_mask = year_mask & (times.month == m)
            vals = raw_data[month_mask]
            vals = vals[~np.isnan(vals)]
            if len(vals) > 0:
                monthly.append(float(np.mean(vals)))
            else:
                # Fall back to Ridge prediction for this month
                model = self._get_model(lat, lon, var_name)
                if model is not None:
                    std_year = (year - 1996) / 30.0
                    X_pred = np.array([[
                        np.sin(2 * np.pi * m / 12),
                        np.cos(2 * np.pi * m / 12),
                        std_year
                    ]])
                    monthly.append(float(model.predict(X_pred)[0]))
                else:
                    monthly.append(0.0)
        return monthly

def apply_climate_clustering(cities_data):
    if not cities_data or len(cities_data) < 3:
        return cities_data

    # Extract features: Temp, Anomaly, Pressure, Precipitation
    features = []
    for c in cities_data:
        features.append([
            c.get("temp", 0),
            c.get("anomaly", 0),
            c.get("pressure", 0),
            c.get("precip", 0)
        ])
    
    X = np.array(features)
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Determine number of clusters
    n_clusters = min(4, len(cities_data))
    
    # Apply K-Means
    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
    clusters = kmeans.fit_predict(X_scaled)
    
    # Append cluster ID back to data
    for i, c in enumerate(cities_data):
        c["ml_cluster"] = int(clusters[i])
        
    return cities_data
