import json
import os
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# --- Configuration ---
PROCESSED_DATA_FILE = "processed_data.json"
RESCUE_HQ_COORDS = "18.9486,72.8336"
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

if not GOOGLE_MAPS_API_KEY:
    raise ValueError("Error: GOOGLE_MAPS_API_KEY environment variable is not set.")

# --- API Endpoints ---
@app.route('/get_sos_data', methods=['GET'])
def get_sos_data():
    # This function remains the same...
    print("\n--- Received request for SOS data ---")
    try:
        with open(PROCESSED_DATA_FILE, 'r', encoding='utf-8') as f:
            all_data = json.load(f)
        filtered_data = [
            item for item in all_data 
            if item.get("coordinates") and item.get("authenticity_score", 0) >= 4
        ]
        sorted_data = sorted(filtered_data, key=lambda x: x['severity_score'], reverse=True)
        print(f"Returning {len(sorted_data)} pre-processed and filtered messages.")
        return jsonify(sorted_data)
    except FileNotFoundError:
        return jsonify({"error": "Processed data file not found. Run the pre-processing script."}), 500
    except json.JSONDecodeError:
        return jsonify({"error": "Failed to decode the processed data file."}), 500

@app.route('/get_route', methods=['GET'])
def get_route():
    # This function remains the same...
    destination_lat = request.args.get('lat')
    destination_lng = request.args.get('lng')
    if not destination_lat or not destination_lng:
        return jsonify({"error": "Missing latitude or longitude parameters."}), 400
    destination_coords = f"{destination_lat},{destination_lng}"
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {'origin': RESCUE_HQ_COORDS, 'destination': destination_coords, 'key': GOOGLE_MAPS_API_KEY}
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

# ==============================================================================
# === NEW: API ENDPOINT FOR FINDING NEARBY PLACES OF INTEREST (POI) ===
# ==============================================================================
@app.route('/get_nearby_places', methods=['GET'])
def get_nearby_places():
    """
    Finds nearby hospitals, police stations, and fire stations for given coordinates.
    """
    lat = request.args.get('lat')
    lng = request.args.get('lng')
    if not lat or not lng:
        return jsonify({"error": "Missing latitude or longitude parameters."}), 400

    location = f"{lat},{lng}"
    radius = 5000  # Search within a 5km radius

    # A helper function to perform the search for a specific place type
    def find_places(place_type):
        url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"
        params = {
            'location': location,
            'radius': radius,
            'type': place_type,
            'key': GOOGLE_MAPS_API_KEY
        }
        try:
            response = requests.get(url, params=params)
            response.raise_for_status()
            results = response.json().get('results', [])
            # We only need the name and location for the map
            return [{"name": place['name'], "location": place['geometry']['location']} for place in results]
        except requests.exceptions.RequestException as e:
            print(f"Error finding {place_type}: {e}")
            return []

    # Perform searches for all three types
    hospitals = find_places('hospital')
    police_stations = find_places('police')
    fire_stations = find_places('fire_station')

    return jsonify({
        "hospitals": hospitals,
        "police_stations": police_stations,
        "fire_stations": fire_stations
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)