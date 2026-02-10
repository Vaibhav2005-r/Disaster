import json
import random
from datetime import datetime, timedelta

# --- CONFIGURATION ---
OUTPUT_JSON_FILE = "processed_data.json"

# --- DATASETS ---
LOCATIONS = [
    # SOUTH MUMBAI
    {"name": "Colaba Causeway", "lat": 18.9100, "lng": 72.8250, "area": "Colaba"},
    {"name": "Gateway of India", "lat": 18.9220, "lng": 72.8347, "area": "Colaba"},
    {"name": "Marine Drive", "lat": 18.9440, "lng": 72.8230, "area": "Marine Lines"},
    {"name": "CST Station", "lat": 18.9400, "lng": 72.8350, "area": "Fort"},
    {"name": "Girgaon Chowpatty", "lat": 18.9520, "lng": 72.8180, "area": "Girgaon"},
    
    # CENTRAL MUMBAI
    {"name": "Dadar Station", "lat": 19.0180, "lng": 72.8430, "area": "Dadar"},
    {"name": "Sion Hospital", "lat": 19.0400, "lng": 72.8600, "area": "Sion"},
    {"name": "Worli Sea Face", "lat": 19.0100, "lng": 72.8150, "area": "Worli"},
    {"name": "Lower Parel", "lat": 18.9950, "lng": 72.8300, "area": "Lower Parel"},
    {"name": "Dharavi", "lat": 19.0380, "lng": 72.8530, "area": "Dharavi"},

    # WESTERN SUBURBS
    {"name": "Bandra Bandstand", "lat": 19.0550, "lng": 72.8200, "area": "Bandra West"},
    {"name": "Juhu Beach", "lat": 19.0980, "lng": 72.8260, "area": "Juhu"},
    {"name": "Andheri Station", "lat": 19.1136, "lng": 72.8450, "area": "Andheri"},
    {"name": "Versova", "lat": 19.1300, "lng": 72.8150, "area": "Versova"},
    {"name": "Goregaon Hub Mall", "lat": 19.1650, "lng": 72.8500, "area": "Goregaon"},
    {"name": "Infinity Mall", "lat": 19.1840, "lng": 72.8350, "area": "Malad West"},
    {"name": "Kandivali Station", "lat": 19.2050, "lng": 72.8550, "area": "Kandivali"},
    {"name": "Borivali National Park", "lat": 19.2300, "lng": 72.8600, "area": "Borivali"},

    # EASTERN SUBURBS & HARBOUR
    {"name": "Phoenix Marketcity", "lat": 19.0860, "lng": 72.8890, "area": "Kurla"},
    {"name": "R City Mall", "lat": 19.0990, "lng": 72.9150, "area": "Ghatkopar"},
    {"name": "Powai Lake", "lat": 19.1200, "lng": 72.9050, "area": "Powai"},
    {"name": "Vikhroli Station", "lat": 19.1100, "lng": 72.9300, "area": "Vikhroli"},
    {"name": "Mulund Check Naka", "lat": 19.1750, "lng": 72.9600, "area": "Mulund"},
    {"name": "Chembur Monorail", "lat": 19.0600, "lng": 72.8900, "area": "Chembur"},
]

SCENARIOS = [
    {"type": "Medical Emergency", "severity": 8, "desc": "Severe cardiac arrest patient collapsed on road.", "needs": ["Medical", "Ambulance"]},
    {"type": "Fire", "severity": 9, "desc": "Massive fire broke out in a commercial building.", "needs": ["Fire", "Rescue"]},
    {"type": "Accident", "severity": 7, "desc": "Car collision with multiple injuries reported.", "needs": ["Medical", "Police"]},
    {"type": "Flooding", "severity": 6, "desc": "Water logging blocking main access road.", "needs": ["Police", "Rescue"]},
    {"type": "Riot Control", "severity": 8, "desc": "Public disturbance and crowd gathering aggressively.", "needs": ["Police", "Crowd Control"]},
    {"type": "Structure Collapse", "severity": 10, "desc": "Old building collapsed, people trapped under debris.", "needs": ["Fire", "Medical", "Police", "NDRF"]},
    {"type": "Gas Leak", "severity": 9, "desc": "Toxic gas smell reported near residential area.", "needs": ["Fire", "Evacuation"]},
    {"type": "Animal Rescue", "severity": 4, "desc": "Stray leopard spotted near residential complex.", "needs": ["Forest Dept", "Police"]},
    {"type": "Tree Fall", "severity": 5, "desc": "Huge tree fell on a parked car, blocking traffic.", "needs": ["Fire", "Municipality"]},
]

def generate_data():
    print("--- Generating Pan-Mumbai Disaster Data ---")
    data = []
    
    # Generate 50 incidents
    for i in range(1, 51):
        loc = random.choice(LOCATIONS)
        # Add slight random jitter to location so they don't stack perfectly
        lat_jitter = random.uniform(-0.005, 0.005)
        lng_jitter = random.uniform(-0.005, 0.005)
        
        scenario = random.choice(SCENARIOS)
        
        # Authenticity Score (Weighted towards high)
        auth_score = random.choices([3, 5, 7, 8, 9, 10], weights=[5, 10, 20, 30, 20, 15])[0]

        incident = {
            "id": i,
            "original_message": f"SOS! {scenario['desc']} at {loc['name']}.",
            "category": scenario['type'],
            "priority": "Critical" if scenario['severity'] >= 8 else "High" if scenario['severity'] >= 6 else "Moderate",
            "severity_score": scenario['severity'],
            "authenticity_score": auth_score,
            "location": f"{loc['name']}, {loc['area']}, Mumbai",
            "coordinates": {
                "lat": loc['lat'] + lat_jitter,
                "lng": loc['lng'] + lng_jitter
            },
            "need_type": scenario['needs'],
            "timestamp": (datetime.now() - timedelta(minutes=random.randint(1, 120))).isoformat()
        }
        data.append(incident)

    # Save to file
    with open(OUTPUT_JSON_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=4)
    
    print(f"Successfully generated {len(data)} incidents across {len(LOCATIONS)} key locations.")
    print(f"Saved to {OUTPUT_JSON_FILE}")

if __name__ == '__main__':
    generate_data()