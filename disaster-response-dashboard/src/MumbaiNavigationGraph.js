// Mumbai Navigation Graph & Routing Engine
// Expanded Vector Graph for Realistic "Best Path" Routing without API calls.

// --- 1. NODES (Intersections / Landmarks) ---
const NODES = {
    // SOUTH MUMBAI
    "Colaba": { lat: 18.9067, lng: 72.8147 },
    "NarimanPoint": { lat: 18.9256, lng: 72.8242 },
    "Gateway": { lat: 18.9220, lng: 72.8347 },
    "CST": { lat: 18.9401, lng: 72.8347 },
    "Churchgate": { lat: 18.9322, lng: 72.8264 },
    "MarineDrive": { lat: 18.9430, lng: 72.8230 },
    "Girgaon": { lat: 18.9560, lng: 72.8160 },
    "MumbaiCentral": { lat: 18.9690, lng: 72.8190 },
    "Byculla": { lat: 18.9750, lng: 72.8330 },
    "HajiAli": { lat: 18.9827, lng: 72.8089 },
    "Worli": { lat: 19.0000, lng: 72.8150 }, // Sea Link Start
    "LowerParel": { lat: 18.9950, lng: 72.8290 },

    // CENTRAL MUMBAI
    "DadarTT": { lat: 19.0178, lng: 72.8478 }, // Key Junction
    "DadarWest": { lat: 19.0190, lng: 72.8400 },
    "Matunga": { lat: 19.0280, lng: 72.8500 },
    "Sion": { lat: 19.0400, lng: 72.8640 }, // EEH Start
    "Dharavi": { lat: 19.0380, lng: 72.8530 },

    // BANDRA & CONNECTORS
    "BandraWest": { lat: 19.0550, lng: 72.8290 },
    "BandraKalanagar": { lat: 19.0600, lng: 72.8450 }, // WEH Start
    "BKC": { lat: 19.0670, lng: 72.8770 },
    "Kurla": { lat: 19.0730, lng: 72.8810 },

    // WESTERN EXPRESS HIGHWAY (WEH) SEQUENCE
    "SantacruzEast": { lat: 19.0800, lng: 72.8560 }, // On WEH
    "VileParleEast": { lat: 19.0960, lng: 72.8540 },
    "AndheriEast": { lat: 19.1136, lng: 72.8697 }, // WEH Logic
    "JogeshwariEast": { lat: 19.1360, lng: 72.8600 },
    "GoregaonEast": { lat: 19.1650, lng: 72.8580 },
    "MaladEast": { lat: 19.1840, lng: 72.8560 },
    "KandivaliEast": { lat: 19.2150, lng: 72.8630 },
    "BorivaliEast": { lat: 19.2300, lng: 72.8660 },
    "Dahisar": { lat: 19.2500, lng: 72.8590 },

    // SV ROAD / LINK ROAD (Western Suburbs West)
    "BandraTurner": { lat: 19.0590, lng: 72.8300 },
    "KharWest": { lat: 19.0700, lng: 72.8340 },
    "SantacruzWest": { lat: 19.0820, lng: 72.8350 },
    "Juhu": { lat: 19.1000, lng: 72.8270 },
    "AndheriWest": { lat: 19.1140, lng: 72.8350 },
    "Versova": { lat: 19.1250, lng: 72.8150 },
    "InfinityMall": { lat: 19.1450, lng: 72.8300 }, // Link Road
    "MaladWest": { lat: 19.1860, lng: 72.8370 },
    "BorivaliWest": { lat: 19.2300, lng: 72.8460 },

    // EASTERN EXPRESS HIGHWAY (EEH) & SUBURBS
    "Chembur": { lat: 19.0620, lng: 72.8990 },
    "Ghatkopar": { lat: 19.0860, lng: 72.9090 },
    "Vikhroli": { lat: 19.1100, lng: 72.9250 },
    "Kanjurmarg": { lat: 19.1300, lng: 72.9340 },
    "Bhandup": { lat: 19.1480, lng: 72.9390 },
    "Mulund": { lat: 19.1720, lng: 72.9560 },
    "Thane": { lat: 19.1950, lng: 72.9700 },

    // CONNECTORS
    "Airport": { lat: 19.0902, lng: 72.8628 }, // In between
    "Powai": { lat: 19.1176, lng: 72.9060 }, // JVLR Key
    "SakiNaka": { lat: 19.1050, lng: 72.8870 },
    "Vashi": { lat: 19.0770, lng: 73.0 }, // Exit
};

