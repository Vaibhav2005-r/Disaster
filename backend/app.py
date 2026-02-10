import json
import os
import requests
from datetime import datetime
from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# --- Configuration ---
PROCESSED_DATA_FILE = "processed_data.json"
RESCUE_HQ_COORDS = "18.9486,72.8336"
GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")

if not GOOGLE_MAPS_API_KEY:
    print("Warning: GOOGLE_MAPS_API_KEY not found in environment. Checking .env file...")
    # Double check if .env exists
    if os.path.exists(".env"):
        print(".env file found.")
    else:
        print(".env file NOT found.")
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

@app.route('/get_situation_update', methods=['GET'])
def get_situation_update():
    from ai_core import generate_situation_report
    try:
        report = generate_situation_report()
        return jsonify(report)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/get_route', methods=['GET'])
def get_route():
    # This function remains the same...
    destination_lat = request.args.get('lat')
    destination_lng = request.args.get('lng')
    start_lat = request.args.get('start_lat')
    start_lng = request.args.get('start_lng')
    
    if not destination_lat or not destination_lng:
        return jsonify({"error": "Missing latitude or longitude parameters."}), 400
    
    origin = f"{start_lat},{start_lng}" if start_lat and start_lng else RESCUE_HQ_COORDS
    destination_coords = f"{destination_lat},{destination_lng}"
    
    url = "https://maps.googleapis.com/maps/api/directions/json"
    params = {'origin': origin, 'destination': destination_coords, 'key': GOOGLE_MAPS_API_KEY}
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

# ==============================================================================
# === NEW: REPORT INCIDENT ENDPOINT ===
# ==============================================================================
@app.route('/report_incident', methods=['POST'])
def report_incident():
    data = request.json
    print(f"Received new incident report: {data}")
    
    # 1. Basic Validation
    if not data or 'description' not in data or 'lat' not in data or 'lng' not in data:
        return jsonify({"error": "Missing required fields (description, lat, lng)"}), 400

    # 2. Simulate AI Analysis (or use real AI if key exists)
    # In a real scenario, we would send 'data['description']' to Gemini here.
    # For now, we will auto-generate some fields based on the description to keep it fast/responsive.
    
    description = data['description']
    
    # Simple keyword based classification for the demo
    urgency = "Urgent"
    severity = 5
    need = "General Assistance"
    
    desc_lower = description.lower()
    if "fire" in desc_lower or "explosion" in desc_lower:
        urgency = "Life-threatening"
        severity = 9
        need = "Firefighters"
    elif "flood" in desc_lower or "drowning" in desc_lower:
        urgency = "Life-threatening"
        severity = 8
        need = "Rescue Boat"
    elif "medical" in desc_lower or "blood" in desc_lower or "heart" in desc_lower:
        urgency = "Life-threatening"
        severity = 9
        need = "Medical Support"
    
    new_incident = {
        "id": int(str(int(data['lat'] * 1000)) + str(int(data['lng'] * 1000))), # Fake ID generation
        "original_message": description,
        "location_text": "User Reported Location",
        "urgency": urgency,
        "need_type": need,
        "summary": description,
        "severity_score": severity,
        "coordinates": {
            "lat": float(data['lat']),
            "lng": float(data['lng'])
        },
        "authenticity_score": 10, # User reported is generally high for demo
        "reasoning": "Direct verified report from user on ground.",
        "flags": [],
        "timestamp": datetime.now().isoformat()
    }

    # 3. Add to our in-memory data (so it shows up in /get_sos_data calls)
    try:
        # Load existing
        if os.path.exists(PROCESSED_DATA_FILE):
             with open(PROCESSED_DATA_FILE, 'r', encoding='utf-8') as f:
                current_data = json.load(f)
        else:
            current_data = []

        # Prepend new incident
        current_data.insert(0, new_incident)

        # Save back
        with open(PROCESSED_DATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(current_data, f, indent=4)
            
        print("Incident saved successfully.")
        return jsonify({"message": "Incident reported successfully", "incident": new_incident})

    except Exception as e:
        print(f"Error saving incident: {e}")
        return jsonify({"error": "Internal Server Error"}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001, debug=True)