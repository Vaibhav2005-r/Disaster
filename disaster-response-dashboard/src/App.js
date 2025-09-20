import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { decode } from '@googlemaps/polyline-codec';
import './App.css';

// --- NEW COMPONENT to toggle the Traffic Layer ---
function TrafficControl() {
  const map = useMap();
  const [trafficLayer, setTrafficLayer] = useState(null);

  useEffect(() => {
    if (!map) return;
    const layer = new window.google.maps.TrafficLayer();
    setTrafficLayer(layer);
  }, [map]);

  const toggleTraffic = (e) => {
    if (e.target.checked) {
      trafficLayer?.setMap(map);
    } else {
      trafficLayer?.setMap(null);
    }
  };

  return (
    <div style={{
      position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
      backgroundColor: 'white', padding: '8px', borderRadius: '5px',
      boxShadow: '0 2px 6px rgba(0,0,0,0.3)', zIndex: 10, display: 'flex', alignItems: 'center'
    }}>
      <input type="checkbox" id="traffic" onChange={toggleTraffic} />
      <label htmlFor="traffic" style={{ marginLeft: '5px', fontWeight: 'bold' }}>Show Traffic</label>
    </div>
  );
}

// --- ROUTE POLYLINE COMPONENT ---
function RoutePolyline({ path }) {
  const map = useMap();
  const polylineRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    if (!polylineRef.current) {
      polylineRef.current = new window.google.maps.Polyline({
        geodesic: true, strokeColor: '#0d6efd', strokeOpacity: 0.8, strokeWeight: 4,
      });
      polylineRef.current.setMap(map);
    }
    if (path && path.length > 0) {
      polylineRef.current.setPath(path.map(([lat, lng]) => ({ lat, lng })));
    } else {
      polylineRef.current.setPath([]);
    }
  }, [map, path]);

  return null;
}

// --- MAIN APP COMPONENT ---
function App() {
  const [sosData, setSosData] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [decodedPath, setDecodedPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState({ hospitals: [], police_stations: [], fire_stations: [] });

  useEffect(() => {
    fetch('http://127.0.0.1:5000/get_sos_data')
      .then(res => res.json()).then(data => { setLoading(false); setSosData(data); })
      .catch(err => { console.error("Error fetching SOS data:", err); setLoading(false); });
  }, []);

  const handleIncidentSelect = (incident) => {
    setSelectedIncident(incident);
    setRouteInfo(null);
    setDecodedPath([]);
    setNearbyPlaces({ hospitals: [], police_stations: [], fire_stations: [] });

    const { lat, lng } = incident.coordinates;
    fetch(`http://127.0.0.1:5000/get_route?lat=${lat}&lng=${lng}`)
      .then(res => res.json()).then(data => {
        setRouteInfo(data);
        if (data.overview_polyline) setDecodedPath(decode(data.overview_polyline, 5));
      }).catch(err => console.error("Error fetching route data:", err));
    fetch(`http://127.0.0.1:5000/get_nearby_places?lat=${lat}&lng=${lng}`)
      .then(res => res.json()).then(data => setNearbyPlaces(data))
      .catch(err => console.error("Error fetching nearby places:", err));
  };

  const getPinColor = (urgency) => {
    switch (urgency) {
      case 'Life-threatening': return '#dc3545';
      case 'Urgent': return '#ffc107';
      case 'Minor': return '#198754';
      default: return '#6c757d';
    }
  };

  if (loading) return <div style={{textAlign: 'center', marginTop: '50px'}}><h1>Loading Disaster Data...</h1></div>;

  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY} libraries={['maps', 'places']}>
      <div className="app-container">
        
        {/* --- LEFT SIDEBAR: INCIDENT LIST --- */}
        <div className="sidebar">
          <h2>Incoming SOS Feed</h2>
          {sosData.map(incident => (
            <div 
              key={incident.id} 
              className={`incident-list-item ${selectedIncident?.id === incident.id ? 'selected' : ''}`}
              onClick={() => handleIncidentSelect(incident)}
            >
              <p><strong>{incident.location_text}</strong></p>
              <p>{incident.summary}</p>
              <span className={`urgency-tag urgency-${incident.urgency.replace(' ','-')}`}>{incident.urgency}</span>
            </div>
          ))}
        </div>

        {/* --- CENTER: MAP --- */}
        <div className="map-container">
          <Map defaultCenter={{ lat: 19.0760, lng: 72.8777 }} defaultZoom={11} mapId="disaster-map">
            <TrafficControl />
            {sosData.map(incident => (
              <AdvancedMarker key={incident.id} position={incident.coordinates} onClick={() => handleIncidentSelect(incident)}>
                <Pin background={getPinColor(incident.urgency)} borderColor={'#000'} glyphColor={'#000'} />
              </AdvancedMarker>
            ))}
            <RoutePolyline path={decodedPath} />
            {nearbyPlaces.hospitals.map((place, index) => (
              <AdvancedMarker key={`h-${index}`} position={place.location} title={place.name}><Pin background={'#ffffff'} borderColor={'#000000'} glyph={'H'} /></AdvancedMarker>
            ))}
            {nearbyPlaces.police_stations.map((place, index) => (
              <AdvancedMarker key={`p-${index}`} position={place.location} title={place.name}><Pin background={'#0d6efd'} borderColor={'#ffffff'} glyph={'P'} /></AdvancedMarker>
            ))}
            {nearbyPlaces.fire_stations.map((place, index) => (
              <AdvancedMarker key={`f-${index}`} position={place.location} title={place.name}><Pin background={'#ff7c00'} borderColor={'#ffffff'} glyph={'F'} /></AdvancedMarker>
            ))}
          </Map>
        </div>

        {/* --- RIGHT SIDEBAR: DETAILS PANEL --- */}
        <div className="sidebar details-panel">
          <h2>Incident Details</h2>
          {selectedIncident ? (
            <div>
              <p><strong>Message:</strong><br/>{selectedIncident.original_message}</p>
              <p><strong>Need Type:</strong> {selectedIncident.need_type}</p>
              <p><strong>Severity Score:</strong> {selectedIncident.severity_score}</p>
              <p><strong>AI Authenticity:</strong> {selectedIncident.authenticity_score}/10</p>
              <p><strong>AI Reasoning:</strong> {selectedIncident.reasoning}</p>
              <div className="route-info">
                <h3>Route from Rescue HQ</h3>
                {routeInfo ? (
                  <div>
                    <p><strong>Distance:</strong> {routeInfo.distance}</p>
                    <p><strong>Estimated Time:</strong> {routeInfo.duration}</p>
                  </div>
                ) : (<p className="loading-text">Calculating route...</p>)}
              </div>
            </div>
          ) : (<p className="loading-text">Select an incident from the list or map.</p>)}
        </div>
      </div>
    </APIProvider>
  );
}

export default App;