/* Phones only: each project's Use, Form, Function and Build sit side by side.
   Swipe left and right to move between them. Scrolling down to the end of a
   section flicks to the next one; scrolling up past the start of a section
   flicks back to the previous one. After Build the page carries on as normal. */
(() => {
  if (innerWidth >= 900) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const css = `
  .pstory.m-row .pstory-text { display: flex; gap: 14px; overflow-x: auto; overflow-y: hidden;
    scroll-snap-type: x mandatory; scrollbar-width: none; align-items: flex-start;
    padding: 0 0 8px; margin-inline: -16px; padding-inline: 16px; scroll-padding-inline: 16px;
    transition: height 0.45s cubic-bezier(.2,.7,.2,1); overscroll-behavior-x: contain; }
  .pstory.m-row .pstory-text::-webkit-scrollbar { display: none; }
  .pstory.m-row .pch { flex: 0 0 88%; scroll-snap-align: start; scroll-snap-stop: always; padding-block: 8px 20px; }
  .pstory.m-row .pch-figs.mrow { overflow: visible; display: flex; gap: 8px; }
  .pstory.m-row .pch-figs.mrow .pch-fig { flex: var(--ar) 1 0; min-width: 0; }
  .pstory.m-row .pch-figs.mrow .pch-fig div { height: auto; width: 100%; aspect-ratio: var(--ar); }
  .m-tabs { position: sticky; z-index: 5; display: flex; gap: 6px; padding: 10px 0 12px;
    background: var(--ground, #F2F0EB); }
  .m-tabs button { flex: 1; font: inherit; font-size: 10px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase;
    color: var(--caption, #8A877D); background: none; border: 0; border-top: 2px solid var(--rule, #B8B4AC);
    padding: 8px 0 0; text-align: left; cursor: pointer; transition: color .3s, border-color .3s; }
  .m-tabs button.on { color: var(--ink, #1F1E1B); border-top-color: var(--ink, #1F1E1B); }
  .m-tabs button b { color: var(--signal-ink, #B44614); font-weight: 500; margin-right: 4px; }
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const navH = () => {
    const r = document.querySelector('.nav').getBoundingClientRect();
    return Math.max(0, r.bottom);
  };

  const rows = [...document.querySelectorAll('.pstory')].map(story => {
    story.classList.add('m-row');
    const track = story.querySelector('.pstory-text');
    const panels = [...track.querySelectorAll('.pch')];
    const tabs = document.createElement('div');
    tabs.className = 'm-tabs';
    tabs.innerHTML = panels.map((p, i) => {
      const tag = p.querySelector('.uffb-head .label b')?.textContent || '';
      const name = p.querySelector('h3')?.textContent || '';
      return `<button type="button" data-i="${i}"${i === 0 ? ' class="on"' : ''}><b>${tag.slice(-1)}</b>${name}</button>`;
    }).join('');
    track.parentElement.insertBefore(tabs, track);
    const row = { story, track, panels, tabs: [...tabs.children], tabsEl: tabs, cur: 0, lock: 0 };
    row.tabs.forEach(b => b.addEventListener('click', () => go(row, +b.dataset.i, 'top')));
    track.addEventListener('scroll', () => {
      clearTimeout(row.t);
      row.t = setTimeout(() => {           // after a swipe settles, follow it
        const i = Math.round(track.scrollLeft / (panels[1] ? panels[1].offsetLeft - panels[0].offsetLeft : 1));
        if (i !== row.cur) setActive(row, Math.max(0, Math.min(panels.length - 1, i)), true);
      }, 90);
    }, { passive: true });
    return row;
  });

  function size(row) {
    row.track.style.height = row.panels[row.cur].offsetHeight + 8 + 'px';
    row.tabsEl.style.top = navH() + 'px';
  }
  function setActive(row, i, fromSwipe) {
    row.cur = i;
    row.tabs.forEach((b, k) => b.classList.toggle('on', k === i));
    size(row);
    if (fromSwipe) {                          // bring the start of the new section into view if needed
      const top = row.track.getBoundingClientRect().top;
      if (top < navH()) scrollTo({ top: scrollY + top - navH() - row.tabsEl.offsetHeight, behavior: reduce ? 'auto' : 'smooth' });
    }
  }
  function go(row, i, where) {
    if (i < 0 || i >= row.panels.length) return;
    row.lock = performance.now() + 750;
    row.track.scrollTo({ left: row.panels[i].offsetLeft - row.panels[0].offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    setActive(row, i, false);
    const top = row.track.getBoundingClientRect().top + scrollY - navH() - row.tabsEl.offsetHeight;
    if (where === 'top') scrollTo({ top, behavior: 'instant' });
    else {                                    // going back: land at the end of the previous section
      const h = row.panels[i].offsetHeight;
      scrollTo({ top: Math.max(top, top + h - innerHeight * 0.7), behavior: 'instant' });
    }
  }

  /* Scroll down past the end of a section: next one. Scroll up past its start: previous one. */
  let lastY = scrollY;
  addEventListener('scroll', () => {
    const y = scrollY, down = y > lastY; lastY = y;
    const now = performance.now();
    const nh = navH();
    for (const row of rows) {
      row.tabsEl.style.top = nh + 'px';
      if (now < row.lock) continue;
      const r = row.track.getBoundingClientRect();
      if (r.top > innerHeight || r.bottom < 0) continue;
      const end = r.top + row.panels[row.cur].offsetHeight;
      if (down && row.cur < row.panels.length - 1 && end < innerHeight * 0.72) { go(row, row.cur + 1, 'top'); break; }
      if (!down && row.cur > 0 && r.top > navH() + row.tabsEl.offsetHeight + innerHeight * 0.18) { go(row, row.cur - 1, 'end'); break; }
    }
  }, { passive: true });

  const sizeAll = () => rows.forEach(size);
  addEventListener('resize', sizeAll);
  addEventListener('load', sizeAll);
  document.querySelectorAll('.pstory img').forEach(im => im.addEventListener('load', sizeAll, { once: true }));
  sizeAll();
})();
