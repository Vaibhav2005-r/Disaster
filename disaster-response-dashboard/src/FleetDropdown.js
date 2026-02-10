import React, { useState } from 'react';
import { Truck, Shield, Activity, ChevronDown, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';

export default function FleetDropdown({ resources, onSelect }) {
    const [isOpen, setIsOpen] = useState(false);

    // Group by status
    const idleCount = resources.filter(r => r.status === 'IDLE').length;
    const busyCount = resources.filter(r => r.status !== 'IDLE').length;

    return (
        <div className="fleet-dropdown-container">
            <button className="fleet-toggle-btn" onClick={() => setIsOpen(!isOpen)}>
                <Truck size={18} />
                <span>Rescue Fleet</span>
                <span className="fleet-badge">{idleCount} Avail</span>
                <ChevronDown size={16} className={`chevron ${isOpen ? 'open' : ''}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="fleet-menu glass"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                    >
                        <div className="fleet-stats">
                            <span className="stat-item"><span className="dot idle"></span> {idleCount} Idle</span>
                            <span className="stat-item"><span className="dot busy"></span> {busyCount} Busy</span>
                        </div>

                        <div className="fleet-list">
                            {resources.map(res => (
                                <div
                                    key={res.id}
                                    className={`fleet-item ${res.status.toLowerCase()}`}
                                    onClick={() => {
                                        onSelect(res);
                                        setIsOpen(false);
                                    }}
                                >
                                    <div className="icon-box">
                                        {res.type === 'ambulance' && <Activity size={14} />}
                                        {res.type === 'police' && <Shield size={14} />}
                                        {res.type === 'fire' && <Truck size={14} />}
                                    </div>
                                    <div className="fleet-info">
                                        <div className="fleet-name">{res.name}</div>
                                        <div className="fleet-status">{res.status}</div>
                                    </div>
                                    {res.status === 'DISPATCHED' && <Radio size={12} className="pulse-icon" />}
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
