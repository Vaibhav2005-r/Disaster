# Disaster Response Dashboard v2.0 🚨🚁

**A Next-Gen, AI-Powered Command Center for Urban Emergency Management.**
<img width="1914" height="1078" alt="Screenshot 2026-02-10 at 9 36 43 PM" src="https://github.com/user-attachments/assets/1716ad98-cf97-494d-8604-968b7a0802f9" />



## 📖 Overview

The **Disaster Response Dashboard** is a realtime visualization and command tool designed to aid emergency responders in managing urban crises. Built for the city of Mumbai, it integrates live location tracking, AI-driven situation analysis, and smart resource allocation into a unified "Glassmorphism" interface.

This project demonstrates the application of **Generative AI** and **Geospatial Engineering** to solve critical real-world problems.

## ✨ Key Features

### 🧠 AI-Driven Intelligence
-   **Realtime Situation Reports**: Uses **Google Gemini 1.5 Flash** to analyze weather, traffic, and social sentiment, generating concise executive summaries for commanders.
-   **Authenticity Scoring**: AI evaluates incoming SOS messages to filter out spam and prioritize genuine emergencies.
-   **Severity Classification**: Automatically categorizes incidents (Fire, Medical, Accident) and assigns color-coded urgency levels.

### 🗺️ Advanced Geospatial Operations
-   **Live Fleet Tracking**: Realtime movement of Ambulances, Police, and Fire units on a **Google Map**.
-   **Smart Routing**: Vehicles follow actual road networks using the **Google Directions API** (not straight lines).
-   **Traffic Overlay**: Toggleable real-time traffic data layer to aid routing decisions.

### ⚡ Interactive Command Interface
-   **Cinematic UX**: Features a "System Initialization" boot sequence (Matrix-style) and a high-fidelity dark mode UI.
-   **Incident Command Panel**: Click on any incident to view details and dispatch the nearest available unit with one distinct action.
-   **Auto-Refresh Fleet**: Units automatically return to 'IDLE' status after completing missions, simulating a living ecosystem.

## 🛠️ Tech Stack

-   **Frontend**: React.js, Framer Motion (Animations), Lucide React (Icons), Google Maps JavaScript API (@vis.gl/react-google-maps).
-   **Backend**: Python Flask, NumPy (Data Simulation).
-   **AI & APIs**: Google Gemini API, Google Maps Platform (Directions, Geocoding, Places).
-   **Styling**: CSS Modules, Glassmorphism Design System.

## 🚀 Installation & Setup

### Prerequisites
-   Node.js & npm
-   Python 3.8+
-   Google Maps API Key & Gemini API Key

### 1. Clone the Repository
```bash
git clone https://github.com/Vaibhav2005-r/Disaster.git
cd Disaster
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
*Create a `.env` file in `backend/`:*
```env
GEMINI_API_KEY=your_key_here
GOOGLE_MAPS_API_KEY=your_key_here
```
*Run the server:*
```bash
python app.py
```

### 3. Frontend Setup
```bash
cd ../disaster-response-dashboard
npm install
```
*Create a `.env` file in `disaster-response-dashboard/`:*
```env
REACT_APP_GOOGLE_MAPS_API_KEY=your_key_here
```
*Start the dashboard:*
```bash
npm start
```
---

**Developed by Vaibhav** | *Engineering a Safer Tomorrow*
