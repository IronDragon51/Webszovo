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
    // HERO WEB — spider web / network animation
    // Generates anchor dots around the stage perimeter
    // (plus a few interior nodes), connects them with
    // criss-crossing lines, then animates everything in.
    // ════════════════════════════════════════
    const heroWeb = document.querySelector('.hero-web');
    if (!heroWeb) return;

    const SVG_NS = 'http://www.w3.org/2000/svg';
    const W = 1100;
    const H = 620;
    const margin = 70;

    // Anchor points — a mix of perimeter and interior nodes
    const points = [
        // perimeter — top edge (left to right)
        [margin,         margin],            // 0  TL
        [W * 0.30,       margin],            // 1
        [W * 0.50,       margin],            // 2  TM
        [W * 0.70,       margin],            // 3
        [W - margin,     margin],            // 4  TR
        // right edge
        [W - margin,     H * 0.35],          // 5
        [W - margin,     H * 0.65],          // 6
        // bottom edge (right to left)
        [W - margin,     H - margin],        // 7  BR
        [W * 0.70,       H - margin],        // 8
        [W * 0.50,       H - margin],        // 9  BM
        [W * 0.30,       H - margin],        // 10
        [margin,         H - margin],        // 11 BL
        // left edge
        [margin,         H * 0.65],          // 12
        [margin,         H * 0.35],          // 13
        // interior crossings — give the web depth
        [W * 0.28,       H * 0.40],          // 14
        [W * 0.72,       H * 0.40],          // 15
        [W * 0.28,       H * 0.60],          // 16
        [W * 0.72,       H * 0.60],          // 17
    ];

    // Build all line pairs that are "long enough" to feel intentional
    const lines = [];
    for (let i = 0; i < points.length; i++) {
        for (let j = i + 1; j < points.length; j++) {
            const dx = points[i][0] - points[j][0];
            const dy = points[i][1] - points[j][1];
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 180) lines.push({ a: i, b: j, dist });
        }
    }

    // Draw shorter lines first → entrance feels organic, weaving outward
    lines.sort((a, b) => a.dist - b.dist);

    // Append lines (behind dots in z-order)
    lines.forEach((ln, idx) => {
        const el = document.createElementNS(SVG_NS, 'line');
        el.setAttribute('class', 'web-line');
        el.setAttribute('x1', points[ln.a][0]);
        el.setAttribute('y1', points[ln.a][1]);
        el.setAttribute('x2', points[ln.b][0]);
        el.setAttribute('y2', points[ln.b][1]);
        const len = Math.ceil(ln.dist);
        el.style.strokeDasharray = len;
        el.style.strokeDashoffset = len;
        const delay = 250 + idx * 14;
        el.style.animation = `webDraw 0.9s cubic-bezier(0.65, 0, 0.35, 1) ${delay}ms forwards`;
        heroWeb.appendChild(el);
    });

    // Append dots (on top)
    points.forEach((p, idx) => {
        const el = document.createElementNS(SVG_NS, 'circle');
        el.setAttribute('class', 'web-dot');
        el.setAttribute('cx', p[0]);
        el.setAttribute('cy', p[1]);
        el.setAttribute('r', 3.5);
        const delay = 100 + idx * 35;
        el.style.animation = `webDotIn 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms forwards`;
        heroWeb.appendChild(el);
    });

    // Mark assembled → enables idle breathing animation in CSS
    const total = 250 + lines.length * 14 + 900;
    setTimeout(() => heroWeb.classList.add('assembled'), total);
})();