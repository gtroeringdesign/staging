/* Phone-only scroll motion for the Projects and About pages:
   images wipe in, text eases up, project names stretch to full width. */
(() => {
  if (innerWidth >= 900 || matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('m-anim');
  const targets = document.querySelectorAll(
    '.pch-fig, .uffb-head, .uffb-body p, .proj-open, .chapter-fig, .chapter .label, .chapter p.t'
  );
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('m-in');
    io.unobserve(e.target);
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  targets.forEach(t => io.observe(t));
})();