// --- 2. GRAPH EDGES (Road Connections) ---
// Simplified bi-directional roads
const GRAPH = {
    // SOUTH
    "Colaba": ["Gateway", "NarimanPoint"],
    "NarimanPoint": ["Colaba", "Churchgate", "MarineDrive"],
    "Gateway": ["Colaba", "CST"],
    "CST": ["Gateway", "Churchgate", "MarineDrive", "MumbaiCentral"],
    "Churchgate": ["NarimanPoint", "MarineDrive", "CST"],
    "MarineDrive": ["NarimanPoint", "Churchgate", "Girgaon"],
    "Girgaon": ["MarineDrive", "HajiAli", "MumbaiCentral"],
    "MumbaiCentral": ["CST", "Girgaon", "Byculla", "HajiAli"],
    "Byculla": ["MumbaiCentral", "DadarTT"],
    "HajiAli": ["Girgaon", "MumbaiCentral", "Worli", "DadarWest"],
    "Worli": ["HajiAli", "DadarWest", "LowerParel", "BandraWest"], // Sea Link to BandraWest
    "LowerParel": ["Worli", "DadarWest", "DadarTT"],

    // CENTRAL JUNCTION
    "DadarTT": ["Byculla", "DadarWest", "Matunga", "Sion"],
    "DadarWest": ["HajiAli", "Worli", "LowerParel", "DadarTT", "Matunga"],
    "Matunga": ["DadarTT", "DadarWest", "Sion", "Dharavi"],
    "Dharavi": ["Matunga", "Sion", "BandraKalanagar"], // Link to Bandra
    "Sion": ["DadarTT", "Matunga", "Dharavi", "BKC", "Kurla", "Chembur"],

    // WESTERN EXPRESS HIGHWAY (North-South Spine)
    "BandraKalanagar": ["Dharavi", "BKC", "SantacruzEast", "BandraTurner"],
    "SantacruzEast": ["BandraKalanagar", "VileParleEast", "Airport"],
    "VileParleEast": ["SantacruzEast", "AndheriEast", "Airport"],
    "AndheriEast": ["VileParleEast", "JogeshwariEast", "Powai", "SakiNaka"], // JVLR Start
    "JogeshwariEast": ["AndheriEast", "GoregaonEast"],
    "GoregaonEast": ["JogeshwariEast", "MaladEast"],
    "MaladEast": ["GoregaonEast", "KandivaliEast"],
    "KandivaliEast": ["MaladEast", "BorivaliEast"],
    "BorivaliEast": ["KandivaliEast", "Dahisar"],
    "Dahisar": ["BorivaliEast"],

    // SV ROAD / LINK ROAD (Parallel West)
    "BandraWest": ["Worli", "BandraTurner"], // Sea Link Landed
    "BandraTurner": ["BandraWest", "BandraKalanagar", "KharWest"],
    "KharWest": ["BandraTurner", "SantacruzWest"],
    "SantacruzWest": ["KharWest", "Juhu"],
    "Juhu": ["SantacruzWest", "AndheriWest", "VileParleEast"], // Cut across to WEH
    "AndheriWest": ["Juhu", "Versova", "AndheriEast"], // Metro/Bridge cut across
    "Versova": ["AndheriWest", "InfinityMall"],
    "InfinityMall": ["Versova", "MaladWest"],
    "MaladWest": ["InfinityMall", "MaladEast", "BorivaliWest"], // Malad Subway
    "BorivaliWest": ["MaladWest", "BorivaliEast"],

    // EASTERN EXPRESS HIGHWAY & CENTRAL SUBS
    "Chembur": ["Sion", "Ghatkopar", "Vashi"],
    "Ghatkopar": ["Chembur", "Vikhroli", "SakiNaka"], // Metro link to Saki
    "Vikhroli": ["Ghatkopar", "Kanjurmarg", "Powai"], // JVLR End
    "Kanjurmarg": ["Vikhroli", "Bhandup", "Powai"],
    "Bhandup": ["Kanjurmarg", "Mulund"],
    "Mulund": ["Bhandup", "Thane"],
    "Thane": ["Mulund"],

    // CONNECTORS
    "BKC": ["Sion", "BandraKalanagar", "Kurla"],
    "Kurla": ["Sion", "BKC", "Ghatkopar", "SakiNaka"],
    "Airport": ["SantacruzEast", "VileParleEast", "SakiNaka"],
    "SakiNaka": ["AndheriEast", "Airport", "Powai", "Kurla", "Ghatkopar"], // Key Junction
    "Powai": ["AndheriEast", "SakiNaka", "Vikhroli", "Kanjurmarg"],
    "Vashi": ["Chembur"],
};

// Helper: Calculate distance
function getDist(p1, p2) {
    return Math.sqrt(Math.pow(p1.lat - p2.lat, 2) + Math.pow(p1.lng - p2.lng, 2));
}

// Helper: Find nearest graph node to a random lat/lng
function findNearestNode(point) {
    let nearest = null;
    let minDist = Infinity;

    Object.keys(NODES).forEach(nodeName => {
        const d = getDist(point, NODES[nodeName]);
        if (d < minDist) {
            minDist = d;
            nearest = nodeName;
        }
    });
    return nearest;
}

// DIJKSTRA'S ALGORITHM
export function findPath(startCoords, endCoords) {
    const startNode = findNearestNode(startCoords);
    const endNode = findNearestNode(endCoords);

    if (!startNode || !endNode) return [startCoords, endCoords];
    if (startNode === endNode) return [startCoords, endCoords];

    const distances = {};
    const prev = {};
    const queue = [];

    Object.keys(NODES).forEach(node => {
        distances[node] = Infinity;
        prev[node] = null;
        queue.push(node);
    });

    distances[startNode] = 0;

    while (queue.length > 0) {
        queue.sort((a, b) => distances[a] - distances[b]);
        const u = queue.shift();

        if (u === endNode) break;

        const neighbors = GRAPH[u] || [];
        neighbors.forEach(v => {
            if (queue.includes(v)) {
                const alt = distances[u] + getDist(NODES[u], NODES[v]);
                if (alt < distances[v]) {
                    distances[v] = alt;
                    prev[v] = u;
                }
            }
        });
    }

    const path = [];
    let u = endNode;
    if (prev[u] || u === startNode) {
        while (u) {
            path.unshift(NODES[u]);
            u = prev[u];
        }
    }

    // Smooth entry/exit
    return [startCoords, ...path, endCoords];
}
