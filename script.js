/* =========================================================
   FLAVAPP — shared script
   ========================================================= */
(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];

    /* ---------- Header state + reading progress ---------- */
    const header = $('header');
    const bar = $('.progress');

    const onScroll = () => {
        const y = window.scrollY;
        if (header) header.classList.toggle('scrolled', y > 10);
        if (bar) {
            const max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
        }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    onScroll();

    /* ---------- Mobile menu ---------- */
    const btn = $('.menu-btn');
    const nav = $('#nav');

    const closeMenu = () => {
        if (!btn || !nav) return;
        nav.classList.remove('open');
        btn.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
    };

    if (btn && nav) {
        btn.addEventListener('click', () => {
            const open = nav.classList.toggle('open');
            btn.classList.toggle('open', open);
            btn.setAttribute('aria-expanded', String(open));
        });
        $$('a', nav).forEach((a) => a.addEventListener('click', closeMenu));
        document.addEventListener('keydown', (e) => e.key === 'Escape' && closeMenu());
    }

    /* ---------- Scroll reveal ---------- */
    $$('.apps-grid .reveal').forEach((el, i) => el.style.setProperty('--d', `${(i % 3) * 0.1}s`));

    if ('IntersectionObserver' in window) {
        const io = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add('in');
                        io.unobserve(e.target);
                    }
                });
            },
            { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
        );
        $$('.reveal').forEach((el) => io.observe(el));
    } else {
        $$('.reveal').forEach((el) => el.classList.add('in'));
    }

    /* ---------- Cursor spotlight on app cards ---------- */
    $$('.app-card').forEach((card) => {
        card.addEventListener('pointermove', (e) => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });

    /* ---------- Count-up numbers ---------- */
    $$('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const co = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            co.disconnect();
            const t0 = performance.now();
            const dur = 1400;
            const tick = (t) => {
                const p = Math.min((t - t0) / dur, 1);
                el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        co.observe(el);
    });

    /* ---------- Table of contents scroll-spy (privacy page) ---------- */
    const tocLinks = $$('.toc a');
    if (tocLinks.length && 'IntersectionObserver' in window) {
        const map = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
        const spy = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (!e.isIntersecting) return;
                    tocLinks.forEach((l) => l.classList.remove('active'));
                    const link = map.get(e.target.id);
                    if (link) link.classList.add('active');
                });
            },
            { rootMargin: '-25% 0px -65% 0px' }
        );
        map.forEach((_, id) => {
            const section = document.getElementById(id);
            if (section) spy.observe(section);
        });
    }

    /* ---------- Contact form -> opens the email app ---------- */
    const form = $('#contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const d = new FormData(form);
            const to = form.dataset.email;
            const subject = encodeURIComponent(`Flavapp Support - ${d.get('Name')}`);
            const body = encodeURIComponent(
                `Name: ${d.get('Name')}\nEmail: ${d.get('Email')}\n\n${d.get('Message')}`
            );
            window.location.href = `mailto:${to}?subject=${subject}&body=${body}`;
            const status = $('.form-status');
            if (status) {
                status.textContent = 'Opening your email app…';
                status.classList.add('show');
            }
        });
    }
})();
