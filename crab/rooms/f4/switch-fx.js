/* The switch between the two versions plays its move (switch-fx.css) only when you pressed a switch link:
   app.js leaves a note in sessionStorage on that click. Anything else (the stored-choice redirect, back, a link
   from elsewhere) changes page with no show. Loaded in <head>, not deferred, so it is listening before the first frame. */
(function () {
  var NOTE = 'paradigm.f4.switching';
  /* Arriving at the 3D desk after "the crab packs up" (pack-fx.js): known here, before the first paint, so the picture can start as
     the empty desk the plain page ended on and the words can wait for the unpacking (switch-fx.css, study.js, pack-land.js).
     If the live desk has not taken over within a few seconds, everything goes back to the ordinary first screen. */
  try {
    var n0 = JSON.parse(sessionStorage.getItem(NOTE) || 'null'), root = document.documentElement;
    if (n0 && n0.pack && !n0.skip && n0.to === '3d' && root.dataset.view !== 'simple' && Date.now() - n0.at < 8000 && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      root.dataset.arrive = 'pack'; window.__f4Arrive = { pack: true, short: !!n0.short };
      setTimeout(function () { if (!window.__f4Landing) delete root.dataset.arrive; }, 4500);
    }
    // the same on the way back: the plain page starts with its things still in the crab's bundle (pack-boot.js → pack-fx.js playBack)
    if (n0 && n0.pack && n0.to === 'simple' && root.dataset.view === 'simple' && Date.now() - n0.at < 8000 && !(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches)) {
      root.dataset.arrive = 'unpack';
      setTimeout(function () { if (!window.__packBack) delete root.dataset.arrive; }, 2600);
    }
    if (n0 && !('onpagereveal' in window)) sessionStorage.removeItem(NOTE);   // no view transitions here (nothing below will read the note): it must not replay on a reload
  } catch (x) { /* then it is an ordinary arrival */ }
  window.addEventListener('pagereveal', function (e) {
    var vt = e.viewTransition; if (!vt) { document.documentElement.dataset.fx = 'none'; try { sessionStorage.removeItem(NOTE); } catch (x) {} return; }
    if (vt.ready && vt.ready.catch) vt.ready.catch(function () {});   // skipping below rejects this; nobody is waiting on it
    var note = null;
    try { note = JSON.parse(sessionStorage.getItem(NOTE) || 'null'); sessionStorage.removeItem(NOTE); } catch (x) { note = null; }
    var simple = document.documentElement.dataset.view === 'simple';
    if (!note || note.to !== (simple ? 'simple' : '3d') || Date.now() - note.at > 8000) { vt.skipTransition(); document.documentElement.dataset.fx = 'skipped'; return; }
    if (note.pack) { document.documentElement.dataset.fx = 'pack'; return; }   // the crab packed the plain page up and the desk is already showing (pack-fx.js): a short cross-fade, see switch-fx.css
    // where the cream page rushes past / comes back from: the little desk photo on the plain page
    var x = note.ox, y = note.oy;
    if (simple) {
      var img = document.getElementById('desk-photo');
      if (img) { var r = img.getBoundingClientRect(); x = (r.left + r.width / 2) / innerWidth * 100; y = (r.top + r.height / 2) / innerHeight * 100; }
    }
    document.documentElement.dataset.fx = 'played';   // for checking only
    if (x != null && y != null) {
      var s = document.documentElement.style;
      s.setProperty('--f4-ox', x.toFixed(1) + '%'); s.setProperty('--f4-oy', y.toFixed(1) + '%');
      vt.finished.then(function () { s.removeProperty('--f4-ox'); s.removeProperty('--f4-oy'); });
    }
  });
})();
