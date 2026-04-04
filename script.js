/* ========== GlowUp v2 — Main Script ========== */
document.addEventListener('DOMContentLoaded', () => {

    const API_BASE = window.location.protocol === 'file:' ? null : '';

    // ========== API HELPER ==========
    async function api(method, path, body) {
        if (!API_BASE && API_BASE !== '') {
            // Fallback to localStorage
            return localApi(method, path, body);
        }
        try {
            const opts = { method, headers: { 'Content-Type': 'application/json' } };
            if (body) opts.body = JSON.stringify(body);
            const res = await fetch(`/api${path}`, opts);
            return await res.json();
        } catch {
            return localApi(method, path, body);
        }
    }

    function localApi(method, path, body) {
        let data = JSON.parse(localStorage.getItem('glowup_data') || '{}');
        if (!data.fasting) data.fasting = { sessions: [], currentFast: null };
        if (!data.nutrients) data.nutrients = { logs: [] };
        if (!data.resilience) data.resilience = { logs: [] };
        if (!data.screenTime) data.screenTime = { logs: [] };
        if (!data.dopamineDetox) data.dopamineDetox = { sessions: [] };

        if (method === 'GET') {
            if (path === '/fasting/status') return { currentFast: data.fasting.currentFast, totalSessions: data.fasting.sessions.length, sessions: data.fasting.sessions.slice(-7) };
            if (path === '/nutrients/logs') return data.nutrients.logs.slice(-14);
            if (path === '/resilience/logs') return data.resilience.logs.slice(-14);
            if (path === '/screentime/logs') return data.screenTime.logs.slice(-7);
            if (path === '/detox/sessions') return data.dopamineDetox.sessions.slice(-10);
            return data;
        }
        if (method === 'POST') {
            if (path === '/fasting/start') {
                data.fasting.currentFast = { startTime: new Date().toISOString(), plan: body.plan || '16:8', targetHours: parseInt(body.plan) || 16 };
            } else if (path === '/fasting/stop') {
                if (data.fasting.currentFast) {
                    data.fasting.sessions.push({ ...data.fasting.currentFast, endTime: new Date().toISOString() });
                    data.fasting.currentFast = null;
                }
            } else if (path === '/nutrients/log') {
                data.nutrients.logs.push({ date: new Date().toISOString(), ...body });
            } else if (path === '/resilience/log') {
                data.resilience.logs.push({ date: new Date().toISOString(), ...body });
            } else if (path === '/screentime/log') {
                data.screenTime.logs.push({ date: new Date().toISOString().split('T')[0], ...body });
            } else if (path === '/detox/schedule') {
                data.dopamineDetox.sessions.push({ ...body, completed: false });
            } else if (path.startsWith('/detox/complete/')) {
                const i = parseInt(path.split('/').pop());
                if (data.dopamineDetox.sessions[i]) data.dopamineDetox.sessions[i].completed = true;
            }
        }
        localStorage.setItem('glowup_data', JSON.stringify(data));
        return { success: true };
    }

    // ========== PARTICLES ==========
    const particlesContainer = document.getElementById('particles');
    const colors = ['rgba(0,229,255,0.3)', 'rgba(168,85,247,0.3)', 'rgba(236,72,153,0.3)', 'rgba(245,158,11,0.2)'];
    for (let i = 0; i < 30; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const size = Math.random() * 4 + 2;
        p.style.cssText = `width:${size}px;height:${size}px;left:${Math.random()*100}%;top:${Math.random()*100}%;background:${colors[Math.floor(Math.random()*colors.length)]};animation-delay:${Math.random()*6}s;animation-duration:${4+Math.random()*6}s;`;
        particlesContainer.appendChild(p);
    }

    // ========== CURSOR GLOW ==========
    const cursorGlow = document.getElementById('cursorGlow');
    const cursorDot = document.getElementById('cursorDot');
    let mouseX = 0, mouseY = 0, glowX = 0, glowY = 0;
    function animateCursor() {
        glowX += (mouseX - glowX) * 0.12;
        glowY += (mouseY - glowY) * 0.12;
        cursorGlow.style.left = glowX + 'px';
        cursorGlow.style.top = glowY + 'px';
        cursorDot.style.left = mouseX + 'px';
        cursorDot.style.top = mouseY + 'px';
        requestAnimationFrame(animateCursor);
    }
    animateCursor();
    document.addEventListener('mousemove', (e) => { mouseX = e.clientX; mouseY = e.clientY; cursorGlow.classList.add('active'); cursorDot.classList.add('active'); });
    document.addEventListener('mouseleave', () => { cursorGlow.classList.remove('active'); cursorDot.classList.remove('active'); });

    // Card 3D tilt
    document.querySelectorAll('.glass-card').forEach(card => {
        card.addEventListener('mouseenter', () => { cursorGlow.classList.add('on-card'); cursorDot.classList.add('on-card'); });
        card.addEventListener('mouseleave', () => { cursorGlow.classList.remove('on-card'); cursorDot.classList.remove('on-card'); card.style.transform = ''; });
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mouse-x', (e.clientX - r.left) + 'px');
            card.style.setProperty('--mouse-y', (e.clientY - r.top) + 'px');
            const tX = ((e.clientY - r.top - r.height/2) / (r.height/2)) * -3;
            const tY = ((e.clientX - r.left - r.width/2) / (r.width/2)) * 3;
            card.style.transform = `perspective(800px) rotateX(${tX}deg) rotateY(${tY}deg) translateY(-4px)`;
        });
    });

    // ========== HERO CAROUSEL ==========
    const track = document.getElementById('carouselTrack');
    const carouselCards = track.querySelectorAll('.carousel-card');
    const prevBtn = document.getElementById('carouselPrev');
    const nextBtn = document.getElementById('carouselNext');
    const dotsContainer = document.getElementById('carouselDots');
    let carouselIndex = 0;
    const cardW = 256, visCards = 3, maxIdx = Math.max(0, carouselCards.length - visCards);
    carouselCards.forEach((_, i) => {
        const d = document.createElement('div');
        d.className = 'carousel-dot-item' + (i === 0 ? ' active' : '');
        d.addEventListener('click', () => goSlide(Math.min(i, maxIdx)));
        dotsContainer.appendChild(d);
    });
    function updateCarousel() {
        track.style.transform = `translateX(-${carouselIndex * cardW}px)`;
        dotsContainer.querySelectorAll('.carousel-dot-item').forEach((d, i) => d.classList.toggle('active', i === carouselIndex));
    }
    function goSlide(i) { carouselIndex = Math.max(0, Math.min(i, maxIdx)); updateCarousel(); }
    prevBtn.addEventListener('click', () => goSlide(carouselIndex - 1));
    nextBtn.addEventListener('click', () => goSlide(carouselIndex + 1));
    let autoSlide = setInterval(() => { carouselIndex = carouselIndex >= maxIdx ? 0 : carouselIndex + 1; updateCarousel(); }, 4000);
    document.getElementById('heroCarousel').addEventListener('mouseenter', () => clearInterval(autoSlide));
    document.getElementById('heroCarousel').addEventListener('mouseleave', () => { autoSlide = setInterval(() => { carouselIndex = carouselIndex >= maxIdx ? 0 : carouselIndex + 1; updateCarousel(); }, 4000); });
    carouselCards.forEach(c => c.addEventListener('click', () => { if (c.dataset.goto) showSection(c.dataset.goto); }));

    // ========== TAB NAV ==========
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-links a[data-section]');
    const heroSection = document.getElementById('hero');
    const contentSections = document.querySelectorAll('.section');
    const footer = document.querySelector('.footer');

    function showHero() {
        heroSection.style.display = '';
        footer.style.display = 'none';
        contentSections.forEach(s => { s.style.display = 'none'; s.classList.remove('section-visible'); });
        navLinks.forEach(l => l.classList.remove('active'));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navbar.classList.remove('scrolled');
    }

    function showSection(id) {
        heroSection.style.display = 'none';
        contentSections.forEach(s => { s.style.display = 'none'; s.classList.remove('section-visible'); });
        const t = document.getElementById(id);
        if (t) {
            t.style.display = '';
            footer.style.display = '';
            setTimeout(() => {
                t.classList.add('section-visible');
                t.querySelectorAll('.reveal, .reveal-left').forEach(el => {
                    setTimeout(() => el.classList.add('active'), parseInt(el.dataset.delay || 0));
                });
            }, 50);
        }
        navLinks.forEach(l => l.classList.toggle('active', l.dataset.section === id));
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navbar.classList.add('scrolled');
    }
    window.showSection = showSection;

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            showSection(link.dataset.section);
            hamburger.classList.remove('active');
            navLinksEl.classList.remove('open');
        });
    });

    document.querySelector('.nav-logo').addEventListener('click', (e) => { e.preventDefault(); showHero(); });

    document.querySelectorAll('.hero-actions a').forEach(btn => {
        btn.addEventListener('click', (e) => { e.preventDefault(); const h = btn.getAttribute('href'); if (h?.startsWith('#')) showSection(h.substring(1)); });
    });

    document.querySelectorAll('.footer a[href^="#"]').forEach(link => {
        link.addEventListener('click', (e) => { e.preventDefault(); const h = link.getAttribute('href'); if (h?.startsWith('#')) showSection(h.substring(1)); });
    });

    window.addEventListener('scroll', () => { if (heroSection.style.display !== 'none') navbar.classList.toggle('scrolled', window.scrollY > 50); });
    contentSections.forEach(s => s.style.display = 'none');
    footer.style.display = 'none';

    const hamburger = document.getElementById('hamburger');
    const navLinksEl = document.getElementById('navLinks');
    hamburger.addEventListener('click', () => { hamburger.classList.toggle('active'); navLinksEl.classList.toggle('open'); });

    // ========== COUNTER ANIMATION ==========
    const counters = document.querySelectorAll('.stat-number');
    let countersDone = false;
    const counterObs = new IntersectionObserver((entries) => {
        entries.forEach(e => {
            if (e.isIntersecting && !countersDone) {
                countersDone = true;
                counters.forEach(c => {
                    const t = parseInt(c.dataset.target); let cur = 0; const inc = t / 50;
                    const timer = setInterval(() => { cur += inc; if (cur >= t) { c.textContent = t; clearInterval(timer); } else c.textContent = Math.floor(cur); }, 30);
                });
            }
        });
    }, { threshold: 0.3 });
    if (counters.length) counterObs.observe(counters[0].closest('.hero-stats'));

    setTimeout(() => {
        heroSection.querySelectorAll('.reveal, .reveal-left').forEach(el => {
            setTimeout(() => el.classList.add('active'), parseInt(el.dataset.delay || 0));
        });
    }, 200);

    // ========== SLEEP CALCULATOR ==========
    document.getElementById('calcSleepBtn').addEventListener('click', () => {
        const [h, m] = document.getElementById('wakeTime').value.split(':').map(Number);
        const wake = new Date(); wake.setHours(h, m, 0, 0);
        const results = document.getElementById('sleepResults');
        results.innerHTML = '';
        [6, 5, 4, 3].forEach((cyc, i) => {
            const sleep = new Date(wake.getTime() - (cyc * 90 + 15) * 60000);
            const time = sleep.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            const labels = ['Ideal (9h)', 'Great (7.5h)', 'Good (6h)', 'Minimum (4.5h)'];
            const tags = ['tag-ideal', 'tag-ideal', 'tag-good', 'tag-short'];
            const div = document.createElement('div');
            div.className = 'sleep-result-item';
            div.innerHTML = `<span class="cycles">${cyc} cycles</span><span class="time">${time}</span><span class="tag ${tags[i]}">${labels[i]}</span>`;
            results.appendChild(div);
        });
    });

    // ========== POMODORO TIMER ==========
    const FOCUS = 25*60, BREAK = 5*60, LBREAK = 15*60, CIRC = 2*Math.PI*90;
    let pomo = { timeLeft: FOCUS, total: FOCUS, running: false, focus: true, sessions: 0, interval: null };
    const pomoTime = document.getElementById('pomoTime'), pomoLabel = document.getElementById('pomoLabel');
    const pomoRing = document.getElementById('pomoRing'), pomoSess = document.getElementById('pomoSessions'), pomoMode = document.getElementById('pomoMode');

    function updatePomo() {
        pomoTime.textContent = `${String(Math.floor(pomo.timeLeft/60)).padStart(2,'0')}:${String(pomo.timeLeft%60).padStart(2,'0')}`;
        const p = 1 - pomo.timeLeft / pomo.total;
        pomoRing.style.strokeDasharray = CIRC;
        pomoRing.style.strokeDashoffset = CIRC * (1 - p);
        pomoRing.style.stroke = pomo.focus ? '#0891b2' : '#7c3aed';
        pomoLabel.textContent = pomo.focus ? 'Focus Time' : 'Break Time';
        pomoMode.textContent = pomo.focus ? '🟢 Focus' : '🟣 Break';
        pomoSess.textContent = pomo.sessions;
    }
    function startPomo() {
        if (pomo.running) return;
        pomo.running = true;
        pomo.interval = setInterval(() => {
            pomo.timeLeft--;
            updatePomo();
            if (pomo.timeLeft <= 0) {
                clearInterval(pomo.interval); pomo.running = false;
                if (pomo.focus) { pomo.sessions++; pomo.focus = false; pomo.total = pomo.sessions % 4 === 0 ? LBREAK : BREAK; }
                else { pomo.focus = true; pomo.total = FOCUS; }
                pomo.timeLeft = pomo.total;
                updatePomo(); startPomo();
            }
        }, 1000);
    }
    document.getElementById('pomoStart').addEventListener('click', startPomo);
    document.getElementById('pomoPause').addEventListener('click', () => { clearInterval(pomo.interval); pomo.running = false; });
    document.getElementById('pomoReset').addEventListener('click', () => { clearInterval(pomo.interval); pomo.running = false; pomo.focus = true; pomo.sessions = 0; pomo.total = FOCUS; pomo.timeLeft = FOCUS; updatePomo(); });
    updatePomo();

    // ========== WORKOUT/MEAL TABS ==========
    function initTabs(id) {
        const bar = document.getElementById(id);
        if (!bar) return;
        const btns = bar.querySelectorAll('.tab-btn');
        const sec = bar.closest('.workout-section, .meal-section');
        btns.forEach(b => b.addEventListener('click', () => {
            btns.forEach(x => x.classList.remove('active'));
            sec.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            b.classList.add('active');
            document.getElementById(`tab-${b.dataset.tab}`).classList.add('active');
        }));
    }
    initTabs('workoutTabs');
    initTabs('mealTabs');

    // ========== FASTING TRACKER ==========
    const FAST_CIRC = 2 * Math.PI * 85;
    let fastState = { running: false, startTime: null, targetHours: 16, interval: null };
    const fastTime = document.getElementById('fastTime');
    const fastStatus = document.getElementById('fastStatus');
    const fastRing = document.getElementById('fastRing');
    const fastToggle = document.getElementById('fastToggle');
    const fastSessions = document.getElementById('fastSessions');

    document.querySelectorAll('.fast-preset').forEach(btn => {
        btn.addEventListener('click', () => {
            if (fastState.running) return;
            document.querySelectorAll('.fast-preset').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            fastState.targetHours = parseInt(btn.dataset.hours);
        });
    });

    function updateFastDisplay() {
        if (!fastState.running) return;
        const elapsed = (Date.now() - fastState.startTime) / 1000;
        const h = Math.floor(elapsed / 3600), m = Math.floor((elapsed % 3600) / 60), s = Math.floor(elapsed % 60);
        fastTime.textContent = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
        const progress = Math.min(elapsed / (fastState.targetHours * 3600), 1);
        fastRing.style.strokeDasharray = FAST_CIRC;
        fastRing.style.strokeDashoffset = FAST_CIRC * (1 - progress);
        if (progress >= 1) fastStatus.textContent = '✅ Goal Reached!';
        else if (elapsed >= 16 * 3600) fastStatus.textContent = '🔬 Autophagy Active';
        else if (elapsed >= 12 * 3600) fastStatus.textContent = '🔥 Fat Burning';
        else fastStatus.textContent = '⏳ Fasting...';
    }

    fastToggle.addEventListener('click', async () => {
        if (!fastState.running) {
            fastState.running = true;
            fastState.startTime = Date.now();
            fastToggle.textContent = '⏹ End Fast';
            fastToggle.style.background = 'linear-gradient(135deg, #dc2626, #f97316)';
            await api('POST', '/fasting/start', { plan: `${fastState.targetHours}:${24-fastState.targetHours}` });
            fastState.interval = setInterval(updateFastDisplay, 1000);
            updateFastDisplay();
        } else {
            fastState.running = false;
            clearInterval(fastState.interval);
            fastToggle.textContent = '▶ Start Fast';
            fastToggle.style.background = '';
            fastStatus.textContent = 'Completed!';
            await api('POST', '/fasting/stop');
            const status = await api('GET', '/fasting/status');
            fastSessions.textContent = status.totalSessions || 0;
        }
    });

    // Load fasting status
    (async () => {
        const status = await api('GET', '/fasting/status');
        if (status) fastSessions.textContent = status.totalSessions || 0;
    })();

    // ========== NUTRIENT SCORECARD ==========
    let selectedScore = 0;
    document.querySelectorAll('.score-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            selectedScore = parseInt(dot.dataset.score);
            document.querySelectorAll('.score-dot').forEach(d => d.classList.toggle('active', parseInt(d.dataset.score) <= selectedScore));
        });
    });

    document.getElementById('logNutrient').addEventListener('click', async () => {
        const meal = document.getElementById('nutrientMeal').value.trim();
        if (!meal || !selectedScore) return;
        await api('POST', '/nutrients/log', { meal, score: selectedScore });
        document.getElementById('nutrientMeal').value = '';
        document.querySelectorAll('.score-dot').forEach(d => d.classList.remove('active'));
        selectedScore = 0;
        const logs = await api('GET', '/nutrients/logs');
        if (logs && logs.length) {
            const avg = (logs.reduce((s, l) => s + (l.score || 0), 0) / logs.length).toFixed(1);
            document.getElementById('nutrientAvg').textContent = avg;
        }
    });

    // ========== BOX BREATHING ==========
    let breathState = { running: false, phase: 0, count: 4, interval: null };
    const phases = ['Inhale', 'Hold', 'Exhale', 'Hold'];
    const breathBall = document.getElementById('breathBall');
    const breathPhase = document.getElementById('breathPhase');
    const breathCounter = document.getElementById('breathCounter');
    // Ball positions: top-left, top-right, bottom-right, bottom-left
    const positions = [
        { top: '0px', left: '140px' },      // Inhale → top-right
        { top: '140px', left: '140px' },     // Hold → bottom-right
        { top: '140px', left: '0px' },       // Exhale → bottom-left
        { top: '0px', left: '0px' }          // Hold → top-left
    ];

    function breathTick() {
        breathState.count--;
        breathCounter.textContent = breathState.count;
        if (breathState.count <= 0) {
            breathState.phase = (breathState.phase + 1) % 4;
            breathState.count = 4;
            breathPhase.textContent = phases[breathState.phase];
            breathCounter.textContent = 4;
            const pos = positions[breathState.phase];
            breathBall.style.top = pos.top;
            breathBall.style.left = pos.left;
        }
    }

    document.getElementById('breathStart').addEventListener('click', () => {
        if (breathState.running) return;
        breathState.running = true;
        breathState.phase = 0;
        breathState.count = 4;
        breathPhase.textContent = 'Inhale';
        breathCounter.textContent = 4;
        breathBall.style.transition = 'all 4s ease-in-out';
        breathBall.style.top = positions[0].top;
        breathBall.style.left = positions[0].left;
        breathState.interval = setInterval(breathTick, 1000);
    });

    document.getElementById('breathStop').addEventListener('click', () => {
        breathState.running = false;
        clearInterval(breathState.interval);
        breathPhase.textContent = 'Ready';
        breathCounter.textContent = '4';
        breathBall.style.transition = 'all 0.3s';
        breathBall.style.top = '0px';
        breathBall.style.left = '0px';
    });

    // ========== NEGATIVE VISUALIZATION ==========
    const stoicPrompts = [
        '"What if I lost everything tomorrow? What truly matters?"',
        '"Imagine your last day alive. How would you spend it?"',
        '"If you lost your health, what would you give to get it back?"',
        '"What if everyone you love disappeared? Would you regret unsaid words?"',
        '"Picture yourself 10 years from now having done nothing. How does it feel?"',
        '"What if your biggest fear came true? Could you survive it?"',
        '"Imagine waking up with nothing — no phone, no money, no status. Who are you?"',
        '"What if this is the last conversation you ever have? What would you say?"',
        '"Visualize losing your freedom. What do you take for granted?"',
        '"If failure was impossible, what would you attempt? Now imagine never trying."'
    ];
    document.getElementById('newPrompt').addEventListener('click', () => {
        const prompt = stoicPrompts[Math.floor(Math.random() * stoicPrompts.length)];
        document.querySelector('#vizPrompt blockquote').textContent = prompt;
    });

    // ========== RESILIENCE LOGGER ==========
    const stressSlider = document.getElementById('stressRating');
    const stressVal = document.getElementById('stressVal');
    stressSlider.addEventListener('input', () => stressVal.textContent = stressSlider.value);

    document.getElementById('logResilience').addEventListener('click', async () => {
        const stressor = document.getElementById('stressorInput').value.trim();
        const rating = parseInt(stressSlider.value);
        const technique = document.getElementById('copingTechnique').value;
        if (!stressor) return;
        await api('POST', '/resilience/log', { stressor, rating, technique });
        document.getElementById('stressorInput').value = '';
        stressSlider.value = 5; stressVal.textContent = '5';
        document.getElementById('copingTechnique').value = '';
        loadResilienceLogs();
    });

    async function loadResilienceLogs() {
        const logs = await api('GET', '/resilience/logs');
        const container = document.getElementById('resilienceEntries');
        if (!logs || !logs.length) { container.innerHTML = '<p class="calc-hint">No entries yet</p>'; return; }
        container.innerHTML = logs.slice(-5).reverse().map(l =>
            `<div class="res-entry"><span>${l.stressor}</span><span class="res-stress">${l.rating}/10</span><span>${l.technique || '—'}</span></div>`
        ).join('');
    }
    loadResilienceLogs();

    // ========== SCREEN TIME CHART ==========
    function drawScreenChart(logs) {
        const canvas = document.getElementById('screenChart');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const data = new Array(7).fill(0);
        logs.forEach((l, i) => { if (i < 7) data[i] = l.hours || 0; });

        const maxVal = Math.max(...data, 8);
        const barW = (w - 60) / 7;
        const baseY = h - 30;

        // Grid lines
        ctx.strokeStyle = 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = baseY - (baseY - 20) * (i / 4);
            ctx.beginPath(); ctx.moveTo(40, y); ctx.lineTo(w - 10, y); ctx.stroke();
            ctx.fillStyle = '#8888a0'; ctx.font = '10px Inter';
            ctx.fillText(Math.round(maxVal * i / 4) + 'h', 5, y + 4);
        }

        // Bars
        data.forEach((val, i) => {
            const barH = (val / maxVal) * (baseY - 20);
            const x = 45 + i * barW;
            const gradient = ctx.createLinearGradient(x, baseY, x, baseY - barH);
            gradient.addColorStop(0, 'rgba(8,145,178,0.3)');
            gradient.addColorStop(1, 'rgba(124,58,237,0.6)');
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.roundRect(x + 4, baseY - barH, barW - 8, barH, 4);
            ctx.fill();

            ctx.fillStyle = '#555570'; ctx.font = '10px Inter'; ctx.textAlign = 'center';
            ctx.fillText(days[i], x + barW / 2, h - 10);
            if (val > 0) { ctx.fillStyle = '#1a1a2e'; ctx.font = 'bold 11px Inter'; ctx.fillText(val + 'h', x + barW / 2, baseY - barH - 6); }
        });
    }

    document.getElementById('logScreenTime').addEventListener('click', async () => {
        const hours = parseFloat(document.getElementById('screenHours').value);
        const category = document.getElementById('screenCategory').value;
        if (isNaN(hours)) return;
        await api('POST', '/screentime/log', { hours, category });
        document.getElementById('screenHours').value = '';
        const logs = await api('GET', '/screentime/logs');
        drawScreenChart(logs || []);
    });

    (async () => { const logs = await api('GET', '/screentime/logs'); drawScreenChart(logs || []); })();

    // ========== DOPAMINE DETOX ==========
    document.getElementById('scheduleDetox').addEventListener('click', async () => {
        const type = document.getElementById('detoxType').value;
        const date = new Date(); date.setDate(date.getDate() + 1);
        await api('POST', '/detox/schedule', { date: date.toISOString().split('T')[0], type, duration: type === 'Full Day' ? '24h' : type === 'Half Day' ? '12h' : type === 'Evening' ? '6h' : '48h' });
        loadDetoxList();
    });

    async function loadDetoxList() {
        const sessions = await api('GET', '/detox/sessions');
        const container = document.getElementById('detoxList');
        if (!sessions || !sessions.length) { container.innerHTML = '<p class="calc-hint">No detox sessions scheduled</p>'; return; }
        container.innerHTML = sessions.map((s, i) =>
            `<div class="detox-item ${s.completed ? 'completed' : ''}"><span>${s.type} — ${s.date}</span>${!s.completed ? `<button onclick="completeDetox(${i})">✓ Done</button>` : '<span>✅</span>'}</div>`
        ).join('');
    }
    window.completeDetox = async (i) => { await api('POST', `/detox/complete/${i}`); loadDetoxList(); };
    loadDetoxList();

    // ========== FOCUS CHALLENGE ==========
    let focusState = { minutes: 20, timeLeft: 20 * 60, running: false, interval: null };
    const focusTime = document.getElementById('focusTime');

    document.querySelectorAll('.focus-level-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            if (focusState.running) return;
            document.querySelectorAll('.focus-level-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            focusState.minutes = parseInt(btn.dataset.minutes);
            focusState.timeLeft = focusState.minutes * 60;
            focusTime.textContent = `${focusState.minutes}:00`;
        });
    });

    document.getElementById('focusStart').addEventListener('click', () => {
        if (focusState.running) return;
        focusState.running = true;
        focusState.interval = setInterval(() => {
            focusState.timeLeft--;
            const m = Math.floor(focusState.timeLeft / 60), s = focusState.timeLeft % 60;
            focusTime.textContent = `${m}:${String(s).padStart(2, '0')}`;
            if (focusState.timeLeft <= 0) {
                clearInterval(focusState.interval);
                focusState.running = false;
                focusTime.textContent = '🎉 Done!';
            }
        }, 1000);
    });

    document.getElementById('focusReset').addEventListener('click', () => {
        clearInterval(focusState.interval);
        focusState.running = false;
        focusState.timeLeft = focusState.minutes * 60;
        focusTime.textContent = `${focusState.minutes}:00`;
    });

});
