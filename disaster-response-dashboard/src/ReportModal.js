import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, AlertTriangle, Send, X } from 'lucide-react';
import './App.css';

export default function ReportModal({ isOpen, onClose, onSubmit }) {
    const [description, setDescription] = useState("");
    const [location, setLocation] = useState(null);
    const [loadingLocation, setLoadingLocation] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleGetLocation = () => {
        setLoadingLocation(true);
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                    setLoadingLocation(false);
                },
                (error) => {
                    console.error("Error getting location:", error);
                    alert("Could not pull location. Please allow location access.");
                    setLoadingLocation(false);
                }
            );
        } else {
            alert("Geolocation is not supported by this browser.");
            setLoadingLocation(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!description || !location) {
            alert("Please provide a description and your location.");
            return;
        }

        setSubmitting(true);
        await onSubmit({ description, ...location });
        setSubmitting(false);
        setDescription("");
        setLocation(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="modal-overlay">
                    <motion.div
                        className="modal-content glass"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                    >
                        <div className="modal-header">
                            <h2><AlertTriangle color="#ef4444" /> Report Incident</h2>
                            <button className="close-btn" onClick={onClose}><X size={20} /></button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>What is happening?</label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    placeholder="Describe the emergency (e.g., 'Fire at station', 'Flooding on main road')..."
                                    rows={4}
                                />
                            </div>

                            <div className="form-group">
                                <label>Location</label>
                                <div className="location-control">
                                    <button type="button" className={`get-location-btn ${location ? 'acquired' : ''}`} onClick={handleGetLocation} disabled={loadingLocation}>
                                        <MapPin size={18} />
                                        {loadingLocation ? "Locating..." : location ? "Location Acquired ✓" : "Use My Current Location"}
                                    </button>
                                    {location && <span className="location-text">{location.lat.toFixed(4)}, {location.lng.toFixed(4)}</span>}
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
                                <button type="submit" className="submit-btn" disabled={submitting || !location}>
                                    {submitting ? "Reporting..." : <><Send size={18} /> Submit Report</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
