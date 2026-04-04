const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'user-data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Ensure data directory and file exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({
        fasting: { sessions: [], currentFast: null },
        nutrients: { logs: [] },
        resilience: { logs: [] },
        screenTime: { logs: [] },
        dopamineDetox: { sessions: [] },
        pomodoro: { totalSessions: 0 }
    }, null, 2));
}

function readData() {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch { return {}; }
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// ============ API ROUTES ============

// GET all user data
app.get('/api/user', (req, res) => {
    res.json(readData());
});

// POST save all user data
app.post('/api/user', (req, res) => {
    writeData(req.body);
    res.json({ success: true });
});

// --- FASTING ---
app.post('/api/fasting/start', (req, res) => {
    const data = readData();
    const { plan } = req.body; // e.g. "16:8", "18:6", "20:4", "OMAD"
    data.fasting.currentFast = {
        startTime: new Date().toISOString(),
        plan: plan || '16:8',
        targetHours: parseInt(plan) || 16
    };
    writeData(data);
    res.json({ success: true, currentFast: data.fasting.currentFast });
});

app.post('/api/fasting/stop', (req, res) => {
    const data = readData();
    if (data.fasting.currentFast) {
        const session = {
            ...data.fasting.currentFast,
            endTime: new Date().toISOString(),
            durationHours: ((Date.now() - new Date(data.fasting.currentFast.startTime).getTime()) / 3600000).toFixed(1)
        };
        data.fasting.sessions.push(session);
        data.fasting.currentFast = null;
        writeData(data);
        res.json({ success: true, session });
    } else {
        res.json({ success: false, message: 'No active fast' });
    }
});

app.get('/api/fasting/status', (req, res) => {
    const data = readData();
    res.json({
        currentFast: data.fasting.currentFast,
        totalSessions: data.fasting.sessions.length,
        sessions: data.fasting.sessions.slice(-7) // last 7
    });
});

// --- NUTRIENTS ---
app.post('/api/nutrients/log', (req, res) => {
    const data = readData();
    const { meal, score, notes } = req.body;
    data.nutrients.logs.push({
        date: new Date().toISOString(),
        meal, score, notes
    });
    writeData(data);
    res.json({ success: true, total: data.nutrients.logs.length });
});

app.get('/api/nutrients/logs', (req, res) => {
    const data = readData();
    res.json(data.nutrients.logs.slice(-14)); // last 14 entries
});

// --- RESILIENCE ---
app.post('/api/resilience/log', (req, res) => {
    const data = readData();
    const { stressor, rating, technique } = req.body;
    data.resilience.logs.push({
        date: new Date().toISOString(),
        stressor, rating, technique
    });
    writeData(data);
    res.json({ success: true });
});

app.get('/api/resilience/logs', (req, res) => {
    const data = readData();
    res.json(data.resilience.logs.slice(-14));
});

// --- SCREEN TIME ---
app.post('/api/screentime/log', (req, res) => {
    const data = readData();
    const { hours, category } = req.body;
    data.screenTime.logs.push({
        date: new Date().toISOString().split('T')[0],
        hours, category
    });
    writeData(data);
    res.json({ success: true });
});

app.get('/api/screentime/logs', (req, res) => {
    const data = readData();
    res.json(data.screenTime.logs.slice(-7));
});

// --- DOPAMINE DETOX ---
app.post('/api/detox/schedule', (req, res) => {
    const data = readData();
    const { date, duration, type } = req.body;
    data.dopamineDetox.sessions.push({
        date, duration, type, completed: false
    });
    writeData(data);
    res.json({ success: true });
});

app.post('/api/detox/complete/:index', (req, res) => {
    const data = readData();
    const i = parseInt(req.params.index);
    if (data.dopamineDetox.sessions[i]) {
        data.dopamineDetox.sessions[i].completed = true;
        writeData(data);
        res.json({ success: true });
    } else {
        res.status(404).json({ success: false });
    }
});

app.get('/api/detox/sessions', (req, res) => {
    const data = readData();
    res.json(data.dopamineDetox.sessions.slice(-10));
});

// ============ START SERVER ============
app.listen(PORT, () => {
    console.log(`\n⚡ GlowUp Server running at http://localhost:${PORT}\n`);
    console.log(`   Open http://localhost:${PORT} in your browser\n`);
});
