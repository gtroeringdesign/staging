/* Phones only: sideways rows.
   Projects page: each project's Use, Form, Function and Build sit side by side.
   About page: the six story chapters sit side by side.
   You move between them only by swiping or tapping a tab. Scrolling up and down
   just reads the page. On the Projects page the "Next project" link appears once
   you have reached Build. */
(() => {
  if (innerWidth >= 900) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
  .m-track { display: flex; gap: 32px; overflow-x: auto; overflow-y: hidden; align-items: flex-start;
    scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain;
    padding-block: 0 8px !important; }
  .m-track::-webkit-scrollbar { display: none; }
  .m-track > .m-panel { flex: 0 0 100%; scroll-snap-align: none start; scroll-snap-stop: always; min-height: 0; opacity: 1; }
  .pstory.m-row .pch { padding-block: 8px 20px; }
  .story.m-row .chapter { padding-block: 8px 20px; }
  .pstory.m-row .pch-figs.mrow { overflow: visible; display: flex; gap: 8px; }
  .pstory.m-row .pch-figs.mrow .pch-fig { flex: var(--ar) 1 0; min-width: 0; }
  .pstory.m-row .pch-figs.mrow .pch-fig div { height: auto; width: 100%; aspect-ratio: var(--ar); }
  .m-tabs { display: flex; gap: 6px; padding: 18px 0 14px; }
  .m-tabs button { flex: 1; min-width: 0; font: inherit; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--caption, #8A877D); background: none; border: 0; border-top: 2px solid var(--rule, #B8B4AC);
    padding: 8px 0 0; text-align: left; cursor: pointer; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    transition: color .3s, border-color .3s; }
  .m-tabs button.on { color: var(--ink, #1F1E1B); border-top-color: var(--ink, #1F1E1B); }
  .m-tabs button b { color: var(--signal-ink, #B44614); font-weight: 500; margin-right: 4px; }
  .m-hint { display: flex; justify-content: flex-end; margin-top: 18px; }
  .m-hint button { background: none; border: 0; padding: 6px 0 6px 12px; cursor: pointer; color: var(--ink, #1F1E1B); }
  .m-hint svg { width: 64px; height: 14px; fill: none; stroke: currentColor; stroke-width: 1; overflow: visible; }
  .m-hint.nudge svg { animation: m-nudge 1.8s ease-in-out 3; }
  @keyframes m-nudge { 0%, 100% { transform: none; } 50% { transform: translateX(8px); } }
  .m-hold { display: none !important; }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const arrow = '<svg viewBox="0 0 64 14" aria-hidden="true"><path d="M0 7h62M55 1l7 6-7 6"/></svg>';

  function makeRow(host, track, panels, label, hint, onBuild) {
    host.classList.add('m-row');
    track.classList.add('m-track');
    panels.forEach(p => p.classList.add('m-panel'));
    const tabs = document.createElement('div');
    tabs.className = 'm-tabs';
    tabs.innerHTML = panels.map((p, i) => `<button type="button"${i === 0 ? ' class="on"' : ''}>${label(p, i)}</button>`).join('');
    track.parentElement.insertBefore(tabs, track);
    const row = { track, panels, tabs: [...tabs.children], tabsEl: tabs, cur: 0, onBuild };
    row.tabs.forEach((b, i) => b.addEventListener('click', () => go(row, i)));
    if (hint) {
      const h = document.createElement('div');
      h.className = 'm-hint';
      h.innerHTML = `<button type="button" aria-label="Next section">${arrow}</button>`;
      panels[0].appendChild(h);
      h.querySelector('button').addEventListener('click', () => go(row, 1));
      new IntersectionObserver((es, o) => es.forEach(e => {
        if (e.isIntersecting && !reduce) { h.classList.add('nudge'); o.disconnect(); }
      }), { threshold: 1 }).observe(h);
    }
    /* A sideways swipe must never move the page up or down. Some phones nudge the page while the
       row snaps into place; if that happens during a sideways swipe, put the page back. */
    let sx = 0, sy = 0, keepY = null, sideways = false, keepT;
    track.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; keepY = scrollY; sideways = false; }, { passive: true });
    track.addEventListener('touchmove', e => {
      const dx = Math.abs(e.touches[0].clientX - sx), dy = Math.abs(e.touches[0].clientY - sy);
      if (dx > 10 && dx > dy * 1.5) sideways = true;
    }, { passive: true });
    track.addEventListener('touchend', () => {
      if (!sideways) { keepY = null; return; }
      clearTimeout(keepT); keepT = setTimeout(() => { keepY = null; }, 900);
    }, { passive: true });
    addEventListener('scroll', () => {
      if (sideways && keepY !== null && Math.abs(scrollY - keepY) > 2) scrollTo({ top: keepY, behavior: 'instant' });
    }, { passive: true });
    let t;
    track.addEventListener('scroll', () => {
      clearTimeout(t);
      t = setTimeout(() => {
        const step = panels[1] ? panels[1].offsetLeft - panels[0].offsetLeft : 1;
        const i = Math.max(0, Math.min(panels.length - 1, Math.round(track.scrollLeft / step)));
        if (i !== row.cur) setActive(row, i, false);   /* a swipe never moves the page up or down */
      }, 90);
    }, { passive: true });
    return row;
  }
  /* Every section in a row gets the height of the tallest one, so swiping never changes the page length */
  function size(row) { row.track.style.height = Math.max(...row.panels.map(p => p.offsetHeight)) + 8 + 'px'; }
  function setActive(row, i, bringIntoView) {
    row.cur = i;
    row.tabs.forEach((b, k) => b.classList.toggle('on', k === i));
    size(row);
    if (i === row.panels.length - 1) { row.done = true; if (row.onBuild) row.onBuild(); }
    if (bringIntoView) {                      /* new section: show its start if you were further down */
      const nav = document.querySelector('.nav').getBoundingClientRect().bottom;
      const top = row.tabsEl.getBoundingClientRect().top;
      if (top < nav) scrollTo({ top: scrollY + top - nav - 8, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function go(row, i) {
    row.track.scrollTo({ left: row.panels[i].offsetLeft - row.panels[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    setActive(row, i, true);
  }

  const rows = [];

  /* Projects page */
  const holdRows = [];
  document.querySelectorAll('.proj').forEach((proj, n) => {
    const story = proj.querySelector('.pstory');
    if (!story) return;
    const row = makeRow(story, story.querySelector('.pstory-text'), [...story.querySelectorAll('.pch')],
      p => `<b>${(p.querySelector('.uffb-head .label b')?.textContent || '').slice(-1)}</b>${p.querySelector('h3')?.textContent || ''}`,
      n === 0, () => hold());
    /* everything below this project's sections: the following projects and the contact section */
    row.after = [];
    const nextLink = proj.querySelector('.proj-next');
    if (nextLink) row.after.push(nextLink);
    for (let el = proj.nextElementSibling; el; el = el.nextElementSibling) row.after.push(el);
    rows.push(row); holdRows.push(row);
  });

  /* While you are in a row of sections, what comes after it stays out of sight until you have
     reached the last section once. After that the page scrolls freely. Only content below the
     row is hidden, so what you are looking at never jumps. */
  let held = null, jumping = false, jumpT;
  function release() { if (held) held.after.forEach(el => el.classList.remove('m-hold')); held = null; }
  function hold() {
    if (jumping) return;                      /* never hide anything while a link is taking you somewhere */
    const nav = document.querySelector('.nav').getBoundingClientRect().bottom;
    if (held) {                               /* keep holding while you are still in that row */
      const b = held.track.getBoundingClientRect();
      if (!held.done && b.top < innerHeight && b.bottom > nav) return;
      release();
    }
    /* start holding only if what would be hidden is still below the screen, so nothing you see disappears */
    const want = holdRows.find(r => {
      if (r.done) return false;
      const b = r.track.getBoundingClientRect();
      if (!(b.top < innerHeight && b.bottom > nav)) return false;
      const first = r.after.find(el => el.offsetParent !== null);
      return !first || first.getBoundingClientRect().top >= innerHeight;
    });
    if (want) { want.after.forEach(el => el.classList.add('m-hold')); held = want; }
  }
  addEventListener('scroll', () => {
    if (jumping) { clearTimeout(jumpT); jumpT = setTimeout(() => { jumping = false; hold(); }, 250); return; }
    hold();
  }, { passive: true });
  /* Links within the page (project list, Index button, Next project): show everything, go there, then resume */
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    jumping = true; release();
    clearTimeout(jumpT); jumpT = setTimeout(() => { jumping = false; hold(); }, 1500);
  }, true);

  /* About page: the rest of the page waits until you have reached chapter 06 */
  const story = document.querySelector('.story');
  if (story) {
    const row = makeRow(story, story.querySelector('.story-text'), [...story.querySelectorAll('.chapter')],
      (p, i) => `<b>${String(i + 1).padStart(2, '0')}</b>`, true, () => hold());
    row.after = [];
    for (let el = story.nextElementSibling; el; el = el.nextElementSibling) row.after.push(el);
    rows.push(row); holdRows.push(row);
  }

  const sizeAll = () => rows.forEach(size);
  addEventListener('resize', sizeAll);
  addEventListener('load', sizeAll);
  document.querySelectorAll('.m-panel img').forEach(im => im.addEventListener('load', sizeAll, { once: true }));
  sizeAll();
  hold();
})();
