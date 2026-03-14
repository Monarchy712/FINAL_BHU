from flask import Flask, request, jsonify
from flask_cors import CORS
import sys
import os

# Import the preprocess function from the script we just wrote
from preprocess_cities import preprocess
import io
import contextlib

app = Flask(__name__)
CORS(app)  # Enable CORS for the React frontend

@app.route('/api/similarity', methods=['POST'])
def get_similar_cities():
    data = request.json
    if not data or 'city' not in data:
        return jsonify({"error": "invalid input", "message": "City not provided"}), 400
        
    city = data['city']
    
    # Capture the output of preprocess() which currently prints to stdout
    captured_output = io.StringIO()
    sys.stdout = captured_output
    try:
        preprocess(city)
    finally:
        sys.stdout = sys.__stdout__
        
    output_str = captured_output.getvalue().strip()
    
    try:
        result = json.loads(output_str)
        if "error" in result:
            return jsonify(result), 200
        return jsonify(result)
    except json.JSONDecodeError as e:
        print(f"JSON Decode Error! Output was: {output_str}")
        print(f"Error details: {e}")
        return jsonify({"error": "processing_error", "message": "Failed to process city data"}), 500

import json

if __name__ == '__main__':
    print("Starting ML API on port 5000...")
    app.run(debug=True, port=5000)
