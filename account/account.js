/* 帳號（網頁端的邏輯，不含畫面）：window.PD_ACCOUNT
   各頁照舊直接寫 localStorage（pd-done、pd-quiz、pd-chapters、pd-awards、pd-visits、pd-time、paradigm.f4 的 done.t1、paradigm.decor 的 paid），
   這支像照鏡子：定時把那幾份跟帳號伺服器取聯集、兩邊補齊（設計文件第 13 節）。
   最重要的一條：絕不能把頁面弄壞、絕不能把一個帳號的進度搬進另一個帳號、伺服器一時出錯也不能把畫面上的東西清掉。
   一般的 <script defer> 載入；之後才動態插進來也可以；不小心載兩次，第二次什麼都不做。 */
(function () {
  'use strict';
  if (window.PD_ACCOUNT) return;

  var OPEN_DEFAULT = false;          // 正式打開那天改成 true：沒設過開關的瀏覽器也看得到登入
  var TIMEOUT = 8000, EVERY = 60000, LATER = 2000, HOUR = 3600000, TODAY_EVERY = 300000;
  // 一包最多這麼多；伺服器的上限是 300、400、16 KB，連續獎勵一次只處理 20 筆
  var LIM = { earned: 150, paid: 150, days: 200, streak: 20, chars: 12000, memo: 300 };
  var K = { on: 'paradigm.account.on', acct: 'paradigm.account', owner: 'paradigm.account.owner', pending: 'paradigm.account.pending',
    state: 'paradigm.account.state', base: 'paradigm.account.base' };
  var M = { done: 'pd-done', quiz: 'pd-quiz', ch: 'pd-chapters', aw: 'pd-awards', vis: 'pd-visits', time: 'pd-time', f4: 'paradigm.f4', decor: 'paradigm.decor' };
  var MIRROR = [M.done, M.quiz, M.ch, M.aw, M.vis, M.time, M.f4, M.decor];
  // 認得的錯誤代碼；其他的（server、5xx、不是 JSON）一律當作連不上
  var KNOWN = ['auth', 'closed', 'origin', 'team', 'key', 'bad', 'nolesson', 'noitem', 'owned', 'poor', 'slot', 'big', 'busy'];
  var NET = { ok: false, error: 'net' };
  var DAY = /^\d{4}-\d\d-\d\d$/, ID = /^[^:@\s]+$/;
  var noop = function () {};
  var now = function () { return Date.now(); };
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  // 今天（跟各頁寫 pd-visits、pd-time 一樣用本地時間）
  function today() { var d = new Date(now()); return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /* ---------------------------------------------------------------- 存取 localStorage（每一下都包起來；寫不進去回 false） */
  function raw(k) { try { return window.localStorage.getItem(k); } catch (e) { return null; } }
  function get(k, dflt) { try { var v = JSON.parse(raw(k)); return v == null ? dflt : v; } catch (e) { return dflt; } }
  function putRaw(k, v) { try { window.localStorage.setItem(k, v); return true; } catch (e) { return false; } }
  function put(k, v) { var s; try { s = JSON.stringify(v); } catch (e) { return false; } return putRaw(k, s); }
  function del(k) { try { window.localStorage.removeItem(k); return true; } catch (e) { return false; } }
  var isObj = function (v) { return !!v && typeof v === 'object' && !Array.isArray(v); };
  var obj = function (k) { var v = get(k, null); return isObj(v) ? v : null; };
  var has = Object.prototype.hasOwnProperty;

  // 改了哪幾份先記著，全部寫完才一起通知這一頁（storage 事件平常只會發給別的分頁）
  var changed = [], firing = false;
  function save(k, v) { if ((v == null ? del(k) : put(k, v)) && changed.indexOf(k) < 0) changed.push(k); }
  function notify() {
    var list = changed; changed = []; firing = true;
    list.forEach(function (k) {
      var ev;
      try { ev = new window.StorageEvent('storage', { key: k }); } catch (e) { try { ev = new window.Event('storage'); ev.key = k; } catch (e2) { ev = null; } }
      try { if (ev) window.dispatchEvent(ev); } catch (e) { /* 監聽的人自己出錯，不關我們的事 */ }
    });
    firing = false;
  }

  /* ---------------------------------------------------------------- 一份紀錄一對：讀成名字、把伺服器有的補進去 */
  function doneList() { var d = get(M.done, []); return Array.isArray(d) ? d.filter(function (x) { return typeof x === 'string'; }) : []; }
  function t1() { var f = obj(M.f4); return f && isObj(f.done) && f.done.t1 > 0 ? f.done.t1 : 0; }

  // 這台的紀錄：{earned:{名字:1}, paid:{名字:1}, days:{日期:秒}}
  function snapshot() {
    var earned = {}, paid = {}, days = {};
    var add = function (n) { if (n.length <= 60) earned[n] = 1; };
    doneList().forEach(function (id) { if (ID.test(id)) add('lesson:' + id); });
    var q = obj(M.quiz) || {};
    Object.keys(q).forEach(function (id) { if (q[id] && ID.test(id)) add('quiz:' + id); });
    var c = obj(M.ch) || {};
    Object.keys(c).forEach(function (id) {
      if (ID.test(id) && Array.isArray(c[id])) c[id].forEach(function (i) { if (i === Math.floor(i) && i >= 0 && i < 100) add('chapter:' + id + ':' + i); });
    });
    if (t1()) add('task:t1');
    Object.keys(obj(M.aw) || {}).forEach(function (k) { if (k.indexOf('streak:') === 0) add(k); });
    var d = obj(M.decor);
    (d && Array.isArray(d.paid) ? d.paid : []).forEach(function (n) { if (typeof n === 'string' && n.length <= 60) paid[n] = 1; });
    Object.keys(obj(M.vis) || {}).forEach(function (k) { if (DAY.test(k)) days[k] = 0; });
    var t = obj(M.time), td = t && isObj(t.days) ? t.days : {};
    Object.keys(td).forEach(function (k) { if (DAY.test(k)) days[k] = Math.max(days[k] || 0, Math.floor(Math.min(86400, Math.max(0, +td[k] || 0)))); });
    return { earned: earned, paid: paid, days: days };
  }

  // 每個 merge 只「加」；真的有加才寫
  function mergeDone(ids, skip) {
    var cur = doneList(), add = ids.filter(function (id) { return cur.indexOf(id) < 0 && skip.indexOf(id) < 0; });
    if (add.length) save(M.done, cur.concat(add));
  }
  function mergeQuiz(ids) {
    var q = obj(M.quiz) || {}, n = 0;
    ids.forEach(function (id) { if (!q[id]) { q[id] = 1; n++; } });
    if (n) save(M.quiz, q);
  }
  function mergeChapters(list) {
    var c = obj(M.ch) || {}, n = 0;
    list.forEach(function (x) {
      if (!Array.isArray(c[x.id])) c[x.id] = [];
      if (c[x.id].indexOf(x.i) < 0) { c[x.id].push(x.i); n++; }
    });
    if (n) save(M.ch, c);
  }
  function mergeT1(on, at) {
    if (!on || t1()) return;
    var f = obj(M.f4) || {};
    if (!isObj(f.done)) f.done = {};
    f.done.t1 = at > 0 ? at : 1;
    save(M.f4, f);
  }
  function mergeAwards(list) {
    var a = obj(M.aw) || {}, n = 0;
    // 金額照伺服器的（伺服器說 0 的不蓋掉這台的）
    list.forEach(function (e) { var v = +e.n || 0; if (!has.call(a, e.key) || (v > 0 && a[e.key] !== v)) { a[e.key] = v; n++; } });
    if (n) save(M.aw, a);
  }
  function mergeDays(days) {
    var v = obj(M.vis) || {}, nv = 0;
    Object.keys(days).forEach(function (k) { if (!v[k]) { v[k] = 1; nv++; } });
    if (nv) save(M.vis, v);
    var t = obj(M.time) || {}, td = isObj(t.days) ? t.days : {}, nt = 0, sum = 0;
    Object.keys(days).forEach(function (k) { if (days[k] > 0 && (+td[k] || 0) < days[k]) { td[k] = days[k]; nt++; } });
    Object.keys(td).forEach(function (k) { sum += +td[k] || 0; });
    var total = Math.max(+t.total || 0, sum);
    if (!nt && total === (+t.total || 0)) return;
    t.days = td; t.total = total;
    save(M.time, t);
  }
  function mergePaid(names) {
    var d = obj(M.decor), cur = d && Array.isArray(d.paid) ? d.paid : [];
    var add = names.filter(function (n) { return cur.indexOf(n) < 0; });
    if (!add.length) return;
    d = d || {}; d.paid = cur.concat(add);
    save(M.decor, d);
  }

  // 登出、刪除帳號、換人：上面那幾份全清（pd-time 的 lessons 留著），清完才通知
  function wipe() {
    [M.done, M.quiz, M.ch, M.aw, M.vis, M.decor].forEach(function (k) { if (raw(k) != null) save(k, null); });
    var t = obj(M.time);
    if (t && (has.call(t, 'days') || has.call(t, 'total'))) {
      delete t.days; delete t.total;
      var rest = Object.keys(t), empty = rest.length === 0 || (rest.length === 1 && isObj(t.lessons) && !Object.keys(t.lessons).length);
      save(M.time, empty ? null : t);
    } else if (raw(M.time) != null && !t) save(M.time, null);
    var f = obj(M.f4);
    if (f && isObj(f.done) && has.call(f.done, 't1')) { delete f.done.t1; save(M.f4, f); }
    [K.base, K.pending, K.owner, K.state].forEach(del);
    notify();
  }

  /* ---------------------------------------------------------------- 上次對完時的樣子、待送的取消完成 */
  function base() {
    var b = obj(K.base) || {}, out = { earned: {}, paid: {}, days: isObj(b.days) ? b.days : {} };
    (Array.isArray(b.earned) ? b.earned : []).forEach(function (n) { out.earned[n] = 1; });
    (Array.isArray(b.paid) ? b.paid : []).forEach(function (n) { out.paid[n] = 1; });
    // 伺服器不收的：{名字或日期: 上次送的時間}，一小時內不再送
    out.skip = isObj(b.skip) ? b.skip : {}; out.skipDays = isObj(b.skipDays) ? b.skipDays : {};
    return out;
  }
  // 改 base 裡的不收清單；最多留 300 筆（留最近送的）
  function memo(fn) {
    var b = obj(K.base);
    if (!b) return;
    var s = isObj(b.skip) ? b.skip : {}, d = isObj(b.skipDays) ? b.skipDays : {};
    fn(s, d);
    var cap = function (m) {
      var ks = Object.keys(m).sort(function (x, y) { return m[y] - m[x]; }), out = {};
      ks.slice(0, LIM.memo).forEach(function (k) { out[k] = m[k]; });
      return out;
    };
    b.skip = cap(s); b.skipDays = cap(d);
    put(K.base, b);
  }
  var fresh = function (m, k) { return has.call(m, k) && now() - m[k] < HOUR; };
  function pending() { var p = get(K.pending, []); return Array.isArray(p) ? p.filter(function (x) { return typeof x === 'string'; }) : []; }
  // 取消完成送到了（或送不了）：清單和 base 都拿掉那一課
  function forget(id) {
    put(K.pending, pending().filter(function (x) { return x !== id; }));
    var b = obj(K.base);
    if (b && Array.isArray(b.earned)) { b.earned = b.earned.filter(function (n) { return n !== 'lesson:' + id; }); put(K.base, b); }
  }
  // 伺服器回來的 state（一定是這個人、這個 token 成功的回應）：只往瀏覽器補。
  // 「少了什麼」絕不拿來推論要刪。唯一會減的是伺服器明講的 state.undone（別台按了取消完成），
  // 而且只在這台已經對過那一課（base 有）時；這台剛完成、還沒送的照留照送。
  function apply(st) {
    var prev = base();
    var list = Array.isArray(st.earned) ? st.earned.filter(function (e) { return e && typeof e.key === 'string'; }) : [];
    var lessons = [], quiz = [], ch = [], aw = [], task = false, m;
    list.forEach(function (e) {
      if ((m = /^lesson:(.+)$/.exec(e.key))) lessons.push(m[1]);
      else if ((m = /^quiz:(.+)$/.exec(e.key))) quiz.push(m[1]);
      else if ((m = /^chapter:(.+):(\d+)$/.exec(e.key))) ch.push({ id: m[1], i: +m[2] });
      else if (e.key === 'task:t1') task = true;
      else if (e.key.indexOf('streak:') === 0) aw.push(e);
    });
    var days = {};
    if (isObj(st.days)) Object.keys(st.days).forEach(function (k) { if (DAY.test(k) && typeof st.days[k] === 'number') days[k] = st.days[k]; });
    var paidNames = list.filter(function (e) { return e.paid; }).map(function (e) { return e.key; });
    var keys = list.map(function (e) { return e.key; }), had = doneList();
    var undone = (Array.isArray(st.undone) ? st.undone : []).filter(function (n) { return typeof n === 'string' && n.indexOf('lesson:') === 0; });
    var away = had.filter(function (id) { return undone.indexOf('lesson:' + id) >= 0 && prev.earned['lesson:' + id]; });
    if (away.length) save(M.done, had.filter(function (id) { return away.indexOf(id) < 0; }));
    mergeDone(lessons, pending()); mergeQuiz(quiz); mergeChapters(ch); mergeT1(task, st.t1); mergeAwards(aw); mergeDays(days); mergePaid(paidNames);
    // base 就是伺服器這次回的（伺服器沒有的下次照送）；伺服器後來收下的，從不收清單拿掉
    var skip = {}, skipDays = {};
    Object.keys(prev.skip).forEach(function (k) { if (keys.indexOf(k) < 0) skip[k] = prev.skip[k]; });
    Object.keys(prev.skipDays).forEach(function (k) { if (!has.call(days, k)) skipDays[k] = prev.skipDays[k]; });
    put(K.base, { earned: keys, paid: paidNames, days: days, skip: skip, skipDays: skipDays });
    meta(st);
    notify();
    emit();
  }

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
  function call(method, path, body, tok, keep) {
    var p = chain.then(function () { return send(method, path, body, tok, keep); });
    chain = p.then(noop, noop);
    return p;
  }
  function send(method, path, body, tok, keep) {
    return new Promise(function (done) {
      var over = false, ctrl = null, timer = null;
      function end(r) { if (over) return; over = true; try { window.clearTimeout(timer); } catch (e) { /* 沒差 */ } done(r); }
      try {
        try { ctrl = new window.AbortController(); } catch (e) { ctrl = null; }
        timer = window.setTimeout(function () { try { if (ctrl) ctrl.abort(); } catch (e) { /* 沒差 */ } end(NET); }, TIMEOUT);
        var headers = {}, init;
        if (body) headers['Content-Type'] = 'application/json';
        if (tok) headers.Authorization = 'Bearer ' + tok;
        init = { method: method, headers: headers, body: body ? JSON.stringify(body) : undefined, signal: ctrl ? ctrl.signal : undefined, credentials: 'omit' };
        if (keep) init.keepalive = true;   // 頁面要關了也送得出去
        window.fetch(API + path, init)
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
  // 回應要真的帶著 state.me.id，而且是這個人的，才拿來改東西
  function stateOk(st, id) { return isObj(st) && isObj(st.me) && typeof st.me.id === 'string' && !!st.me.id && (id == null || st.me.id === id); }

  /* ---------------------------------------------------------------- 登入狀態 */
  var A = { status: 'off', me: null, coins: null, decor: null, ready: null };
  var token = null, kept = false, owned = false, lastOk = 0, lastToday = 0;

  // 狀態、名字、代幣、擺飾真的變了才通知各頁
  var lastSig = null;
  function emit() {
    if (A.status === 'off') return;
    var sig;
    try { sig = JSON.stringify([A.status, A.me, A.coins, A.decor]); } catch (e) { sig = String(Math.random()); }
    if (sig === lastSig) return;
    lastSig = sig;
    try { window.dispatchEvent(new window.CustomEvent('pd-account', { detail: { status: A.status } })); } catch (e) { /* 舊瀏覽器 */ }
  }
  function setIn(tok, me) { token = tok; A.status = 'in'; A.me = me; kept = put(K.acct, { token: tok, me: me }); tick(); }
  function setGuest() { token = null; A.status = 'guest'; A.me = A.coins = A.decor = null; lastOk = lastToday = 0; waiting = null; tick(); del(K.acct); del(K.state); }
  // 只換帳號的資料（名字、代幣、擺飾），不動進度
  function meta(st) {
    A.me = st.me; A.coins = st.coins || null; A.decor = st.decor || null;
    put(K.acct, { token: token, me: st.me }); put(K.state, { coins: A.coins, decor: A.decor });
  }
  // 這台的紀錄屬於誰：換人就先清（同步做完才 await，之後寫的才不會被清掉）
  function claim(id) {
    var o = get(K.owner, null);
    if (o != null && o !== id) wipe();
    owned = o === id || put(K.owner, id);
  }
  // 別的分頁登出或換人了：這一頁也不再代表這個人（不清東西，那邊清過了）
  function mine() {
    if (A.status !== 'in') return false;
    if (kept) { var a = get(K.acct, null); if (!a || a.token !== token) return false; }
    return !owned || get(K.owner, null) === A.me.id;
  }
  function drop() { token = null; A.status = 'guest'; A.me = A.coins = A.decor = null; lastOk = lastToday = 0; waiting = null; tick(); emit(); }
  // 憑證過期或被拒：當作登出，但進度、owner、base、待送清單都不清
  function gone(tok) { if (token === tok) { setGuest(); emit(); } }
  function alive(tok) { return token === tok && mine(); }

  /* ---------------------------------------------------------------- 對一次：先送取消完成，再分包送多出來的，最後以回來的 state 補齊 */
  function diff(snap, b) {
    var earned = Object.keys(snap.earned).filter(function (n) { return !b.earned[n] && !fresh(b.skip, n); });
    // 伺服器沒有那一筆就標不了 paid，不送
    var paid = Object.keys(snap.paid).filter(function (n) { return !b.paid[n] && (b.earned[n] || earned.indexOf(n) >= 0); });
    var days = Object.keys(snap.days).filter(function (d) { return (!has.call(b.days, d) || snap.days[d] > b.days[d]) && !fresh(b.skipDays, d); });
    return { earned: earned, paid: paid, days: days, secs: snap.days };
  }
  function pack(d) {
    var out = [], cur = null, empty = JSON.stringify({ earned: [], paid: [], days: {} }).length;
    function add(kind, key, cost, put1, streak) {
      if (!cur || cur.n[kind] >= LIM[kind] || (streak && cur.n.streak >= LIM.streak) || cur.len + cost > LIM.chars) {
        cur = { body: { earned: [], paid: [], days: {} }, n: { earned: 0, paid: 0, days: 0, streak: 0 }, len: empty }; out.push(cur);
      }
      put1(cur.body); cur.n[kind]++; cur.len += cost; if (streak) cur.n.streak++;
    }
    d.days.forEach(function (k) { add('days', k, JSON.stringify(k).length + String(d.secs[k]).length + 2, function (b) { b.days[k] = d.secs[k]; }); });
    d.earned.forEach(function (n) { add('earned', n, JSON.stringify(n).length + 1, function (b) { b.earned.push(n); }, n.indexOf('streak:') === 0); });
    d.paid.forEach(function (n) { add('paid', n, JSON.stringify(n).length + 1, function (b) { b.paid.push(n); }); });
    return out.map(function (c) { return c.body; });
  }

  // 送出去、伺服器卻沒收下的，記進不收清單
  function remember(body, st) {
    var keys = {}, sd = isObj(st.days) ? st.days : {}, t = now();
    (Array.isArray(st.earned) ? st.earned : []).forEach(function (e) { if (e && typeof e.key === 'string') keys[e.key] = 1; });
    memo(function (s, d) {
      body.earned.forEach(function (n) { if (!keys[n]) s[n] = t; });
      Object.keys(body.days).forEach(function (k) { if (!has.call(sd, k)) d[k] = t; });
    });
  }

  // o.keep：頁面要關了；o.pull：60 秒那次，沒東西也要問；o.lazy：計時器或別的分頁觸發的（只差今天的秒數就 5 分鐘一次）
  function run(tok, o) {
    if (!alive(tok)) { if (token === tok && A.status === 'in') drop(); return Promise.resolve({ ok: false, error: 'auth' }); }
    var snap = snapshot(), p = pending(), keep = o.keep, b = base(), day = today();
    var dels = p.filter(function (id) { return !snap.earned['lesson:' + id]; });   // 又完成了的就不刪
    if (dels.length !== p.length) put(K.pending, dels);
    // 這台已經沒有的就不用記著不收
    if (Object.keys(b.skip).some(function (k) { return !snap.earned[k]; }) || Object.keys(b.skipDays).some(function (k) { return !has.call(snap.days, k); })) {
      memo(function (s, d) {
        Object.keys(s).forEach(function (k) { if (!snap.earned[k]) delete s[k]; });
        Object.keys(d).forEach(function (k) { if (!has.call(snap.days, k)) delete d[k]; });
      });
    }
    var d = diff(snap, b);
    // 只差今天的秒數（今天已經送過）：計時器和別的分頁觸發的，5 分鐘才送一次
    if (o.lazy && !dels.length && !d.earned.length && !d.paid.length && d.days.length === 1 && d.days[0] === day && has.call(b.days, day) &&
        now() - lastToday < TODAY_EVERY) d.days = [];
    var packs = pack(d);
    if (!dels.length && !packs.length && !o.pull && now() - lastOk < EVERY) return Promise.resolve({ ok: true });
    var steps = dels.map(function (id) {
      return function () { return call('DELETE', '/earned/' + encodeURIComponent('lesson:' + id), null, tok, keep).then(function (r) { return Object.assign({ id: id }, r); }); };
    }).concat(packs.map(function (body) { return function () { return call('POST', '/sync', body, tok, keep).then(function (r) { return Object.assign({ body: body }, r); }); }; }));
    if (!steps.length) steps.push(function () { return call('GET', '/me', null, tok, keep); });
    var i = 0, bad = null;
    function next() {
      if (i >= steps.length) {
        if (!bad) { lastOk = now(); tick(); }
        return bad ? { ok: false, error: bad } : { ok: true };
      }
      return steps[i++]().then(function (r) {
        if (!alive(tok)) return { ok: false, error: 'auth' };      // 已經登出或換人了，回應不算數
        if (r.ok && !stateOk(r.state, A.me.id)) r = NET;
        if (r.ok) {
          if (r.id) forget(r.id);
          apply(r.state);
          if (r.body) { remember(r.body, r.state); if (has.call(r.body.days, day)) lastToday = now(); }
          return next();
        }
        if (r.error === 'auth') gone(tok);
        if (r.error === 'auth' || r.error === 'net' || r.error === 'busy') return { ok: false, error: r.error };
        // 其他錯（例如課下架了）送再多次也一樣：刪除就拿掉，其他的跳過
        if (r.id) forget(r.id);
        bad = r.error;
        return next();
      });
    }
    return next();
  }

  // 已經排著（還沒開始）的就併進去；正在跑的跑完再多跑一次就好
  var waiting = null, running = null, want = { keep: false, pull: false, eager: false };
  function syncNow(o) {
    o = o || {};
    if (A.status !== 'in') return Promise.resolve({ ok: false, error: A.status === 'off' ? 'off' : 'auth' });
    want.keep = want.keep || !!o.keep; want.pull = want.pull || !!o.pull; want.eager = want.eager || !o.lazy;
    if (waiting) return waiting;
    var tok = token, p = (running || Promise.resolve()).then(noop, noop).then(function () {
      waiting = null; running = p;
      var w = want; want = { keep: false, pull: false, eager: false };
      return run(tok, { keep: w.keep, pull: w.pull, lazy: !w.eager });
    }).then(function (r) { if (running === p) running = null; return r; }, function () { if (running === p) running = null; return NET; });
    waiting = p;
    return p;
  }

  /* ---------------------------------------------------------------- 什麼時候對：每 60 秒（看著頁面時）、收起來或關掉時、別的分頁寫了 */
  var ticker = null, soon = null;
  function tick() {
    try { window.clearTimeout(ticker); } catch (e) { /* 沒差 */ }
    ticker = null;
    if (A.status !== 'in') return;
    try { ticker = window.setTimeout(function () { ticker = null; if (A.status !== 'in') return; if (visible()) syncNow({ pull: true, lazy: true }); tick(); }, EVERY); } catch (e) { ticker = null; }
  }
  function visible() { try { return !window.document || window.document.visibilityState !== 'hidden'; } catch (e) { return true; } }
  function shown() { try { return !window.document || window.document.visibilityState === 'visible'; } catch (e) { return true; } }
  function listen() {
    try {
      window.addEventListener('storage', function (e) {
        if (firing || A.status !== 'in') return;
        var k = e && e.key;
        if ((k === K.acct || k === K.owner || k == null) && !mine()) { drop(); return; }
        // 只在看著這一頁時；學習時間、到訪日一直在變，交給 60 秒那次
        if (!shown() || k === M.time || k === M.vis || (k != null && MIRROR.indexOf(k) < 0)) return;
        try { window.clearTimeout(soon); } catch (e2) { /* 沒差 */ }
        soon = window.setTimeout(function () { soon = null; syncNow({ lazy: true }); }, LATER);
      });
      window.addEventListener('pagehide', function () { if (A.status === 'in') syncNow({ keep: true }); });
      if (window.document) window.document.addEventListener('visibilitychange', function () { if (A.status === 'in' && !visible()) syncNow({ keep: true }); });
    } catch (e) { /* 舊瀏覽器：只剩開頁面時對 */ }
  }

  /* ---------------------------------------------------------------- 登入、登出 */
  function signIn(body) {
    if (A.status === 'off') return Promise.resolve({ ok: false, error: 'off' });
    return call('POST', '/auth/google', body, null).then(function (r) {
      if (!r.ok) return { ok: false, error: r.error };
      if (typeof r.token !== 'string' || !stateOk(r.state)) return NET;
      claim(r.state.me.id);
      setIn(r.token, r.state.me);
      apply(r.state); lastOk = now();
      memo(function (s, d) { Object.keys(s).forEach(function (k) { delete s[k]; }); Object.keys(d).forEach(function (k) { delete d[k]; }); });   // 登入後第一次全部再送一次
      return syncNow().then(function () { return { ok: true }; });
    });
  }
  // 兌換、擺放這類要伺服器說了算的：連不上就是失敗
  function action(method, path, body) {
    if (A.status !== 'in') return Promise.resolve({ ok: false, error: A.status === 'off' ? 'off' : 'auth' });
    var tok = token;
    return call(method, path, body, tok).then(function (r) {
      if (!alive(tok)) return { ok: false, error: 'auth' };
      if (r.ok && !stateOk(r.state, A.me.id)) r = NET;
      if (r.ok) { apply(r.state); return { ok: true }; }
      if (r.error === 'auth') gone(tok);
      return { ok: false, error: r.error };
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
  A.syncNow = safe(function () { return syncNow(); });
  // 取消完成只能從這裡：從 pd-done 拿掉、記進待送清單、送 DELETE（送到才拿掉）。完成：反悔就從清單拿掉，再對一次
  A.lessonDone = safe(function (id, on) {
    if (A.status === 'off') return Promise.resolve({ ok: false, error: 'off' });
    id = String(id);
    var p = pending();
    if (on) { if (p.indexOf(id) >= 0) put(K.pending, p.filter(function (x) { return x !== id; })); }
    else {
      var d = doneList();
      if (d.indexOf(id) >= 0) { save(M.done, d.filter(function (x) { return x !== id; })); notify(); }
      // 沒登入、這台也不屬於誰：伺服器上沒有東西要刪
      if (p.indexOf(id) < 0 && (A.status === 'in' || get(K.owner, null) != null)) put(K.pending, p.concat([id]));
    }
    return syncNow();
  });
  // 頁面已經自己寫好紀錄了，這裡只是馬上對一次
  A.firstTaskDone = A.syncNow;
  A.redeem = safe(function (item) { return action('POST', '/decor/redeem', { item: item }); });
  A.savePlaced = safe(function (placed, seen, keptList) {
    var body = { placed: placed, seen: seen };
    if (Array.isArray(keptList)) body.kept = keptList;
    return action('PUT', '/decor/placed', body);
  });
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
      A.status = 'guest';
      listen();
      var acct = get(K.acct, null), last = get(K.state, null);
      if (acct && typeof acct.token === 'string' && acct.me && typeof acct.me.id === 'string' && acct.me.id) {
        claim(acct.me.id);
        setIn(acct.token, acct.me);
        if (isObj(last)) { A.coins = last.coins || null; A.decor = last.decor || null; }
        A.ready = syncNow().then(noop, noop);
      }
    }
    emit();
  } catch (e) { A.status = 'off'; token = null; A.me = A.coins = A.decor = null; }
})();
