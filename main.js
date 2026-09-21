/* =========================================================
   موتور اسکرول — بدون وابستگی به کتابخانه
   هر بخشی که data-scrub دارد، متغیر CSS به نام --p (۰ تا ۱) می‌گیرد.
     data-scrub        → بخش چسبان (pin): از شروع تا پایان چسبیدن
     data-scrub="pass" → بخش معمولی: از ورود به صفحه تا خروج کامل
   ========================================================= */
(function () {
  'use strict';

  const $ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const fa = new Intl.NumberFormat('fa-IR');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const bar = $('.bar')[0];
  const scrubs = $('[data-scrub]');
  const navLinks = $('.rail a');
  const navTargets = navLinks.map(a => document.querySelector(a.getAttribute('href')));
  let vh = innerHeight;

  /* ---------- ذرات پلاسما (بخش فناوری) ---------- */
  (function buildParticles() {
    const g = document.getElementById('particles');
    if (!g) return;
    const NS = 'http://www.w3.org/2000/svg';
    let seed = 7;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const N = 62;
    for (let i = 0; i < N; i++) {
      const c = document.createElementNS(NS, 'circle');
      const x = 30 + (i / (N - 1)) * 340 + (rnd() - .5) * 10;
      const y = 316 + rnd() * 22;
      c.setAttribute('cx', x.toFixed(1));
      c.setAttribute('cy', y.toFixed(1));
      c.setAttribute('r', (3.5 + rnd() * 3.5).toFixed(1));
      c.style.setProperty('--d', (rnd() * .7).toFixed(3));
      c.style.setProperty('--fall', -(180 + rnd() * 120).toFixed(0) + 'px');
      g.appendChild(c);
    }
  })();

  /* ---------- پرده‌ی باز شدن عنوان‌ها ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: .4 });
  $('.mask').forEach(el => io.observe(el));

  /* ---------- هوک‌های اختصاصی هر بخش ---------- */
  const hooks = {
    intro(p, s) {
      const idx = Math.min(3, Math.floor(p * 4));
      s.dataset.active = idx;
      $('.im', s).forEach((el, i) => el.classList.toggle('is-on', i === idx));
      $('.feat', s).forEach((el, i) => el.style.setProperty('--fp', clamp(p * 4 - i).toFixed(3)));
    },
    tech(p, s) {
      const heat = clamp((p - .04) / .7);
      const n = Math.round(easeOut(heat) * 17000);
      const el = $('.js-heat', s)[0];
      el.textContent = fa.format(n);
      $('.heat', s)[0].style.setProperty('--heat', easeOut(heat).toFixed(3));
      s.style.setProperty('--heat', easeOut(heat).toFixed(3));
    },
    compare(p, s) {
      const t = clamp((p - .68) / .24);
      $('.js-pct', s)[0].textContent = fa.format(Math.round(easeOut(t) * 17));
    },
    methods(p, s) {
      const idx = Math.min(2, Math.floor(p * 3));
      $('.mdots i', s).forEach((el, i) => el.classList.toggle('on', i === idx));
    },
    benefits(p, s) {
      const items = $('.bitem', s);
      const idx = Math.min(items.length - 1, Math.floor(clamp((p - .04) / .9) * items.length));
      items.forEach((el, i) => {
        el.classList.toggle('on', i <= idx);
        el.classList.toggle('cur', i === idx);
      });
    },
    specs(p, s) {
      const t = clamp((p - .22) / .42);
      $('.js-years', s)[0].textContent = fa.format(Math.max(1, Math.round(easeOut(t) * 10)));
    }
  };

  /* ---------- حلقه‌ی به‌روزرسانی ---------- */
  const last = new Map();
  function update() {
    const y = scrollY;
    const total = document.documentElement.scrollHeight - vh;
    if (bar) bar.style.transform = 'scaleX(' + (total > 0 ? clamp(y / total) : 0).toFixed(4) + ')';

    for (const s of scrubs) {
      const r = s.getBoundingClientRect();
      let p;
      if (reduce) p = 1;
      else if (s.dataset.scrub === 'pass') p = (vh - r.top) / (vh + r.height);
      else p = -r.top / Math.max(1, r.height - vh);
      p = clamp(p);
      if (last.get(s) === p) continue;
      last.set(s, p);
      s.style.setProperty('--p', p.toFixed(4));
      const h = hooks[s.id];
      if (h) h(p, s);
    }

    // بخش فعال در ناوبری
    let cur = 0;
    navTargets.forEach((t, i) => {
      if (!t) return;
      if (t.getBoundingClientRect().top <= vh * .5) cur = i;
    });
    navLinks.forEach((a, i) => a.classList.toggle('on', i === cur));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { ticking = false; update(); });
  }

  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { vh = innerHeight; last.clear(); onScroll(); });
  addEventListener('load', () => { last.clear(); update(); });
  update();
})();
