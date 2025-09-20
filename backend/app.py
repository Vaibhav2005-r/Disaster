import json
import os # Import the os module to get the API key
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Configuration ---
PROCESSED_DATA_FILE = "processed_data.json"

# Define the Rescue Headquarters location (Mumbai Police Headquarters)
RESCUE_HQ_COORDS = "18.9486,72.8336"

# Load the Google Maps key from environment variables for the Directions API
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

if not GOOGLE_MAPS_API_KEY:
    # This will stop the server if the key is not set, preventing runtime errors.
    raise ValueError("Error: GOOGLE_MAPS_API_KEY environment variable is not set.")


# --- API Endpoints ---

@app.route('/get_sos_data', methods=['GET'])
def get_sos_data():
    """
    Reads the pre-processed JSON file, filters it, and returns the data.
    This is extremely fast and uses no Gemini API credits.
    """
    print("\n--- Received request for SOS data ---")
    try:
        with open(PROCESSED_DATA_FILE, 'r', encoding='utf-8') as f:
            all_data = json.load(f)
        
        # Filter out messages that failed processing or have low authenticity
        filtered_data = [
            item for item in all_data 
            if item.get("coordinates") and item.get("authenticity_score", 0) >= 4
        ]
        
        # Sort the valid results by severity score, highest first
        sorted_data = sorted(filtered_data, key=lambda x: x['severity_score'], reverse=True)
        
        print(f"Returning {len(sorted_data)} pre-processed and filtered messages.")
        return jsonify(sorted_data)

    except FileNotFoundError:
        print(f"ERROR: The file {PROCESSED_DATA_FILE} was not found.")
        print("Please run 'python3 preprocess_data.py' first to generate it.")
        return jsonify({"error": "Processed data file not found. Run the pre-processing script."}), 500
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to decode the processed data file."}), 500

@app.route('/get_route', methods=['GET'])
def get_route():
    """
    Calculates the route from the Rescue HQ to a specific incident location.
    """
    destination_lat = request.args.get('lat')
    destination_lng = request.args.get('lng')

    if not destination_lat or not destination_lng:
        return jsonify({"error": "Missing latitude or longitude parameters."}), 400

    destination_coords = f"{destination_lat},{destination_lng}"
    print(f"Received route request from HQ ({RESCUE_HQ_COORDS}) to {destination_coords}")

    # Call the Google Directions API
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {
        'origin': RESCUE_HQ_COORDS,
        'destination': destination_coords,
        'key': GOOGLE_MAPS_API_KEY
    }

    try:
        response = requests.get(url, params=params)
        response.raise_for_status()
        directions = response.json()

        if directions['status'] == 'OK':
            route = directions['routes'][0]
            leg = route['legs'][0]
            
            route_info = {
                "distance": leg['distance']['text'],
                "duration": leg['duration']['text'],
                "overview_polyline": route['overview_polyline']['points']
            }
            return jsonify(route_info)
        else:
            return jsonify({"error": "Directions API could not find a route.", "status": directions['status']}), 404

    except requests.exceptions.RequestException as e:
        return jsonify({"error": f"Failed to call Directions API: {e}"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)