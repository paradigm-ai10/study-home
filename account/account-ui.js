/* 帳號的畫面：右上角的登入入口、帳號選單、登入框。邏輯都在 account.js（window.PD_ACCOUNT），這支只畫畫面。
   功能沒開（PD_ACCOUNT.status 是 'off'）的時候什麼都不做：不加元素、不連網路、不載字型。
   對外：PD_ACCOUNT_UI.open(原因?) 開登入框，原因是框裡多顯示的一句話。 */
(function () {
  'use strict';
  if (window.PD_ACCOUNT_UI) return;

  var GSI = 'https://accounts.google.com/gsi/client?hl=zh-TW';
  var FONTS = 'https://fonts.googleapis.com/css2?family=Huninn&family=LXGW+WenKai+TC&family=Outfit:wght@500;600&display=swap';
  var MSG = {
    closed: '登入功能還沒開放，敬請期待',
    auth: '登入沒有成功，再試一次',
    net: '暫時連不上，等一下再試',
    google: '連不上 Google，等一下再試',
    none: '登入功能還沒接上'
  };
  var here = document.currentScript && document.currentScript.src;
  var PRIVACY = 'index.html';
  try { if (here) PRIVACY = new URL('index.html', here).href; } catch (e) { /* 用相對路徑 */ }
  var host = '';
  try { host = window.location.hostname; } catch (e) { /* 當一般網址 */ }
  var LOCAL = host === 'localhost' || host === '127.0.0.1';
  var REDUCED = false;
  try { REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* 照常 */ }
  var POPOVER = typeof HTMLElement !== 'undefined' && HTMLElement.prototype.hasOwnProperty('popover');

  var A = null, root = null, btn = null, menu = null, toast = null, dlg = null, opener = null, toastTimer = 0;

  var UI = { open: function (reason) { if (!A || A.status !== 'guest') return false; openDialog(reason); return true; } };
  window.PD_ACCOUNT_UI = UI;

  /* ---------------------------------------------------------------- 小工具 */
  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function svg(markup) { var s = el('span', 'pd-acct-ico'); s.setAttribute('aria-hidden', 'true'); s.innerHTML = markup; return s; }
  var COIN = '<svg viewBox="0 0 20 20" width="20" height="20"><circle cx="10" cy="10" r="8.5" fill="#FFC857" stroke="#C9942A" stroke-width="1.5"/><circle cx="10" cy="10" r="5" fill="none" stroke="#C9942A" stroke-width="1.2"/></svg>';
  var CHEV = '<svg viewBox="0 0 12 12" width="12" height="12"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  function errText(code) { return code === 'closed' ? MSG.closed : (code === 'auth' || code === 'bad') ? MSG.auth : MSG.net; }
  function firstChar(name) { var s = String(name || '').trim(); return s ? Array.from(s)[0] : '?'; }
  // 頭像：Google 給的網址載不到就換成名字的第一個字
  function avatar(me, cls) {
    var box = el('span', 'pd-acct-av ' + cls);
    box.setAttribute('aria-hidden', 'true');
    var pic = me && typeof me.picture === 'string' && /^https:\/\//.test(me.picture) ? me.picture : '';
    if (pic) {
      var img = el('img');
      img.alt = ''; img.referrerPolicy = 'no-referrer'; img.decoding = 'async'; img.src = pic;
      img.onerror = function () { box.textContent = firstChar(me.name); };
      box.appendChild(img);
    } else box.textContent = firstChar(me && me.name);
    return box;
  }

  // 粉圓、霞鶩文楷、Outfit 換個名字載進來：頁面自己的字型只切了它用到的字，名字和這裡的字會缺
  // 開登入框或已經登入才載：沒碰登入的訪客不會連到 Google
  var fontsAsked = false;
  function loadFonts() {
    if (fontsAsked) return;
    fontsAsked = true;
    try {
      window.fetch(FONTS).then(function (r) { return r.ok ? r.text() : ''; }).then(function (css) {
        if (!css) return;
        css = css.replace(/font-family:\s*'Huninn'/g, "font-family: 'PD Huninn'")
          .replace(/font-family:\s*'LXGW WenKai TC'/g, "font-family: 'PD WenKai'")
          .replace(/font-family:\s*'Outfit'/g, "font-family: 'PD Outfit'");
        var st = el('style'); st.setAttribute('data-pd-acct', ''); st.textContent = css;
        document.head.appendChild(st);
      }, function () { /* 載不到就用頁面的字型 */ });
    } catch (e) { /* 同上 */ }
  }

  /* ---------------------------------------------------------------- 入口 */
  function mount() {
    if (root || !A || A.status === 'off' || !document.body) return;
    root = el('div', 'pd-acct');
    var bar = document.querySelector('.top .right') || document.querySelector('.top nav');
    if (bar) {
      // 插在最前面：右邊原本的按鈕位置不動
      root.classList.add(document.querySelector('.top .right') === bar ? 'pd-acct--dark' : 'pd-acct--line');
      bar.insertBefore(root, bar.firstChild);
    } else {
      root.classList.add('pd-acct--float');
      document.body.appendChild(root);
    }
    btn = el('button', 'pd-acct-btn'); btn.type = 'button';
    btn.addEventListener('click', function () {
      if (A.status === 'in') { if (isMenuOpen()) closeMenu(true); else openMenu(); } else openDialog();
    });
    toast = el('p', 'pd-acct-toast'); toast.setAttribute('role', 'status'); toast.setAttribute('aria-live', 'polite');
    root.appendChild(btn); root.appendChild(toast);
    render();
    window.addEventListener('pd-account', render);
  }

  function render() {
    if (!root) return;
    var inNow = A.status === 'in' && A.me;
    btn.textContent = '';
    var chip = el('span', 'pd-acct-chip');
    if (inNow) {
      loadFonts();
      chip.classList.add('is-in');
      chip.appendChild(avatar(A.me, 'is-s'));
      chip.appendChild(el('span', 'pd-acct-name', A.me.name || ''));
      chip.appendChild(svg(CHEV));
      btn.setAttribute('aria-label', '帳號：' + (A.me.name || ''));
      btn.setAttribute('aria-expanded', isMenuOpen() ? 'true' : 'false');
      btn.setAttribute('aria-controls', 'pd-acct-menu');
    } else {
      chip.textContent = '登入';
      btn.removeAttribute('aria-label'); btn.removeAttribute('aria-expanded'); btn.removeAttribute('aria-controls');
      // 刪除、登出、登入過期時選單會被關掉：焦點原本在選單裡（或因按鈕停用掉到 body）就還給入口
      if (isMenuOpen()) {
        var f = document.activeElement;
        closeMenu(!f || f === document.body || menu.contains(f));
      }
    }
    btn.appendChild(chip);
    if (inNow && isMenuOpen()) fillMenu();
  }

  function say(text) {
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(function () { toast.classList.remove('is-on'); toastTimer = window.setTimeout(function () { toast.textContent = ''; }, 400); }, 5000);
  }

  /* ---------------------------------------------------------------- 帳號選單 */
  function isMenuOpen() { return !!menu && menu.classList.contains('is-open'); }
  function makeMenu() {
    menu = el('div', 'pd-acct-menu');
    menu.id = 'pd-acct-menu';
    if (POPOVER) menu.setAttribute('popover', 'manual'); else menu.hidden = true;
    root.insertBefore(menu, toast);
  }
  function row(tag, text, cls, fn) {
    var n = el(tag, 'pd-acct-row' + (cls ? ' ' + cls : ''), text);
    if (tag === 'button') n.type = 'button';
    if (fn) n.addEventListener('click', fn);
    return n;
  }
  function fillMenu() {
    menu.textContent = '';
    var me = A.me || {};
    var head = el('div', 'pd-acct-who');
    head.appendChild(avatar(me, 'is-l'));
    head.appendChild(el('p', 'pd-acct-who-name', me.name || ''));
    menu.appendChild(head);
    if (A.coins) {
      var c = el('p', 'pd-acct-coins');
      c.appendChild(svg(COIN));
      c.appendChild(el('span', null, '代幣'));
      if (A.coins.balance === null) c.appendChild(el('b', 'is-word', '無限（團隊帳號）'));
      else c.appendChild(el('b', null, String(A.coins.balance)));
      menu.appendChild(c);
    }
    var list = el('div', 'pd-acct-rows');
    list.appendChild(row('button', '登出', '', signOut));
    list.appendChild(row('button', '刪除我的資料', 'is-danger', askDelete));
    var a = row('a', '隱私說明'); a.href = PRIVACY;
    list.appendChild(a);
    menu.appendChild(list);
  }
  function askDelete() {
    menu.textContent = '';
    var box = el('div', 'pd-acct-ask');
    var h = el('p', 'pd-acct-ask-h', '刪除我的資料'); h.id = 'pd-acct-ask-h';
    box.setAttribute('role', 'group'); box.setAttribute('aria-labelledby', 'pd-acct-ask-h');
    box.appendChild(h);
    box.appendChild(el('p', null, '刪除之後不能復原。伺服器上這個帳號的完成的課、代幣、擺飾，連同你的名字、email 和頭像，會全部刪掉。'));
    box.appendChild(el('p', 'pd-acct-ask-small', '這台裝置上的學習進度也會一起清掉。'));
    var msg = el('p', 'pd-acct-msg'); msg.setAttribute('role', 'status'); msg.setAttribute('aria-live', 'polite');
    var acts = el('div', 'pd-acct-acts');
    var yes = el('button', 'pd-acct-go is-danger', '確定刪除'); yes.type = 'button';
    var no = el('button', 'pd-acct-go is-alt', '先不要'); no.type = 'button';
    no.addEventListener('click', function () { fillMenu(); focusFirst(); });
    yes.addEventListener('click', function () {
      yes.disabled = no.disabled = true; msg.textContent = '正在刪除…';
      A.deleteMe().then(function (r) {
        if (r && r.ok) { closeMenu(false); btn.focus(); say('已經刪除你的資料'); return; }
        if (A.status !== 'in') { closeMenu(false); btn.focus(); say('登入已經過期，請重新登入'); return; }
        yes.disabled = no.disabled = false; msg.textContent = errText(r && r.error);
      });
    });
    acts.appendChild(yes); acts.appendChild(no);
    box.appendChild(acts); box.appendChild(msg);
    menu.appendChild(box);
    no.focus();
  }
  function focusFirst() { var f = menu.querySelector('button, a'); if (f) f.focus(); }
  // 選單貼在入口正下方、靠右對齊；放不下就往左推，不超出畫面
  function place() {
    if (!POPOVER || !isMenuOpen()) return;
    var r = btn.getBoundingClientRect(), vw = document.documentElement.clientWidth, w = menu.offsetWidth;
    var left = Math.min(r.right, vw - 12) - w;
    menu.style.top = Math.round(r.bottom + 6) + 'px';
    menu.style.left = Math.round(Math.max(12, left)) + 'px';
  }
  function openMenu() {
    if (!menu) makeMenu();
    fillMenu();
    menu.classList.add('is-open');
    if (POPOVER) { try { menu.showPopover(); } catch (e) { /* 已經開著 */ } place(); } else menu.hidden = false;
    btn.setAttribute('aria-expanded', 'true');
    document.addEventListener('pointerdown', outside, true);
    window.addEventListener('blur', blurClose);   // 點到 iframe（地圖頁）時本頁收不到 pointerdown，但會失去焦點
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    focusFirst();
  }
  function closeMenu(refocus) {
    if (!isMenuOpen()) return;
    menu.classList.remove('is-open');
    if (POPOVER) { try { menu.hidePopover(); } catch (e) { /* 已經關了 */ } } else menu.hidden = true;
    if (btn) btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('pointerdown', outside, true);
    window.removeEventListener('blur', blurClose);
    window.removeEventListener('resize', place);
    window.removeEventListener('scroll', place, true);
    if (refocus && btn) btn.focus();
  }
  function outside(e) { if (!root.contains(e.target)) closeMenu(false); }
  function blurClose() { closeMenu(false); }
  // 焦點離開入口和選單（Tab 出去）就收起來
  function watchFocus() {
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && isMenuOpen()) { e.preventDefault(); e.stopPropagation(); closeMenu(true); } });
    root.addEventListener('focusout', function (e) {
      if (isMenuOpen() && e.relatedTarget && !root.contains(e.relatedTarget)) closeMenu(false);
    });
  }

  function signOut() {
    closeMenu(true);
    try { if (window.google && window.google.accounts && window.google.accounts.id) window.google.accounts.id.disableAutoSelect(); } catch (e) { /* 沒差 */ }
    A.signOut().then(function () { say('已經登出'); });
  }

  /* ---------------------------------------------------------------- 登入框 */
  var gsiWait = [], gsiLoading = false, gsiReady = false;
  function hasGsi() { return !!(window.google && window.google.accounts && window.google.accounts.id); }
  // 按了登入才去載 Google 的程式；6 秒沒好當作連不上
  function loadGsi(cb) {
    if (hasGsi()) { cb(true); return; }
    gsiWait.push(cb);
    if (gsiLoading) return;
    gsiLoading = true;
    var s = el('script'), over = false;
    function done(ok) {
      if (over) return; over = true; gsiLoading = false;
      window.clearTimeout(t);
      if (!ok && !hasGsi() && s.parentNode) s.parentNode.removeChild(s);   // 下次開框重新載
      var w = gsiWait; gsiWait = [];
      w.forEach(function (f) { f(ok); });
    }
    var t = window.setTimeout(function () { done(false); }, 6000);
    s.src = GSI; s.async = true;
    s.onload = function () { done(hasGsi()); };
    s.onerror = function () { done(false); };
    document.head.appendChild(s);
  }

  var D = {};   // 登入框裡會換內容的幾個地方
  function makeDialog() {
    dlg = el('dialog', 'pd-acct-dlg');
    dlg.setAttribute('aria-labelledby', 'pd-acct-dlg-h');
    var card = el('div', 'pd-acct-card');
    var x = el('button', 'pd-acct-x'); x.type = 'button'; x.setAttribute('aria-label', '關閉'); x.textContent = '×';
    x.addEventListener('click', closeDialog);
    var h = el('h2', 'pd-acct-h', '登入 Paradigm 學 AI'); h.id = 'pd-acct-dlg-h';
    D.reason = el('p', 'pd-acct-reason');
    D.lead = el('p', 'pd-acct-lead', '登入後，完成的課、代幣和書桌上的擺飾會存在你的帳號裡，換一台裝置也看得到。');
    D.slot = el('div', 'pd-acct-gbtn');
    D.msg = el('p', 'pd-acct-msg'); D.msg.setAttribute('role', 'status'); D.msg.setAttribute('aria-live', 'polite');
    var fine = el('p', 'pd-acct-fine');
    fine.appendChild(document.createTextNode('會存你的名字、email、頭像和學習進度，不寄信、不給別人。'));
    var a = el('a', null, '隱私說明'); a.href = PRIVACY;
    fine.appendChild(a);
    card.appendChild(x); card.appendChild(h); card.appendChild(D.reason); card.appendChild(D.lead);
    card.appendChild(D.slot); card.appendChild(D.msg);
    if (LOCAL) card.appendChild(devRow());
    card.appendChild(fine);
    dlg.appendChild(card);
    // 點框外面（背景）就關
    dlg.addEventListener('click', function (e) { if (e.target === dlg) closeDialog(); });
    dlg.addEventListener('close', afterClose);
    // Esc 只關這個框，不要傳到頁面（地圖頁按 Esc 會回首頁）
    dlg.addEventListener('keydown', function (e) { if (e.key === 'Escape') e.stopPropagation(); });
    document.body.appendChild(dlg);
  }
  // 只在 localhost 出現：不連 Google，用 Worker 的 DEV_LOGIN 假登入
  function devRow() {
    var f = el('form', 'pd-acct-dev');
    var lab = el('label', null, '本機測試用假登入（名字打 team 是團隊帳號）');
    lab.htmlFor = 'pd-acct-dev-name';
    var inp = el('input'); inp.id = 'pd-acct-dev-name'; inp.name = 'dev'; inp.required = true;
    inp.placeholder = '英數名字，例如 alice'; inp.pattern = '[A-Za-z0-9_\\-]+'; inp.autocomplete = 'off';
    var go = el('button', 'pd-acct-go is-alt', '假登入'); go.type = 'submit';
    var line = el('div', 'pd-acct-dev-line'); line.appendChild(inp); line.appendChild(go);
    f.appendChild(lab); f.appendChild(line);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      go.disabled = true;
      tryIn(A._devSignIn(inp.value.trim()), function () { go.disabled = false; });
    });
    return f;
  }
  function tryIn(p, always) {
    D.msg.textContent = '正在登入…'; D.msg.classList.remove('is-err');
    p.then(function (r) {
      if (always) always();
      if (r && r.ok) { closeDialog(); say('已經登入'); return; }
      D.msg.textContent = errText(r && r.error); D.msg.classList.add('is-err');
    });
  }
  function onCredential(resp) {
    if (!resp || typeof resp.credential !== 'string') { D.msg.textContent = MSG.auth; D.msg.classList.add('is-err'); return; }
    tryIn(A.signInWith(resp.credential));
  }
  function drawGoogle() {
    D.slot.textContent = '';
    var id = (window.PARADIGM_ACCOUNT && window.PARADIGM_ACCOUNT.clientId) || '';
    if (!id) { D.slot.appendChild(el('p', 'pd-acct-note', MSG.none)); return; }
    D.slot.appendChild(el('p', 'pd-acct-note', '正在連 Google…'));
    loadGsi(function (ok) {
      if (!dlg.open) return;
      D.slot.textContent = '';
      if (!ok) { D.slot.appendChild(el('p', 'pd-acct-note is-err', MSG.google)); return; }
      try {
        if (!gsiReady) {
          // 只用按鈕，不用 One Tap；use_fedcm_for_button：Chrome 上改走瀏覽器自己的登入視窗（Google 建議新網站打開）
          window.google.accounts.id.initialize({ client_id: id, callback: onCredential, ux_mode: 'popup', use_fedcm_for_button: true });
          gsiReady = true;
        }
        var w = Math.max(200, Math.min(320, Math.floor(D.slot.clientWidth || 280)));
        window.google.accounts.id.renderButton(D.slot, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with', shape: 'pill', logo_alignment: 'left', width: w, locale: 'zh_TW' });
      } catch (e) { D.slot.textContent = ''; D.slot.appendChild(el('p', 'pd-acct-note is-err', MSG.google)); }
    });
  }
  function openDialog(reason) {
    if (!A || A.status !== 'guest') return;
    if (!dlg) makeDialog();
    if (dlg.open) return;
    loadFonts();
    opener = document.activeElement;
    D.reason.textContent = reason ? String(reason) : '';
    D.reason.hidden = !reason;
    D.msg.textContent = ''; D.msg.classList.remove('is-err');
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    if (!REDUCED) { dlg.classList.remove('is-in'); void dlg.offsetWidth; dlg.classList.add('is-in'); }
    drawGoogle();
  }
  function closeDialog() {
    if (!dlg || !dlg.open) return;
    if (typeof dlg.close === 'function') dlg.close(); else { dlg.removeAttribute('open'); afterClose(); }
  }
  function afterClose() {
    var back = A.status === 'in' ? btn : opener;
    opener = null;
    if (back && back.isConnected && typeof back.focus === 'function') back.focus();
    else if (btn) btn.focus();
  }

  /* ---------------------------------------------------------------- 開始：PD_ACCOUNT 可能比這支晚到 */
  function start() {
    A = window.PD_ACCOUNT || null;
    if (!A || A.status === 'off') return false;
    try { mount(); if (root) watchFocus(); } catch (e) { /* 畫面出錯也不能弄壞頁面 */ }
    return true;
  }
  if (!start()) {
    window.addEventListener('pd-account', function once() {
      if (start()) window.removeEventListener('pd-account', once);
    });
  }
})();
