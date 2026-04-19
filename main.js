/* ════════════════════════════════════════════
   WEBSZÖVŐ — main.js
   ──────────────────────
   • Mobile nav toggle
   • Nav scroll shadow
   • FAQ accordion
   • Scroll fade-up animations
   • Contact form
   • Calendly trigger
   • Hero weaver idle animation (post-assembly)
═══════════════════════════════════════════════ */

(function () {
    'use strict';

    // ── Mobile nav
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');
    if (navToggle && navLinks) {
        navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
        navLinks.querySelectorAll('a').forEach(a =>
            a.addEventListener('click', () => navLinks.classList.remove('open'))
        );
    }

    // ── Nav shadow on scroll
    const navEl = document.querySelector('nav');
    if (navEl) {
        window.addEventListener('scroll', () => {
            navEl.classList.toggle('scrolled', window.scrollY > 20);
        }, { passive: true });
    }

    // ── FAQ accordion
    document.querySelectorAll('.faq-q').forEach(btn => {
        btn.addEventListener('click', () => {
            const answer = btn.nextElementSibling;
            const isOpen = answer.classList.contains('open');
            document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
            document.querySelectorAll('.faq-q').forEach(q => q.classList.remove('active'));
            if (!isOpen) {
                answer.classList.add('open');
                btn.classList.add('active');
            }
        });
    });

    // ── Scroll fade-up animations
    const fadeObserver = new IntersectionObserver((entries) => {
        entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
    }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
    document.querySelectorAll('.fade-up').forEach(el => fadeObserver.observe(el));

    // ── Contact form
    window.handleFormSubmit = function (e) {
        e.preventDefault();
        const btn = e.target.querySelector('.form-submit');
        btn.innerHTML = '✓ Megkaptuk! Hamarosan jelentkezünk.';
        btn.disabled = true;
        e.target.querySelectorAll('input, textarea').forEach(el => el.disabled = true);
    };

    // ── Calendly popup triggers
    document.querySelectorAll('.calendly-trigger').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (window.Calendly) {
                window.Calendly.initPopupWidget({ url: 'https://calendly.com/webszovo/30min' });
            }
        });
    });

    // ════════════════════════════════════════
    // HERO WEB — full-bleed ambient network
    // Points are spread across the entire hero
    // section with a "clearing" in the center so
    // the text stays readable. After the entrance
    // draw, individual nodes pulse at random
    // intervals, briefly glowing their connected
    // lines — a living network, not a frozen one.
    // ════════════════════════════════════════
    const heroWeb = document.querySelector('.hero-web');
    if (!heroWeb) return;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const W = 1600;
    const H = 900;
    const CX = W / 2;
    const CY = H / 2;

    // Center "clearing" — lines that would cross too close to
    // the text get skipped. Tuned to roughly match text width.
    const CLEAR_RX = 360;
    const CLEAR_RY = 200;

    // Build anchor points in rings radiating from center so density
    // falls off organically toward the edges (no rectangular frame).
    const points = [];
    const rings = [
        { r: 280, count: 8,  jitter: 40 },   // inner ring (sparse, around text)
        { r: 450, count: 10, jitter: 60 },   // mid ring
        { r: 640, count: 12, jitter: 80 },   // outer ring
        { r: 820, count: 10, jitter: 90 },   // far ring (bleeds off-canvas)
    ];

    rings.forEach((ring, ringIdx) => {
        const offset = ringIdx * 0.3; // stagger rings so they don't align
        for (let i = 0; i < ring.count; i++) {
            const angle = (i / ring.count) * Math.PI * 2 + offset;
            const jr = ring.r + (Math.random() - 0.5) * ring.jitter;
            const ja = angle + (Math.random() - 0.5) * 0.15;
            // squash vertically a bit so the shape matches a wide hero
            const x = CX + Math.cos(ja) * jr;
            const y = CY + Math.sin(ja) * jr * 0.65;
            points.push([x, y]);
        }
    });

    // Line validity: skip lines that cross too close to center
    // (keeps the text area clear) and skip very short or very long ones.
    function crossesClearing(x1, y1, x2, y2) {
        // Sample along the line; reject if any sample lands in the ellipse
        const steps = 10;
        for (let t = 0; t <= 1; t += 1 / steps) {
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            const dx = (x - CX) / CLEAR_RX;
            const dy = (y - CY) / CLEAR_RY;
            if (dx * dx + dy * dy < 1) return true;
        }
        return false;
    }

    const lines = [];
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const dx = points[i][0] - points[j][0];
            const dy = points[i][1] - points[j][1];
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 220 || dist > 720) continue;
            if (crossesClearing(points[i][0], points[i][1], points[j][0], points[j][1])) continue;
            lines.push({ a: i, b: j, dist });
        }
    }

    // Shorter lines first for an organic "weaving outward" entrance
    lines.sort((a, b) => a.dist - b.dist);

    // Map from point index → list of line elements connected to it
    // (used by the pulse effect to glow a node's own threads).
    const nodeLines = Array(points.length).fill(0).map(() => []);

    // Append lines
   // Append lines
    const lineEls = [];
    lines.forEach((ln, idx) => {
        const el = document.createElementNS(SVG_NS, 'line');
        el.setAttribute('class', 'web-line');
        el.setAttribute('x1', points[ln.a][0]);
        el.setAttribute('y1', points[ln.a][1]);
        el.setAttribute('x2', points[ln.b][0]);
        el.setAttribute('y2', points[ln.b][1]);
        const depthOpacity = 1 - (ln.dist - 220) / 700;
        el.style.setProperty('--rest-opacity', (0.14 + depthOpacity * 0.18).toFixed(3));
        const len = Math.ceil(ln.dist);
        el.style.strokeDasharray = len;
        el.style.strokeDashoffset = len;
        const delay = 120 + idx * 6;
        el.style.animation = `webDraw 0.6s cubic-bezier(0.65, 0, 0.35, 1) ${delay}ms forwards`;
        heroWeb.appendChild(el);
        lineEls.push(el);
        nodeLines[ln.a].push(el);
        nodeLines[ln.b].push(el);
    });

    // Append dots — skip isolated ones
    const dotEls = [];
    points.forEach((p, idx) => {
        if (nodeLines[idx].length === 0) {
            dotEls.push(null);
            return;
        }
        const el = document.createElementNS(SVG_NS, 'circle');
        el.setAttribute('class', 'web-dot');
        el.setAttribute('cx', p[0]);
        el.setAttribute('cy', p[1]);
        el.setAttribute('r', 3);
        const delay = 50 + idx * 18;
        el.style.animation = `webDotIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms forwards`;
        heroWeb.appendChild(el);
        dotEls.push(el);
    });

    const total = 120 + lines.length * 6 + 600;

    setTimeout(() => {
        heroWeb.classList.add('assembled');

        function pulse() {
            if (document.hidden) { setTimeout(pulse, 2000); return; }
            const idx = Math.floor(Math.random() * dotEls.length);
            const dot = dotEls[idx];
            if (!dot) { setTimeout(pulse, 100); return; }
            const connected = nodeLines[idx];
            dot.classList.add('pulse');
            connected.forEach(l => l.classList.add('glow'));
            setTimeout(() => {
                dot.classList.remove('pulse');
                connected.forEach(l => l.classList.remove('glow'));
            }, 900);
            setTimeout(pulse, 700 + Math.random() * 700);
        }
        pulse();
    }, total);
})();