import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import json
import os
import sys

def preprocess(target_city):
    csv_path = 'src/data/GlobalWeatherRepository.csv'
    if not os.path.exists(csv_path):
        print(json.dumps({"error": "invalid input", "message": "Dataset not found"}))
        return

    df = pd.read_csv(csv_path)

    # Columns to keep for feature extraction
    # Temp, precip, humidity, pressure, and others in decreasing order of importance
    feature_cols = [
        'temperature_celsius', 
        'precip_mm',
        'humidity', 
        'pressure_mb',
        'wind_kph',
        'air_quality_PM2.5'
    ]

    # Weights for similarity calculation (Importance descending as requested)
    weights = {
        'temperature_celsius': 6.0,
        'precip_mm': 5.0,
        'humidity': 4.0,
        'pressure_mb': 3.0,
        'wind_kph': 1.5,
        'air_quality_PM2.5': 0.5
    }

    # Group by city and country to get average conditions
    grouped = df.groupby(['location_name', 'country']).mean(numeric_only=True).reset_index()

    # Ensure all required features exist
    available_cols = [c for c in feature_cols if c in grouped.columns]
    
    # Drop any rows with NaN values in core feature cols
    grouped = grouped.dropna(subset=available_cols)

    # Find the target city
    target_city_lower = target_city.lower().strip()
    source_row = None
    source_idx = -1
    
    # Look for exact or partial match
    for i, row in grouped.iterrows():
        if target_city_lower in str(row['location_name']).lower().strip():
            source_row = row
            source_idx = i
            break
            
    if source_row is None:
        print(json.dumps({"error": "invalid input", "message": "invalid input"}))  # Required by user
        return

    # Scale the features
    scaler = StandardScaler()
    scaled_features = scaler.fit_transform(grouped[available_cols])

    # Apply Weights to scaled features
    weighted_features = scaled_features.copy()
    for i, col in enumerate(available_cols):
        weighted_features[:, i] *= weights.get(col, 1.0)

    # Calculate distances
    target_features = weighted_features[source_idx]
    
    similarities = []
    
    for i, row in grouped.iterrows():
        if i == source_idx:
            continue
            
        dist_sq = np.sum((weighted_features[i] - target_features) ** 2)
        distance = np.sqrt(dist_sq)
        # Convert distance to percentage (heuristic scaling factor)
        sim = 100 * np.exp(-distance / 3.0)
        
        similarities.append({
            "city": row['location_name'],
            "country": row['country'],
            "sim": round(float(sim), 1),
            "temp": round(row['temperature_celsius'], 1),
            "pressure": round(row['pressure_mb'], 1),
            "humidity": round(row['humidity'], 0),
            "wind": round(row['wind_kph'], 1)
        })

    # Sort by similarity descending
    similarities.sort(key=lambda x: x['sim'], reverse=True)
    
    # Get top 5
    top_5 = similarities[:5]
    
    # Output as JSON
    print(json.dumps({
        "source": {
             "city": source_row['location_name'],
             "country": source_row['country']
        },
        "results": top_5
    }))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "invalid input", "message": "invalid input"}))
    else:
        target_city = " ".join(sys.argv[1:])
        preprocess(target_city)
