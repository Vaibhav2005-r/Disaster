import React, { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { decode } from '@googlemaps/polyline-codec';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, MapPin, Navigation, Activity, Shield, Flame, Truck, AlertTriangle } from 'lucide-react';
import ReportModal from './ReportModal';
import VehicleDetailPanel from './VehicleDetailPanel';
import IncidentDetailPanel from './IncidentDetailPanel';
import FleetDropdown from './FleetDropdown';
import { findPath } from './MumbaiNavigationGraph';
import IntroOverlay from './IntroOverlay';
import './App.css';

// --- CONTROLS COMPONENT ---
function MapControls({ showTraffic, setShowTraffic }) {
  const map = useMap();
  const trafficLayerRef = useRef(null);

  useEffect(() => {
    if (!map) return;
    trafficLayerRef.current = new window.google.maps.TrafficLayer();
  }, [map]);

  useEffect(() => {
    if (!map || !trafficLayerRef.current) return;
    if (showTraffic) {
      trafficLayerRef.current.setMap(map);
    } else {
      trafficLayerRef.current.setMap(null);
    }
  }, [showTraffic, map]);

  return (
    <div className="map-controls">
      <label className="toggle-switch">
        <input
          type="checkbox"
          checked={showTraffic}
          onChange={(e) => setShowTraffic(e.target.checked)}
        />
        <span className="slider round"></span>
        <span className="label-text">Traffic</span>
      </label>
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
        geodesic: true,
        strokeColor: '#3b82f6', // Modern blue
        strokeOpacity: 0.8,
        strokeWeight: 6,
      });
      polylineRef.current.setMap(map);
    }
    if (path && path.length > 0) {
      polylineRef.current.setPath(path.map(({ lat, lng }) => ({ lat, lng })));
    } else {
      polylineRef.current.setPath([]);
    }
  }, [map, path]);

  return null;
}

// --- CLOCK COMPONENT ---
function DigitalClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="digital-clock">
      <div className="clock-time">
        {time.toLocaleTimeString('en-US', { hour12: false })}
      </div>
      <div className="clock-date">
        {time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).toUpperCase()}
      </div>
    </div>
  );
}

