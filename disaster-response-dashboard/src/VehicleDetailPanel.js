import React from 'react';
import { motion } from 'framer-motion';
import { Truck, Shield, Activity, User, Navigation, X } from 'lucide-react';
import './App.css';

export default function VehicleDetailPanel({ vehicle, onClose, onAssign, incidents }) {
    if (!vehicle) return null;

    const statusColor = {
        'IDLE': '#10b981', // Emerald
        'DISPATCHED': '#f59e0b', // Amber
        'BUSY': '#ef4444' // Red
    };

    return (
        <motion.div
            className="sidebar right-sidebar glass"
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
            <div className="sidebar-header">
                <h2>
                    {vehicle.type === 'ambulance' && <Activity color="#ef4444" />}
                    {vehicle.type === 'police' && <Shield color="#3b82f6" />}
                    {vehicle.type === 'fire' && <Truck color="#f97316" />}
                    Unit Details
                </h2>
                <button className="close-btn" onClick={onClose}><X size={20} /></button>
            </div>

            <div className="details-content">
                <div className="vehicle-card-hero" style={{ borderColor: statusColor[vehicle.status] }}>
                    <h3>{vehicle.name}</h3>
                    <span className="status-badge" style={{ backgroundColor: statusColor[vehicle.status] }}>
                        {vehicle.status}
                    </span>
                </div>

                <section className="detail-section">
                    <h3><User size={16} /> Crew Info</h3>
                    <div className="info-row">
                        <span>Driver:</span> <strong>{vehicle.details.driver}</strong>
                    </div>
                    <div className="info-row">
                        <span>Contact:</span> <strong>{vehicle.details.contact}</strong>
                    </div>
                    <div className="info-row">
                        <span>Capacity:</span> <strong>{vehicle.details.capacity}</strong>
                    </div>
                </section>

                <section className="detail-section">
                    <h3><Navigation size={16} /> Manual Override</h3>
                    <p className="helper-text">Force assign this unit to an active incident:</p>

                    <div className="incident-override-list">
                        {incidents.filter(i => !i.assigned_vehicle).map(incident => (
                            <button
                                key={incident.id}
                                className="override-btn"
                                onClick={() => onAssign(vehicle.id, incident.id)}
                            >
                                <div className="btn-row">
                                    <span className="inc-summary">{(incident.summary || incident.original_message || "").substring(0, 25)}...</span>
                                    <span className={`urgency-dot ${(incident.urgency || "unknown").toLowerCase()}`}></span>
                                </div>
                                <span className="btn-loc">{incident.location_text}</span>
                            </button>
                        ))}
                        {incidents.filter(i => !i.assigned_vehicle).length === 0 && (
                            <p className="no-incidents">No unassigned incidents available.</p>
                        )}
                    </div>

                    {vehicle.status !== 'IDLE' && (
                        <button className="recall-btn" onClick={() => onAssign(vehicle.id, null)}>
                            Return to Base (Recall)
                        </button>
                    )}
                </section>
            </div>
        </motion.div>
    );
}
