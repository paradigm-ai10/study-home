/* 帳號（網頁端的邏輯，不含畫面）：window.PD_ACCOUNT
   讓瀏覽器原本的進度（localStorage 的 pd-done、paradigm.f4 的 done.t1）跟帳號伺服器一致，現有的頁面不用改就能照常運作。
   最重要的一條：絕不能把頁面弄壞。localStorage 不能用、伺服器連不上、哪裡丟錯，頁面都要跟沒有這支程式時一樣。
   一般的 <script defer> 載入；之後才動態插進來也可以；不小心載兩次，第二次什麼都不做。 */
(function () {
  'use strict';
  if (window.PD_ACCOUNT) return;

  var OPEN_DEFAULT = false;          // 正式打開那天改成 true：沒設過開關的瀏覽器也看得到登入
  var TIMEOUT = 8000;
  var K = { on: 'paradigm.account.on', acct: 'paradigm.account', owner: 'paradigm.account.owner', pending: 'paradigm.account.pending', state: 'paradigm.account.state', done: 'pd-done', f4: 'paradigm.f4', decor: 'paradigm.decor' };
  // 認得的錯誤代碼；其他的（server、5xx、不是 JSON）一律當作連不上
  var KNOWN = ['auth', 'closed', 'origin', 'team', 'key', 'bad', 'nolesson', 'noitem', 'owned', 'poor', 'slot', 'big', 'busy'];
  var NET = { ok: false, error: 'net' };
  var noop = function () {};

  /* ---------------------------------------------------------------- 存取 localStorage（每一下都包起來） */
  function raw(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function get(k, dflt) { try { var v = JSON.parse(raw(k)); return v == null ? dflt : v; } catch (e) { return dflt; } }
  function putRaw(k, v) { try { window.localStorage.setItem(k, v); } catch (e) { /* 無痕或被擋 */ } }
  function put(k, v) { try { putRaw(k, JSON.stringify(v)); } catch (e) { /* 存不了就算了 */ } }
  function del(k) { try { window.localStorage.removeItem(k); } catch (e) { /* 無痕或被擋 */ } }

  function localDone() { var d = get(K.done, []); return Array.isArray(d) ? d.filter(function (x) { return typeof x === 'string'; }) : []; }
  function sameSet(a, b) { if (a.length !== b.length) return false; for (var i = 0; i < a.length; i++) if (b.indexOf(a[i]) < 0) return false; return true; }
  // pd-done 真的變了才寫，寫了就通知這一頁（storage 事件平常只會發給別的分頁）
  function writeDone(list) {
    var had = raw(K.done);
    if (list == null) { if (had == null) return; del(K.done); } else { if (sameSet(localDone(), list)) return; put(K.done, list); }
    var ev;
    try { ev = new window.StorageEvent('storage', { key: K.done }); } catch (e) { try { ev = new window.Event('storage'); ev.key = K.done; } catch (e2) { ev = null; } }
    try { if (ev) window.dispatchEvent(ev); } catch (e) { /* 監聽的人自己出錯，不關我們的事 */ }
  }
  function localT1() { var f = get(K.f4, null); return f && f.done && f.done.t1 > 0 ? f.done.t1 : 0; }
  // 只動 done.t1，paradigm.f4 其他欄位原樣留著；t1 是 0 ＝ 拿掉
  function writeT1(t1) {
    var f = get(K.f4, null);
    if (!f || typeof f !== 'object') { if (!t1) return; f = {}; }
    if (!f.done || typeof f.done !== 'object') f.done = {};
    if (t1) { if (f.done.t1 === t1) return; f.done.t1 = t1; } else { if (!('t1' in f.done)) return; delete f.done.t1; }
    put(K.f4, f);
  }

  // 待送清單：{k:'l', id, on} 或 {k:'t1'}；同一課只留最新的那一筆
  function pending() { var p = get(K.pending, []); return Array.isArray(p) ? p : []; }
  function same(a, b) { return a.k === b.k && (a.k !== 'l' || a.id === b.id); }
  function queue(it) { put(K.pending, pending().filter(function (x) { return !same(x, it); }).concat([it])); }
  function unqueue(it) { put(K.pending, pending().filter(function (x) { return !(same(x, it) && x.on === it.on); })); }

  /* ---------------------------------------------------------------- 跟伺服器講話：一次送一個、照順序、8 秒沒回當作斷線 */
  var cfg = window.PARADIGM_ACCOUNT || {};
  var host = '', search = '';
  try { host = window.location.hostname; search = window.location.search; } catch (e) { /* 拿不到就當一般網址 */ }
  var LOCAL = host === 'localhost' || host === '127.0.0.1';
  var Q = { get: function () { return null; } };
  try { Q = new window.URLSearchParams(search); } catch (e) { /* 舊瀏覽器 */ }
  var API = (LOCAL && Q.get('api')) || (typeof cfg.api === 'string' ? cfg.api : '');
  API = API.replace(/\/+$/, '');

  var chain = Promise.resolve();
  function call(method, path, body, tok) {
    var p = chain.then(function () { return send(method, path, body, tok); });
    chain = p.then(noop, noop);
    return p;
  }
  function send(method, path, body, tok) {
    return new Promise(function (done) {
      var over = false, ctrl = null, timer = null;
      function end(r) { if (over) return; over = true; try { window.clearTimeout(timer); } catch (e) { /* 沒差 */ } done(r); }
      try {
        try { ctrl = new window.AbortController(); } catch (e) { ctrl = null; }
        timer = window.setTimeout(function () { try { if (ctrl) ctrl.abort(); } catch (e) { /* 沒差 */ } end(NET); }, TIMEOUT);
        var headers = {};
        if (body) headers['Content-Type'] = 'application/json';
        if (tok) headers.Authorization = 'Bearer ' + tok;
        window.fetch(API + path, { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl ? ctrl.signal : undefined, credentials: 'omit' })
          .then(function (res) {
            return res.json().then(function (d) { return [res, d]; }, function () { return [res, null]; });
          })
          .then(function (rd) { end(read(rd[0], rd[1])); }, function () { end(NET); });
      } catch (e) { end(NET); }
    });
  }
  function read(res, d) {
    if (res && res.status === 401) return { ok: false, error: 'auth' };
    if (d && d.ok === true) return d;
    var code = d && d.error;
    return KNOWN.indexOf(code) >= 0 ? { ok: false, error: code } : NET;
  }

  /* ---------------------------------------------------------------- 登入與同步的規則（設計文件第 7 節） */
  var A = { status: 'off', me: null, coins: null, decor: null, ready: null };
  var token = null;

  function emit() {
    try { window.dispatchEvent(new window.CustomEvent('pd-account', { detail: { status: A.status } })); } catch (e) { /* 舊瀏覽器 */ }
  }
  function setIn(tok, me) { token = tok; A.status = 'in'; A.me = me; put(K.acct, { token: tok, me: me }); }
  function setGuest() { token = null; A.status = 'guest'; A.me = A.coins = A.decor = null; del(K.acct); del(K.state); }
  // 只換帳號的資料（名字、代幣、擺飾），不動進度
  function meta(st) {
    A.me = st.me; A.coins = st.coins; A.decor = st.decor;
    put(K.acct, { token: token, me: st.me }); put(K.state, { coins: st.coins, decor: st.decor });
  }
  // 以伺服器為準，但待送清單裡還沒送到的改動照樣算數（不然畫面會一閃一閃）。
  // claim：這一刻起這台的進度屬於這個人（/sync 成功、或換人）。還沒併過的（/sync 沒成功）只換帳號資料，不碰進度
  function apply(st, claim) {
    meta(st);
    if (!claim && get(K.owner, null) !== st.me.id) { emit(); return; }
    var list = Array.isArray(st.lessons) ? st.lessons.slice() : [], pend = pending(), t1Pending = false;
    pend.forEach(function (it) {
      if (it.k === 't1') { t1Pending = true; return; }
      var i = list.indexOf(it.id);
      if (it.on && i < 0) list.push(it.id); else if (!it.on && i >= 0) list.splice(i, 1);
    });
    writeDone(list);
    if (!t1Pending && st.t1 > 0) writeT1(st.t1);
    put(K.owner, st.me.id);
    emit();
  }
  // 登出、刪除帳號、換人：這台回到全新訪客的樣子（開關留著）
  function wipe() {
    writeDone(null); writeT1(0);
    [K.decor, K.owner, K.pending, K.state].forEach(del);
  }
  // 憑證過期或被拒：當作登出，但進度、owner、待送清單都不清
  function gone(tok) { if (token === tok) { setGuest(); emit(); } }

  function sendItem(it, tok) {
    if (it.k === 't1') return call('POST', '/flags/t1', null, tok);
    return call(it.on ? 'PUT' : 'DELETE', '/lessons/' + encodeURIComponent(it.id), null, tok);
  }
  // 送一筆待送的：成功就拿掉；斷線或忙就留著；其他錯（例如課下架了）送再多次也一樣，拿掉
  function push(it, tok) {
    return sendItem(it, tok).then(function (r) {
      if (token !== tok) return r;                          // 已經登出或換人了，回應不算數
      if (r.error === 'auth') gone(tok);
      else if (r.ok || (r.error !== 'net' && r.error !== 'busy')) unqueue(it);
      return r;
    });
  }
  function flush(tok) {
    var list = pending(), last = null, i = 0;
    function next() {
      if (i >= list.length || token !== tok) return { ok: true, state: last };
      return push(list[i++], tok).then(function (r) {
        if (r.ok) { last = r.state; return next(); }
        if (r.error === 'auth' || r.error === 'net' || r.error === 'busy') return r;
        return next();
      });
    }
    return Promise.resolve().then(next);
  }

  // 登入中（剛登入、或開頁面時本來就登入著）把這台跟伺服器對齊。st：剛登入拿到的 state；開頁面時是 null
  function settle(st) {
    var tok = token, id = A.me && A.me.id, owner = get(K.owner, null);
    var alive = function () { return token === tok; };
    if (owner == null) {                                    // 這台的進度還不屬於任何人：併上去
      return call('POST', '/sync', { lessons: localDone(), t1: localT1() }, tok).then(function (r) {
        if (!alive()) return;
        // 待送清單不清：/sync 送出之後才排進來的、或 /sync 表達不了的「取消完成」，都要照常補送（重送幾次結果都一樣）
        if (r.ok) { apply(r.state, true); return flush(tok).then(function (f) { if (alive() && f.ok && f.state) apply(f.state); }); }
        if (r.error === 'auth') gone(tok); else if (st) { meta(st); emit(); }
      });
    }
    if (owner !== id) {                                     // 是別人的：不併、不送他的待送清單，換成這個人的
      var swap = function (s) { wipe(); apply(s, true); };
      if (st) { swap(st); return Promise.resolve(); }
      return call('GET', '/me', null, tok).then(function (r) { if (!alive()) return; if (r.ok) swap(r.state); else if (r.error === 'auth') gone(tok); });
    }
    return flush(tok).then(function (f) {                   // 同一個人：先補送，再以伺服器為準
      if (!alive()) return;
      if (!f.ok) { if (st) apply(st); return; }
      if (f.state || st) { apply(f.state || st); return; }
      return call('GET', '/me', null, tok).then(function (r) { if (!alive()) return; if (r.ok) apply(r.state); else if (r.error === 'auth') gone(tok); });
    });
  }

  function signIn(body) {
    if (A.status === 'off') return Promise.resolve({ ok: false, error: 'off' });
    return call('POST', '/auth/google', body, null).then(function (r) {
      if (!r.ok) return { ok: false, error: r.error };
      if (typeof r.token !== 'string' || !r.state || !r.state.me) return NET;
      setIn(r.token, r.state.me);
      return settle(r.state).then(function () { return { ok: true }; });
    });
  }
  // 兌換、擺放這類要伺服器說了算的：不進待送清單，連不上就是失敗
  function action(method, path, body) {
    if (A.status !== 'in') return Promise.resolve({ ok: false, error: A.status === 'off' ? 'off' : 'auth' });
    var tok = token;
    return call(method, path, body, tok).then(function (r) {
      if (token !== tok) return { ok: false, error: 'auth' };
      if (r.ok) { apply(r.state); return { ok: true }; }
      if (r.error === 'auth') gone(tok);
      return { ok: false, error: r.error };
    });
  }
  // 按完成：登入中就送；沒登入但這台的進度屬於某人（登入過期）就先記著，重新登入後補送
  function mark(it) {
    if (A.status === 'off') return Promise.resolve({ ok: false, error: 'off' });
    if (A.status !== 'in') { if (get(K.owner, null) != null) queue(it); return Promise.resolve({ ok: false, error: 'auth' }); }
    var tok = token;
    queue(it);
    return push(it, tok).then(function (r) {
      if (r.ok && token === tok) apply(r.state);
      return r.ok ? { ok: true } : { ok: false, error: r.error };
    });
  }
  function leave() { wipe(); setGuest(); emit(); }

  /* ---------------------------------------------------------------- 對外 */
  var safe = function (fn) {
    return function () {
      try { return fn.apply(null, arguments).then(null, function () { return NET; }); } catch (e) { return Promise.resolve(NET); }
    };
  };
  A.signInWith = safe(function (credential) { return signIn({ credential: credential }); });
  A._devSignIn = safe(function (name) { return LOCAL ? signIn({ dev: name }) : Promise.resolve({ ok: false, error: 'off' }); });
  A.signOut = safe(function () {
    if (A.status === 'off') return Promise.resolve({ ok: true });
    var tok = token;
    leave();
    return tok ? call('POST', '/logout', {}, tok).then(function () { return { ok: true }; }) : Promise.resolve({ ok: true });
  });
  A.deleteMe = safe(function () {
    if (A.status !== 'in') return Promise.resolve({ ok: false, error: A.status === 'off' ? 'off' : 'auth' });
    var tok = token;
    return call('DELETE', '/me', null, tok).then(function (r) {
      if (token !== tok) return { ok: false, error: 'auth' };
      if (r.ok) { leave(); return { ok: true }; }
      if (r.error === 'auth') gone(tok);
      return { ok: false, error: r.error };
    });
  });
  A.lessonDone = safe(function (id, on) { return mark({ k: 'l', id: String(id), on: !!on }); });
  A.firstTaskDone = safe(function () { return mark({ k: 't1' }); });
  A.redeem = safe(function (item) { return action('POST', '/decor/redeem', { item: item }); });
  A.savePlaced = safe(function (placed, seen) { return action('PUT', '/decor/placed', { placed: placed, seen: seen }); });
  A.resetDecor = safe(function () { return action('POST', '/decor/reset', {}); });
  window.PD_ACCOUNT = A;

  // 開頁面：先看開關（?account=on／off 記在這台），再看有沒有登入著
  A.ready = Promise.resolve();
  try {
    var flag = Q.get('account');
    if (flag === 'on') putRaw(K.on, '1'); else if (flag === 'off') putRaw(K.on, '0');
    var saved = flag === 'on' ? '1' : flag === 'off' ? '0' : raw(K.on);
    var open = saved === '1' || (saved !== '0' && OPEN_DEFAULT);
    if (open && API) {
      var acct = get(K.acct, null), last = get(K.state, null);
      if (acct && typeof acct.token === 'string' && acct.me && acct.me.id) {
        setIn(acct.token, acct.me);
        if (last) { A.coins = last.coins || null; A.decor = last.decor || null; }
        A.ready = settle(null).then(noop, noop);
      } else A.status = 'guest';
    }
    emit();
  } catch (e) { A.status = 'off'; token = null; A.me = A.coins = A.decor = null; }
})();