// --- MAIN APP COMPONENT ---
function App() {
  const [showIntro, setShowIntro] = useState(false); // Disabled by user request
  const [sosData, setSosData] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [decodedPath, setDecodedPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nearbyPlaces, setNearbyPlaces] = useState({ hospitals: [], police_stations: [], fire_stations: [] });
  const [showTraffic, setShowTraffic] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [error, setError] = useState(null);
  const [situation, setSituation] = useState({ temp: "--", cond: "Loading...", insight: "Connecting to AI satellite..." });

  // --- SMART DISPATCH SYSTEM ---
  const [resources, setResources] = useState([
    {
      id: 'amb-1', type: 'ambulance', status: 'IDLE', lat: 19.0760, lng: 72.8777, name: 'Ambulance 1',
      details: { driver: 'Ramesh K.', contact: '9820098200', capacity: '2 Patients', equipment: 'ALS' }
    },
    {
      id: 'amb-2', type: 'ambulance', status: 'IDLE', lat: 19.0200, lng: 72.8400, name: 'Ambulance 2',
      details: { driver: 'Suresh P.', contact: '9820098201', capacity: '1 Patient', equipment: 'BLS' }
    },
    {
      id: 'pol-1', type: 'police', status: 'IDLE', lat: 19.0800, lng: 72.8900, name: 'Patrol Alpha',
      details: { driver: 'Insp. Patil', contact: '100-22', capacity: '4 Officers', equipment: 'Riot Gear' }
    },
    {
      id: 'fire-1', type: 'fire', status: 'IDLE', lat: 19.0600, lng: 72.8500, name: 'Fire Engine 4',
      details: { driver: 'Chief Rane', contact: '101-44', capacity: '3000L Water', equipment: 'Ladder' }
    }
  ]);

  const handleIntroComplete = () => {
    setShowIntro(false);
  };

  useEffect(() => {
    // 1. Fetch Realtime AI Situation Report
    fetch('http://127.0.0.1:5001/get_situation_update')
      .then(res => res.json())
      .then(data => {
        if (data.temperature) {
          setSituation({
            temp: data.temperature,
            cond: data.condition,
            insight: data.insight
          });
        }
      })
      .catch(err => console.error("Error fetching situation report:", err));

    // 2. Fetch SOS Data
    fetch('http://127.0.0.1:5001/get_sos_data')
      .then(res => {
        if (!res.ok) throw new Error("Failed to connect to backend");
        return res.json();
      })
      .then(data => {
        setLoading(false);
        const sortedData = data.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));

        let currentIndex = 0;
        setSosData(sortedData.slice(0, 3));
        currentIndex = 3;

        const interval = setInterval(() => {
          if (currentIndex < sortedData.length) {
            const newItem = sortedData[currentIndex];
            if (newItem) {
              setSosData(prev => [newItem, ...prev]);
            }
            currentIndex++;
          } else {
            clearInterval(interval);
          }
        }, 3000);

        return () => clearInterval(interval);
      })
      .catch(err => {
        console.error("Error fetching SOS data:", err);
        setError("Could not load disaster data. Is the backend running?");
        setLoading(false);
      });
  }, []);

  // Helper: Fetch Route in Background
  const fetchRouteForVehicle = async (vehicle, target) => {
    try {
      const res = await fetch(`http://127.0.0.1:5001/get_route?lat=${target.coordinates.lat}&lng=${target.coordinates.lng}&start_lat=${vehicle.lat}&start_lng=${vehicle.lng}`);
      if (res.ok) {
        const data = await res.json();
        if (data.overview_polyline) {
          const decoded = decode(data.overview_polyline);
          const newPath = decoded.map(([lat, lng]) => ({ lat, lng }));

          // Update vehicle with path once loaded
          setResources(prev => prev.map(r => {
            if (r.id === vehicle.id) {
              return { ...r, path: newPath };
            }
            return r;
          }));
        }
      }
    } catch (err) {
      console.error("Routing Error:", err);
      // Fallback path (straight line) already handled if path is empty
      setResources(prev => prev.map(r => {
        if (r.id === vehicle.id) {
          return { ...r, path: [{ lat: vehicle.lat, lng: vehicle.lng }, target.coordinates] };
        }
        return r;
      }));
    }
  };

  const assignVehicle = (vehicleId, incidentId) => {
    const vehicle = resources.find(r => r.id === vehicleId);
    if (!vehicle) return;

    // 1. Optimistic Update (Instant Feedback)
    setResources(prev => prev.map(res => {
      if (res.id === vehicleId) {
        return {
          ...res,
          status: incidentId ? 'DISPATCHED' : 'IDLE',
          target_incident_id: incidentId,
          path: [], // Reset path until loaded
          pathIndex: 0
        };
      }
      return res;
    }));

    if (incidentId) {
      setSosData(prev => prev.map(inc => {
        if (inc.id === incidentId) {
          return { ...inc, assigned_vehicle: vehicleId };
        }
        return inc;
      }));

      // 2. Trigger Route Fetch
      const target = sosData.find(i => i.id === incidentId);
      if (target && target.coordinates) {
        fetchRouteForVehicle(vehicle, target);
      }
    }
  };

  // AUTO DISPATCH LOGIC
  useEffect(() => {
    sosData.forEach(incident => {
      if (incident.severity_score >= 7 && !incident.assigned_vehicle) {
        let requiredType = 'police';
        if (incident.need_type?.includes('Medical')) requiredType = 'ambulance';
        if (incident.need_type?.includes('Fire')) requiredType = 'fire';

        const availableVehicles = resources.filter(r => r.type === requiredType && r.status === 'IDLE');

        if (availableVehicles.length > 0) {
          let nearest = availableVehicles[0];
          let minDist = 9999;

          availableVehicles.forEach(v => {
            const d = Math.sqrt(Math.pow(v.lat - incident.coordinates.lat, 2) + Math.pow(v.lng - incident.coordinates.lng, 2));
            if (d < minDist) {
              minDist = d;
              nearest = v;
            }
          });
          assignVehicle(nearest.id, incident.id);
        }
      }
    });
  }, [sosData]);

  // SIMULATE MOVEMENT (Following Path)
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setResources(prev => prev.map(res => {
        if (res.status === 'DISPATCHED' && res.path && res.path.length > 0) {
          const targetNode = res.path[res.pathIndex];
          if (!targetNode) return res;

          const dx = targetNode.lat - res.lat;
          const dy = targetNode.lng - res.lng;
          const dist = Math.sqrt(dx * dx + dy * dy);

          const speed = 0.0001; // Realistic speed

          if (dist < speed) {
            const nextIndex = res.pathIndex + 1;
            if (nextIndex >= res.path.length) {
              return { ...res, status: 'BUSY', path: [] };
            }
            return { ...res, lat: targetNode.lat, lng: targetNode.lng, pathIndex: nextIndex };
          } else {
            const ratio = speed / dist;
            return { ...res, lat: res.lat + dx * ratio, lng: res.lng + dy * ratio };
          }
        }
        return res;
      }));
    }, 100);

    return () => clearInterval(moveInterval);
  }, []);

  const handleReportSubmit = (reportData) => {
    const newIncident = {
      id: sosData.length + 1,
      category: reportData.category,
      original_message: reportData.description,
      priority: "High",
      severity_score: 8, // Default high severity for manual reports
      authenticity_score: 10,
      timestamp: new Date().toISOString(),
      location: "Manual Report",
      status: "Open",
      coordinates: { lat: 19.0760, lng: 72.8777 }, // Default center for now
      need_type: [reportData.category]
    };
    setSosData(prev => [newIncident, ...prev]);
    setShowReportModal(false);
  };

  const mumbaiCenter = { lat: 19.0760, lng: 72.8777 };

  return (
    <APIProvider apiKey={process.env.REACT_APP_GOOGLE_MAPS_API_KEY}>
      <AnimatePresence>
        {showIntro && <IntroOverlay onComplete={handleIntroComplete} />}
      </AnimatePresence>

      <div className="app-container">
        {/* HEADER */}
        <header className="app-header glass">
          <div className="logo-area">
            <Activity className="pulse-icon" />
            <h1>MUMBAI DISASTER RESPONSE</h1>
          </div>

          <div className="header-stats">
            <DigitalClock />
            <div className="stat-item pulse-stat">
              <span className="stat-label">LIVE STATUS</span>
              <span className="stat-value text-green">ONLINE</span>
            </div>
          </div>

          <div className="header-actions">
            <button className="report-btn-header" onClick={() => setShowReportModal(true)}>
              <AlertTriangle size={18} />
              REPORT INCIDENT
            </button>
            <FleetDropdown resources={resources} onSelect={(res) => { setSelectedVehicle(res); setSelectedIncident(null); }} />
          </div>
        </header>

        <div className="main-content">
          {/* SIDEBAR */}
          <div className="sidebar left-sidebar glass">
            {/* --- WEATHER CARD --- */}
            <div className="weather-card">
              <div className="weather-header">
                <h3><span className="live-dot"></span> MUMBAI LIVE</h3>
                <span>{situation.temp}</span>
              </div>
              <div className="weather-details">
                <span className="weather-cond">{situation.cond}</span>
                <p className="weather-insight">"{situation.insight}"</p>
              </div>
            </div>

            <h2>Live SOS Feed</h2>
            <div className="sos-feed">
              {loading ? <p>Loading data...</p> : sosData.map(item => (
                <motion.div
                  key={item.id}
                  className={`sos-card priority-${item.priority.toLowerCase()}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setSelectedIncident(item)}
                >
                  <div className="sos-header">
                    <span className={`category-badge ${item.urgency ? item.urgency.toLowerCase() : 'minor'}`}>{item.category}</span>
                    <span className="time">{new Date(item.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="sos-msg">{item.original_message}</p>
                  <div className="sos-meta">
                    <span><MapPin size={12} /> {item.location_text || item.location}</span>
                    <div className="severity-bar">
                      <div className="fill" style={{
                        width: `${item.severity_score * 10}%`,
                        backgroundColor: item.severity_score > 7 ? '#ef4444' : item.severity_score > 4 ? '#f59e0b' : '#10b981'
                      }}></div>
                    </div>
                  </div>
                  {item.assigned_vehicle && <div className="assigned-badge"><Truck size={12} /> Unit Dispatched</div>}
                </motion.div>
              ))}
            </div>
          </div>

          {/* MAP AREA */}
          <div className="map-wrapper">
            <Map
              defaultCenter={mumbaiCenter}
              defaultZoom={12}
              mapId="4f65c879d6c34275"
              disableDefaultUI={true}
              className="google-map"
            >
              <MapControls showTraffic={showTraffic} setShowTraffic={setShowTraffic} />

              {/* Incident Markers */}
              {sosData.map(incident => (
                <AdvancedMarker
                  key={incident.id}
                  position={incident.coordinates}
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className={`custom-marker ${incident.priority.toLowerCase()} ${selectedIncident?.id === incident.id ? 'selected' : ''}`}>
                    <AlertCircle size={20} color="white" />
                  </div>
                </AdvancedMarker>
              ))}

              {/* Resource Markers */}
              {resources.map(res => (
                <AdvancedMarker
                  key={res.id}
                  position={{ lat: res.lat, lng: res.lng }}
                  onClick={() => setSelectedVehicle(res)}
                >
                  <div className={`resource-marker ${res.type} ${res.status.toLowerCase()}`}>
                    {res.type === 'ambulance' && <Activity size={16} color="white" />}
                    {res.type === 'police' && <Shield size={16} color="white" />}
                    {res.type === 'fire' && <Flame size={16} color="white" />}
                  </div>
                </AdvancedMarker>
              ))}

              {/* Route Polyline */}
              {resources.map(res => (
                res.status === 'DISPATCHED' && res.path && (
                  <RoutePolyline
                    key={res.id}
                    path={res.path.map(p => [p.lat, p.lng])}
                  />
                )
              ))}
            </Map>
          </div>
        </div>

        {/* MODALS & PANELS */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          onSubmit={handleReportSubmit}
        />
        <VehicleDetailPanel
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          onAssign={assignVehicle}
          incidents={sosData}
        />
        <IncidentDetailPanel
          incident={selectedIncident}
          onClose={() => setSelectedIncident(null)}
          onAssign={assignVehicle}
          vehicles={resources}
        />
      </div>
    </APIProvider>
  );
}

export default App;