// Vercel Serverless Function — GlowUp API
// NOTE: Vercel serverless functions have an ephemeral filesystem.
// This in-memory store resets on cold starts. For persistent data,
// connect a database (Vercel KV, Supabase, PlanetScale, etc.).
// The frontend has a localStorage fallback, so the app works fully
// even without a persistent backend.

let store = {
    fasting: { sessions: [], currentFast: null },
    nutrients: { logs: [] },
    resilience: { logs: [] },
    screenTime: { logs: [] },
    dopamineDetox: { sessions: [] },
    pomodoro: { totalSessions: 0 }
};

export default function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { url, method } = req;
    // Normalize path — strip /api prefix and query string
    const path = url.replace(/^\/api/, '').split('?')[0];

    try {
        // ---- USER DATA ----
        if (path === '/user' && method === 'GET') {
            return res.json(store);
        }
        if (path === '/user' && method === 'POST') {
            store = req.body;
            return res.json({ success: true });
        }

        // ---- FASTING ----
        if (path === '/fasting/start' && method === 'POST') {
            const { plan } = req.body || {};
            store.fasting.currentFast = {
                startTime: new Date().toISOString(),
                plan: plan || '16:8',
                targetHours: parseInt(plan) || 16
            };
            return res.json({ success: true, currentFast: store.fasting.currentFast });
        }

        if (path === '/fasting/stop' && method === 'POST') {
            if (store.fasting.currentFast) {
                const session = {
                    ...store.fasting.currentFast,
                    endTime: new Date().toISOString(),
                    durationHours: ((Date.now() - new Date(store.fasting.currentFast.startTime).getTime()) / 3600000).toFixed(1)
                };
                store.fasting.sessions.push(session);
                store.fasting.currentFast = null;
                return res.json({ success: true, session });
            }
            return res.json({ success: false, message: 'No active fast' });
        }

        if (path === '/fasting/status' && method === 'GET') {
            return res.json({
                currentFast: store.fasting.currentFast,
                totalSessions: store.fasting.sessions.length,
                sessions: store.fasting.sessions.slice(-7)
            });
        }

        // ---- NUTRIENTS ----
        if (path === '/nutrients/log' && method === 'POST') {
            const { meal, score, notes } = req.body || {};
            store.nutrients.logs.push({ date: new Date().toISOString(), meal, score, notes });
            return res.json({ success: true, total: store.nutrients.logs.length });
        }

        if (path === '/nutrients/logs' && method === 'GET') {
            return res.json(store.nutrients.logs.slice(-14));
        }

        // ---- RESILIENCE ----
        if (path === '/resilience/log' && method === 'POST') {
            const { stressor, rating, technique } = req.body || {};
            store.resilience.logs.push({ date: new Date().toISOString(), stressor, rating, technique });
            return res.json({ success: true });
        }

        if (path === '/resilience/logs' && method === 'GET') {
            return res.json(store.resilience.logs.slice(-14));
        }

        // ---- SCREEN TIME ----
        if (path === '/screentime/log' && method === 'POST') {
            const { hours, category } = req.body || {};
            store.screenTime.logs.push({ date: new Date().toISOString().split('T')[0], hours, category });
            return res.json({ success: true });
        }

        if (path === '/screentime/logs' && method === 'GET') {
            return res.json(store.screenTime.logs.slice(-7));
        }

        // ---- DOPAMINE DETOX ----
        if (path === '/detox/schedule' && method === 'POST') {
            const { date, duration, type } = req.body || {};
            store.dopamineDetox.sessions.push({ date, duration, type, completed: false });
            return res.json({ success: true });
        }

        // Match /detox/complete/:index
        const detoxMatch = path.match(/^\/detox\/complete\/(\d+)$/);
        if (detoxMatch && method === 'POST') {
            const i = parseInt(detoxMatch[1]);
            if (store.dopamineDetox.sessions[i]) {
                store.dopamineDetox.sessions[i].completed = true;
                return res.json({ success: true });
            }
            return res.status(404).json({ success: false });
        }

        if (path === '/detox/sessions' && method === 'GET') {
            return res.json(store.dopamineDetox.sessions.slice(-10));
        }

        // ---- FALLBACK ----
        return res.status(404).json({ error: 'Not found', path });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
}
