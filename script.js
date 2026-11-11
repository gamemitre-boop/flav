/* =========================================================
   FLAVAPP — shared script (v2)
   ========================================================= */
(() => {
    const $ = (s, c = document) => c.querySelector(s);
    const $$ = (s, c = document) => [...c.querySelectorAll(s)];

    /* ---------- Current year ---------- */
    $$('.year').forEach((el) => (el.textContent = new Date().getFullYear()));

    /* ---------- Fallback when a Google Play icon can't load ---------- */
    $$('img[data-fb]').forEach((img) => {
        const swap = () => {
            const d = document.createElement('div');
            d.className = 'fb';
            d.textContent = img.dataset.fb;
            img.replaceWith(d);
        };
        if (img.complete && img.naturalWidth === 0) swap();
        else img.addEventListener('error', swap, { once: true });
    });

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

    /* ---------- Split headlines into animated lines ---------- */
    $$('.split').forEach((el) => {
        const lines = el.innerHTML.split(/<br\s*\/?>/i);
        el.innerHTML = lines
            .map((l, i) => `<span class="ln"><span style="--i:${i}">${l.trim()}</span></span>`)
            .join('');
    });

    /* ---------- Scroll reveal ---------- */
    $$('.apps-grid .reveal, .terms-list .reveal').forEach((el, i) =>
        el.style.setProperty('--d', `${(i % 4) * 0.08}s`)
    );
    const targets = $$('.reveal, .split, .doodle, .scribble');
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
        targets.forEach((el) => io.observe(el));
    } else {
        targets.forEach((el) => el.classList.add('in'));
    }

    /* ---------- Phone tilt follows the pointer ---------- */
    const stage = $('.phone-stage');
    const phone = $('.phone');
    if (stage && phone && matchMedia('(pointer:fine)').matches) {
        stage.addEventListener('pointermove', (e) => {
            const r = stage.getBoundingClientRect();
            const x = (e.clientX - r.left) / r.width - 0.5;
            const y = (e.clientY - r.top) / r.height - 0.5;
            phone.style.transform = `rotate(${8 + x * 6}deg) translateY(30px) perspective(900px) rotateY(${x * 10}deg) rotateX(${-y * 8}deg)`;
        });
        stage.addEventListener('pointerleave', () => (phone.style.transform = ''));
    }

    /* ---------- Count-up numbers ---------- */
    $$('[data-count]').forEach((el) => {
        const target = Number(el.dataset.count);
        const suffix = el.dataset.suffix || '';
        const co = new IntersectionObserver(([entry]) => {
            if (!entry.isIntersecting) return;
            co.disconnect();
            const t0 = performance.now();
            const dur = 1600;
            const tick = (t) => {
                const p = Math.min((t - t0) / dur, 1);
                el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))) + suffix;
                if (p < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
        co.observe(el);
    });

    /* ---------- FAQ: only one open at a time ---------- */
    const faqs = $$('.faq details');
    faqs.forEach((d) =>
        d.addEventListener('toggle', () => {
            if (d.open) faqs.forEach((o) => o !== d && (o.open = false));
        })
    );

    /* ---------- TOC scroll-spy (legal pages) ---------- */
    const tocLinks = $$('.toc a');
    if (tocLinks.length && 'IntersectionObserver' in window) {
        const map = new Map(tocLinks.map((a) => [a.getAttribute('href').slice(1), a]));
        const spy = new IntersectionObserver(
            (entries) => {
                entries.forEach((e) => {
                    if (!e.isIntersecting) return;
                    tocLinks.forEach((l) => l.classList.remove('active'));
                    const link = map.get(e.target.id);
                    if (link) {
                        link.classList.add('active');
                        const tn = link.parentElement;
                        if (tn && tn.scrollWidth > tn.clientWidth) {
                            tn.scrollTo({ left: link.offsetLeft - (tn.clientWidth - link.offsetWidth) / 2, behavior: 'smooth' });
                        }
                    }
                });
            },
            { rootMargin: '-25% 0px -65% 0px' }
        );
        map.forEach((_, id) => {
            const s = document.getElementById(id);
            if (s) spy.observe(s);
        });
    }

    /* ---------- Contact form -> opens the email app ---------- */
    const form = $('#contact-form');
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const d = new FormData(form);
            const to = form.dataset.email;
            const app = d.get('App') || 'General';
            const subject = encodeURIComponent(`Flavapp Support - ${app} - ${d.get('Name')}`);
            const body = encodeURIComponent(
                `Name: ${d.get('Name')}\nEmail: ${d.get('Email')}\nApp: ${app}\n\n${d.get('Message')}`
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
