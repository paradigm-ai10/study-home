// 網頁課（由定稿 PDF 產生）的外框與互動。所有 PDF 課共用；內容在頁面裡（tools/from_pdf.py 從 PDF 原文搬過來），這裡一個字都不加進正文，
// 只加：課程地圖位置、章節目錄、閱讀進度、接著讀、頁碼連結、複製與開 Claude、填空、步驟打勾、截圖放大、圖解互動、鍵盤示範、
// 常見問題收合、勾勾看、課後測驗、完成本課、名詞小卡。載入順序：../pixel.js → roadmap8.js → glossary.js → 這個檔。
// 2026-11-14 建立。
(() => {
  const M = window.PDFLESSON, R = window.ROADMAP, P = window.PIXEL, body = document.body
  const $ = (s, el = document) => el.querySelector(s), $$ = (s, el = document) => [...el.querySelectorAll(s)]
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const store = { get(k, d) { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch { return d } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} } }
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  const touch = matchMedia('(hover: none)').matches   // 手機、平板：提示寫「點」，桌機寫「滑鼠移到」
  const wait = ms => new Promise(r => setTimeout(r, ms))
  const ID = M.id, doc = $('#doc'), pages = $$('.pdfpage', doc)
  const HOME_URL = '../crab/rooms/f4/index.html'
  const K = n => `pd-${n}-${ID}`

  // ── 頁首與課程地圖 ──
  const crit = (move = P ? P.hop('1.6s') : '') => P ? P.pixels(10, 6, P.critter(1, 0, move), '阿糰') : ''
  $('#top').innerHTML = `<a class="pl-logo" href="${HOME_URL}"><span>${P ? P.critterIcon() : ''}</span>PARADIGM</a>
    ${M.draft ? '<span class="pl-draft">草稿</span>' : ''}
    <nav><a href="${HOME_URL}#map">學習地圖</a><a href="glossary.html">AI 名詞小字典</a><a class="home" href="${HOME_URL}">回終端機</a></nav>`
  const topic = R && R.topics.find(t => t.lessons.some(l => l.id === ID))
  if (topic) {
    const stage = R.stages.find(s => s.topics.includes(topic.id)), role = R.roles.find(r => r.topics.includes(topic.id))
    const idx = topic.lessons.findIndex(l => l.id === ID)
    $('#map').innerHTML = `
      <ol class="pl-mods" aria-label="${R.topics.length} 個主題，現在在主題 ${topic.no}">${R.stages.map(s => `<li class="${s === stage ? 'here' : ''}"><span class="sn">${esc(s.name)}　${esc(s.tagline)}</span><ol>${s.topics.map(tid => { const t = R.topics.find(x => x.id === tid)
        return `<li class="${t === topic ? 'now' : ''}${t.lessons.some(l => R.open.includes(l.id)) ? ' has' : ''}" title="主題 ${t.no}　${esc(t.name)}">${t.no}</li>` }).join('')}</ol></li>`).join('')}</ol>
      <div class="pl-modline">
        <span><b>主題 ${topic.no}　${esc(topic.name)}</b>　第 ${idx + 1} 課，共 ${topic.lessons.length} 課</span>
        <ol class="pl-dots" aria-label="主題 ${topic.no} 的課">${topic.lessons.map(l => `<li class="${l.id === ID ? 'now' : ''}${l.type === '選修' ? ' el' : ''}" title="${esc(l.id + '　' + l.title)}">${l.id === ID ? `<span class="who">${crit()}</span>` : ''}</li>`).join('')}</ol>
        ${role ? `<ol class="pl-roles" aria-label="四個角色">${R.roles.map(r => `<li class="${r === role ? 'now' : ''}"><b>${esc(r.name)}</b></li>`).join('')}</ol>` : ''}
      </div>`
  }

  // ── 章節：照 PDF 的 data-ch 分組；每章第一頁前面加章節開頭 ──
  const CH = (M.chapters || []).map((c, i) => ({ ...c, i, pages: pages.filter(p => p.dataset.ch === c.k) })).filter(c => c.pages.length)
  CH.forEach(c => {
    const h = document.createElement('div'); h.className = 'pl-chhead'; h.id = 'ch-' + c.k
    h.innerHTML = `<span class="no">${c.i + 1}</span><b>${esc(c.t)}</b><span>${esc(c.d)}</span>`
    c.pages[0].before(h)
  })
  const label = p => p.dataset.tl || '封面'

  // 側邊目錄：只列五章（Thomas 11/14：預設的側邊欄太多），現在讀的那章亮起；下載、完成本課放在課的最後
  const side = $('#side')
  side.innerHTML = `<div class="pl-sidehead"><b>目錄</b><button type="button" class="pl-fold" aria-controls="side" aria-expanded="true" title="收起目錄">‹ 收起</button></div>
    <ol class="pl-chs">
      ${CH.map(c => `<li data-ch="${c.k}"><a href="#ch-${c.k}"><span class="no">${c.i + 1}</span>${esc(c.t)}</a></li>`).join('')}
    </ol>`

  // 目錄收起來／打開（記住，所有課共用）
  const opener = $('#opener')
  const setSide = (on, save = true) => {
    body.classList.toggle('pl-side-off', !on); opener.hidden = on
    opener.setAttribute('aria-expanded', on); $('.pl-fold', side).setAttribute('aria-expanded', on)
    if (save) store.set('pd-side', on ? 'open' : 'closed')
  }
  $('.pl-fold', side).onclick = () => { setSide(false); opener.focus() }
  opener.onclick = () => { setSide(true); $('.pl-fold', side).focus() }
  setSide(store.get('pd-side', 'open') !== 'closed', false)

  // ── 小螃蟹跑進度條＋索引（Thomas 11/14）：大點＝章、小點＝小節，底下寫章名；
  //    整條可以拖：抓著小螃蟹（或在條上任何地方按住）左右拉，頁面跟著捲到那裡，泡泡顯示拉到哪一節；方向鍵一節一節跳 ──
  const run = $('#run')
  const crab = (move, cls) => `<span class="${cls}">${P ? P.pixels(10, 6, P.critter(1, 0, move), '阿糰') : ''}</span>`
  const secName = p => { const c = CH.find(x => x.k === p.dataset.ch); return c ? `${c.i + 1} ${c.t}｜${label(p)}` : '開始' }
  const subPages = pages.filter(p => p.dataset.ch && !CH.some(c => c.pages[0] === p))   // 每章第一節跟章的點重疊，不另畫
  run.innerHTML = `<div class="pl-track" tabindex="0" role="slider" aria-label="這課讀到哪裡：左右拖曳或用方向鍵跳到想讀的地方" aria-valuemin="0" aria-valuemax="100"><i class="fill"></i>
      ${subPages.map(p => `<i class="tick sub" data-n="${p.dataset.n}"></i>`).join('')}
      ${CH.map(c => `<i class="tick ch" data-k="${c.k}"></i>`).join('')}
      <span class="pl-crab" title="拖著我走">${crab(P ? P.hop('1.4s') : '', 'idle')}${crab(P ? P.hop('0.26s') + P.wiggle('0.18s') : '', 'run')}</span>
      <span class="pl-bubble" hidden></span>
      <span class="pl-goal" title="終點"><i></i><b id="rpct">0%</b></span></div>
    <div class="pl-index">${CH.map(c => `<a href="#ch-${c.k}" data-k="${c.k}" title="${c.i + 1} ${esc(c.t)}"><span>${c.i + 1}</span>${esc(c.t)}</a>`).join('')}</div>`
  const track = $('.pl-track', run), ticks = $$('.tick.ch', run), subs = $$('.tick.sub', run), crabEl = $('.pl-crab', run), fillEl = $('.fill', run), bubble = $('.pl-bubble', run), idx = $$('.pl-index a', run)
  const docTop = () => doc.getBoundingClientRect().top + scrollY
  const span = () => Math.max(1, doc.getBoundingClientRect().height - innerHeight * 0.4)
  const frac = () => Math.max(0, Math.min(1, (scrollY + innerHeight * 0.35 - docTop()) / span()))
  const posOf = el => Math.max(0, Math.min(1, (el.getBoundingClientRect().top + scrollY - docTop()) / span()))
  let pagePos = []   // 每節在條上的位置（0–1）
  const placeTicks = () => {
    pagePos = pages.map(posOf)
    CH.forEach((c, i) => { const f = posOf($('#ch-' + c.k)); ticks[i].style.left = idx[i].style.left = (f * 100) + '%'; const next = CH[i + 1] ? posOf($('#ch-' + CH[i + 1].k)) : 1; idx[i].style.maxWidth = `calc(${(next - f) * 100}% - 6px)` })
    subs.forEach(s => s.style.left = (pagePos[s.dataset.n - 1] * 100) + '%')
  }
  const pageAt = f => { let k = 0; pagePos.forEach((x, i) => { if (x <= f + 0.002) k = i }); return k }
  const goTo = (f, smooth) => scrollTo({ top: docTop() + f * span() - innerHeight * 0.35 + 2, behavior: smooth && !reduce ? 'smooth' : 'instant' })
  const showBubble = (f, text) => { bubble.hidden = false; bubble.textContent = text; bubble.style.left = (f * 100) + '%' }
  // 拖曳
  let dragging = false
  const fAt = e => { const r = track.getBoundingClientRect(); return Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) }
  track.addEventListener('pointerdown', e => {
    if (e.button !== 0) return
    dragging = true; track.setPointerCapture(e.pointerId); run.classList.add('dragging'); e.preventDefault()
    const f = fAt(e); goTo(f); showBubble(f, secName(pages[pageAt(f)]))
  })
  track.addEventListener('pointermove', e => {
    const f = fAt(e)
    if (dragging) { goTo(f); showBubble(f, secName(pages[pageAt(f)])) }
    else if (e.pointerType === 'mouse') showBubble(f, secName(pages[pageAt(f)]))
  })
  const endDrag = () => { if (!dragging) return; dragging = false; run.classList.remove('dragging'); bubble.hidden = true; scan() }
  track.addEventListener('pointerup', endDrag); track.addEventListener('pointercancel', endDrag)
  track.addEventListener('pointerleave', () => { if (!dragging) bubble.hidden = true })
  // 鍵盤：← → 一節一節跳，Home／End 到頭尾
  track.addEventListener('keydown', e => {
    const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    let to = null
    if (k) to = Math.max(0, Math.min(pages.length - 1, cur + k)); else if (e.key === 'Home') to = 0; else if (e.key === 'End') to = pages.length - 1
    if (to === null) return
    e.preventDefault(); pages[to].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); showBubble(pagePos[to], secName(pages[to])); setTimeout(() => bubble.hidden = true, 1200)
  })
  let lastY = scrollY, stopT
  const moveCrab = () => {
    const f = frac(); crabEl.style.left = (f * 100) + '%'; fillEl.style.width = (f * 100) + '%'
    track.setAttribute('aria-valuenow', Math.round(f * 100)); track.setAttribute('aria-valuetext', secName(pages[cur]))
    if (Math.abs(scrollY - lastY) > 2) { crabEl.classList.add('running'); crabEl.classList.toggle('back', scrollY < lastY); clearTimeout(stopT); stopT = setTimeout(() => crabEl.classList.remove('running'), 260) }
    lastY = scrollY
  }
  addEventListener('resize', placeTicks); document.fonts && document.fonts.ready.then(placeTicks)
  new ResizeObserver(() => { placeTicks(); moveCrab() }).observe(doc)

  // 窄螢幕：上方一條
  const strip = $('#strip')
  strip.innerHTML = `<button type="button" aria-expanded="false"><b id="sch">開始</b><span id="stl"></span><small>目錄 ▾</small></button><div class="sheet" hidden>${side.querySelector('.pl-chs').outerHTML}</div>`
  strip.removeAttribute('aria-hidden')
  const sbtn = $('button', strip), sheet = $('.sheet', strip)
  sbtn.onclick = () => { sheet.hidden = !sheet.hidden; sbtn.setAttribute('aria-expanded', !sheet.hidden) }
  sheet.addEventListener('click', e => { if (e.target.closest('a')) { sheet.hidden = true; sbtn.setAttribute('aria-expanded', false) } })

  // ── 讀到哪：目前這頁、看過的頁（存在這台裝置）、接著讀 ──
  const seen = new Set(store.get(K('seen'), []))
  let cur = 0
  const paintProg = () => {
    const pct = Math.round(seen.size / pages.length * 100)
    $('#rpct').textContent = pct + '%'
    ticks.forEach((t, i) => t.classList.toggle('seen', CH[i].pages.every(p => seen.has(+p.dataset.n))))
    $('.pl-goal', run).classList.toggle('won', seen.size === pages.length)
    moveCrab()
    $$('.pl-chs > li[data-ch]').forEach(li => { const c = CH.find(x => x.k === li.dataset.ch); li.classList.toggle('done', c.pages.every(p => seen.has(+p.dataset.n))); li.classList.toggle('cur', c.k === pages[cur].dataset.ch); li.querySelector('a').setAttribute('aria-current', c.k === pages[cur].dataset.ch) })
    const p = pages[cur], c = CH.find(x => x.k === p.dataset.ch)
    $('#sch').textContent = c ? `${c.i + 1} ${c.t}` : '開始'; $('#stl').textContent = c ? label(p) : ''
    idx.forEach((a, i) => { a.classList.toggle('now', c && CH[i].k === c.k); a.classList.toggle('seen', CH[i].pages.every(q => seen.has(+q.dataset.n))) })
    subs.forEach(s => s.classList.toggle('seen', seen.has(+s.dataset.n)))
  }
  const scan = () => {
    const y = innerHeight * 0.35; let hit = 0
    pages.forEach((p, i) => { if (p.getBoundingClientRect().top < y) hit = i })
    if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) hit = pages.length - 1
    // 一頁的底部捲進畫面，就算看過
    pages.forEach(p => { const r = p.getBoundingClientRect(); if (r.bottom < innerHeight * 0.95 && r.bottom > -innerHeight * 4) seen.add(+p.dataset.n) })
    { cur = hit; paintProg(); store.set(K('seen'), [...seen]); if (cur > 0) store.set(K('pos'), cur + 1) }
  }
  let ticking = false
  // 捲動時更新：不靠 requestAnimationFrame（分頁在背景或某些情況下會停），改成限速直接算，停下來再補算一次
  let lastScan = 0, tail
  addEventListener('scroll', () => { const t = performance.now(); if (t - lastScan > 40) { lastScan = t; scan() } clearTimeout(tail); tail = setTimeout(scan, 90) }, { passive: true })
  addEventListener('resize', scan)

  const last = store.get(K('pos'), 0)
  if (last > 2 && !location.hash) {
    const p = pages[last - 1], c = p && CH.find(x => x.k === p.dataset.ch)
    if (p) {
      const box = document.createElement('div'); box.className = 'pl-resume'
      box.innerHTML = `<span>上次讀到 <b>${esc(c ? c.t + '｜' : '')}${esc(label(p))}</b></span><a class="pl-btn sm" href="#p${last}">接著讀</a><button type="button" class="x" aria-label="關閉">×</button>`
      doc.prepend(box); box.querySelector('.x').onclick = () => box.remove(); box.querySelector('a').addEventListener('click', () => setTimeout(() => box.remove(), 600))
    }
  }

  // ── 封面目錄（PDF 由 layout.js 產生，這裡用同一份章節做成可以點的） ──
  const toc = $('#toc')
  if (toc) toc.insertAdjacentHTML('beforeend', CH.map(c => `<a class="toc-row" href="#ch-${c.k}"><span class="no">${c.i + 1}</span><span class="tx"><b>${esc(c.t)}</b>${esc(c.d)}</span><span class="pg">→</span></a>`).join(''))

  // ── 文字裡的「第 N 頁」變成連結；網址變成連結；@帳號連 IG ──
  const textNodes = (root, test, skip = 'A,BUTTON,SUMMARY,INPUT,TEXTAREA,KBD,.prompt') => {
    const out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: n => n.parentElement.closest(skip) ? NodeFilter.FILTER_REJECT : test.test(n.nodeValue) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_SKIP })
    while (w.nextNode()) out.push(w.currentNode); return out
  }
  const linkify = (re, make) => textNodes(doc, re).forEach(n => {
    const s = n.nodeValue, frag = document.createDocumentFragment(); let last = 0
    s.replace(new RegExp(re.source, 'g'), (m, ...g) => { const i = g[g.length - 2]; frag.append(s.slice(last, i), make(m, ...g)); last = i + m.length; return m })
    frag.append(s.slice(last)); n.replaceWith(frag)
  })
  linkify(/第\s*(\d+)\s*頁/, (m, n) => { if (!$('#p' + n)) return m; const a = document.createElement('a'); a.className = 'pl-ref'; a.href = '#p' + n; a.textContent = m; return a })
  linkify(/support\.claude\.com\/[\w\-/]+/, m => { const a = document.createElement('a'); a.href = 'https://' + m; a.target = '_blank'; a.rel = 'noopener'; a.textContent = m; return a })
  linkify(/@paradigmai_tw/, m => { const a = document.createElement('a'); a.href = 'https://www.instagram.com/paradigmai_tw/'; a.target = '_blank'; a.rel = 'noopener'; a.textContent = m; return a })
  doc.addEventListener('click', e => { const a = e.target.closest('a[href^="#p"], a[href^="#ch-"]'); if (!a) return; const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); history.replaceState(null, '', a.getAttribute('href')); flash(t) } })
  const flash = el => { if (reduce) return; el.animate([{ boxShadow: '0 0 0 3mm rgba(255,200,87,.45)' }, { boxShadow: '0 0 0 3mm rgba(255,200,87,0)' }], { duration: 1200, easing: 'ease-out' }) }

  // ── 提示：複製、到 Claude 開新對話（帶入文字）、填空 ──
  const toast = (() => { const t = document.createElement('div'); t.className = 'pl-toast'; t.setAttribute('role', 'status'); body.append(t); let h; return s => { t.textContent = s; t.classList.add('on'); clearTimeout(h); h = setTimeout(() => t.classList.remove('on'), 1800) } })()
  const copy = async (text, btn) => {
    try { await navigator.clipboard.writeText(text); toast('已複製，貼到 Claude 的對話框就好') }
    catch { toast('這個瀏覽器不讓網頁複製，請手動選取文字') }
    if (btn) { const o = btn.textContent; btn.textContent = '已複製'; btn.classList.add('ok'); setTimeout(() => { btn.textContent = o; btn.classList.remove('ok') }, 1600) }
  }
  $$('.prompt', doc).forEach((box, bi) => {
    const paras = $$('p', box)
    const blanks = paras.some(p => p.textContent.includes('＿'))
    if (blanks) {
      const saved = store.get(K('fill' + bi), {})
      let k = 0
      paras.forEach(p => {
        const t = p.textContent.trim()
        if (/^（.*）$/.test(t)) {   // 「（貼上你的要求…）」變成可以打字的框，原句當提示字
          const ta = document.createElement('textarea'); ta.className = 'pl-area'; ta.placeholder = t; ta.dataset.k = 'area'; ta.value = saved.area || ''; ta.setAttribute('aria-label', t); ta.rows = 3
          p.replaceWith(ta); return
        }
        textNodes(p, /＿{2,}/, 'INPUT').forEach(n => {
          const frag = document.createDocumentFragment(), parts = n.nodeValue.split(/(＿{2,})/)
          parts.forEach(s => { if (/^＿{2,}$/.test(s)) { const i = document.createElement('input'); i.className = 'pl-blank'; i.placeholder = s; i.dataset.k = 'b' + k; i.value = saved['b' + k] || ''; i.setAttribute('aria-label', `填空 ${k + 1}`); k++; frag.append(i) } else frag.append(s) })
          n.replaceWith(frag)
        })
      })
      box.addEventListener('input', () => { const v = {}; $$('[data-k]', box).forEach(i => v[i.dataset.k] = i.value); store.set(K('fill' + bi), v) })
    }
    const textOf = () => [...box.children].filter(el => el.matches('p, textarea')).map(el => {
      if (el.tagName === 'TEXTAREA') return el.value.trim() || el.placeholder
      return [...el.childNodes].map(n => n.nodeType === 3 ? n.nodeValue : n.tagName === 'INPUT' ? (n.value.trim() || n.placeholder) : n.textContent).join('').trim()
    }).join('\n')
    const bar = document.createElement('div'); bar.className = 'pl-pbtns'
    bar.innerHTML = `<button type="button">複製</button><a href="#" target="_blank" rel="noopener" title="在新分頁打開 Claude，把這段放進輸入框">在 Claude 開啟 ↗</a>`
    bar.querySelector('button').onclick = e => copy(textOf(), e.currentTarget)
    bar.querySelector('a').onclick = e => { e.currentTarget.href = 'https://claude.ai/new?q=' + encodeURIComponent(textOf()) }
    box.append(bar)
  })
  // 「用 handout-quiz 出題」這種一句話：點一下就複製
  $$('.way .say, .compare .after .say', doc).forEach(s => { s.classList.add('pl-copyable'); s.title = '點一下複製'; s.tabIndex = 0; s.setAttribute('role', 'button'); const go = () => copy(s.textContent.trim()); s.onclick = go; s.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go() } } })

  // ── 步驟打勾：點數字圓圈 ──
  const done = new Set(store.get(K('chk'), []))
  $$('ol.steps', doc).forEach((ol, oi) => {
    const pg = ol.closest('.pdfpage').dataset.n
    $$(':scope > li', ol).forEach((li, i) => {
      const id = `${pg}-${oi}-${i}`, b = document.createElement('button')
      b.type = 'button'; b.className = 'pl-chk'; b.setAttribute('aria-label', '標記這一步做完了')
      const paint = () => { const on = done.has(id); li.classList.toggle('pl-done', on); b.setAttribute('aria-pressed', on); b.title = on ? '已完成（再按取消）' : '做完了就點一下' }
      b.onclick = () => { done.has(id) ? done.delete(id) : done.add(id); store.set(K('chk'), [...done]); paint() }
      li.prepend(b); paint()
    })
  })
  const firstSteps = $('#p5 ol.steps')
  if (firstSteps) firstSteps.insertAdjacentHTML('beforebegin', '<p class="pl-hint">做完一步，點左邊的數字打勾（只存在這台裝置）</p>')

  // ── 截圖放大 ──
  const shots = $$('figure img', doc)
  const lb = document.createElement('div'); lb.className = 'pl-lb'; lb.hidden = true; lb.setAttribute('role', 'dialog'); lb.setAttribute('aria-label', '截圖放大')
  lb.innerHTML = '<figure><img alt=""><figcaption></figcaption></figure><button type="button" class="x" aria-label="關閉">×</button><button type="button" class="pv" aria-label="上一張">‹</button><button type="button" class="nx" aria-label="下一張">›</button>'
  body.append(lb)
  let li = 0, back = null
  const show = i => { li = (i + shots.length) % shots.length; const im = shots[li], cap = im.closest('figure').querySelector('figcaption'); $('img', lb).src = im.src; $('img', lb).alt = im.alt; $('figcaption', lb).textContent = cap ? cap.textContent : im.alt }
  const openLb = i => { back = document.activeElement; show(i); lb.hidden = false; $('.x', lb).focus() }
  const closeLb = () => { lb.hidden = true; back && back.focus() }
  shots.forEach((im, i) => { im.tabIndex = 0; im.setAttribute('role', 'button'); im.title = '點一下放大'; im.onclick = () => openLb(i); im.onkeydown = e => { if (e.key === 'Enter') openLb(i) } })
  $('.x', lb).onclick = closeLb; $('.pv', lb).onclick = () => show(li - 1); $('.nx', lb).onclick = () => show(li + 1)
  lb.onclick = e => { if (e.target === lb) closeLb() }
  addEventListener('keydown', e => { if (lb.hidden) return; if (e.key === 'Escape') closeLb(); if (e.key === 'ArrowLeft') show(li - 1); if (e.key === 'ArrowRight') show(li + 1) })

  // 捲到才觸發（只觸發一次）
  // 不用 IntersectionObserver：內文有 CSS zoom，Chrome 的 IntersectionObserver 在 zoom 底下常常不觸發；改成捲動時自己量
  const watch = []
  const seeCheck = () => { for (let i = watch.length - 1; i >= 0; i--) { const [el, fn, ratio] = watch[i], r = el.getBoundingClientRect(), vis = Math.min(r.bottom, innerHeight) - Math.max(r.top, 0); if (r.height && vis >= Math.min(r.height, innerHeight) * ratio) { watch.splice(i, 1); fn() } } }
  let seeT; addEventListener('scroll', () => { clearTimeout(seeT); seeT = setTimeout(seeCheck, 30) }, { passive: true }); addEventListener('resize', seeCheck)
  const onSee = (el, fn, ratio = 0.45) => { watch.push([el, fn, ratio]); setTimeout(seeCheck, 0) }
  const playBtn = (label, onDark) => { const b = document.createElement('button'); b.type = 'button'; b.className = 'pl-play-btn' + (onDark ? ' on-dark' : ''); b.textContent = label; return b }

  // ── 第 2 頁：點講義，對到做出來的測驗；食譜多一行 ──
  $$('.flow3', doc).forEach(f => {
    const [inP, outP] = $$('.papers', f), card = $('.mini-card', f)
    if (!inP || !outP) return
    const ins = $$('.paper', inP), outs = $$('.paper', outP)
    const pick = i => { [ins, outs].forEach(g => g.forEach((p, k) => p.classList.toggle('pl-on', k === i))); [inP, outP].forEach(g => g.classList.toggle('pl-dim', i >= 0)); card && card.classList.toggle('pl-on', i >= 0) }
    ins.concat(outs).forEach((p, k) => { const i = k % ins.length; p.tabIndex = 0; p.setAttribute('role', 'button'); p.onmouseenter = p.onfocus = () => pick(i); p.onmouseleave = p.onblur = () => pick(-1); p.onclick = () => pick(i) })
    const hint = document.createElement('p'); hint.className = 'pl-hint'; hint.textContent = touch ? '點一份講義：換哪份講義，都用同一份食譜做' : '把滑鼠移到講義上：換哪份講義，都用同一份食譜做'
    f.before(hint)
    if (!reduce) onSee(f, async () => { for (let i = 0; i < ins.length; i++) { pick(i); await wait(650) } pick(-1) }, 0.6)
  })
  $$('.revise', doc).forEach(r => {
    if (reduce) return
    r.classList.add('pl-pre')
    const run = async () => { r.classList.add('pl-pre'); await wait(400); r.classList.remove('pl-pre'); r.classList.add('pl-flash'); await wait(900); r.classList.remove('pl-flash') }
    onSee(r, run, 0.6)
    const b = playBtn('↻ 再加一次'); b.style.marginTop = '2mm'; b.onclick = run; $('.revise-txt', r).append(b)
  })

  // ── 第 3 頁：名字／描述／做法／附件 對照；Claude 怎麼挑食譜 ──
  $$('.anatomy', doc).forEach(a => {
    const parts = $$('.part', a), labels = $$('.labels > div', a)
    const hl = i => { a.classList.toggle('pl-hl', i >= 0); parts.forEach((p, k) => p.classList.toggle('pl-on', k === i)); labels.forEach((l, k) => l.classList.toggle('pl-on', k === i)) }
    ;[parts, labels].forEach(g => g.forEach((el, i) => { el.tabIndex = 0; el.onmouseenter = el.onfocus = () => hl(i); el.onmouseleave = el.onblur = () => hl(-1); el.onclick = () => hl(i) }))
    const hint = document.createElement('p'); hint.className = 'pl-hint'; hint.textContent = touch ? '點一段說明，食譜會標出是哪一塊' : '把滑鼠移到右邊的說明，左邊的食譜會標出是哪一塊'
    a.before(hint)
  })
  $$('.flow4', doc).forEach(f => {
    const steps = $$(':scope > div:not(.ar)', f), shelf = f.nextElementSibling && f.nextElementSibling.classList.contains('shelf') ? f.nextElementSibling : null
    if (!shelf) return
    const cards = $$('.mini-card', shelf), target = cards.findIndex(c => c.classList.contains('on'))
    let running = false
    const play = async () => {
      if (running) return; running = true; b.disabled = true
      shelf.classList.add('pl-play'); cards.forEach(c => c.classList.remove('pl-scan', 'pl-pick'))
      const on = i => steps.forEach((s, k) => s.classList.toggle('pl-on', k === i))
      on(0); await wait(900)
      on(1); for (const c of cards) { c.classList.add('pl-scan'); await wait(520); c.classList.remove('pl-scan') }
      on(2); cards[target] && cards[target].classList.add('pl-pick'); await wait(1100)
      on(3); await wait(1200)
      on(-1); running = false; b.disabled = false
    }
    const b = playBtn('▶ 看 Claude 怎麼挑食譜'); f.before(b); b.onclick = play
    if (!reduce) onSee(f, play, 0.7)
  })

  // ── 打字效果（第 4 頁的「只要打」、第 7 頁的對話框） ──
  const typeInto = async (el, text, speed = 75) => {
    const cur = el.querySelector('.cur')
    el.classList.add('pl-typing')
    const tn = document.createTextNode(''); [...el.childNodes].forEach(n => { if (n !== cur) n.remove() })
    if (cur && cur.textContent === '/') { cur.before(tn) } else el.prepend(tn)
    for (let i = 1; i <= text.length; i++) { tn.nodeValue = text.slice(0, i); await wait(speed) }
  }
  // 第 7 頁示意圖：打一句 → 右邊打開測驗
  $$('.callflow', doc).forEach(cf => {
    const input = $('.input', cf), quiz = $('.cf-quiz', cf), bar = $('.cf-prog i', cf), opts = $$('.cf-o', cf)
    if (!input) return
    const full = [...input.childNodes].filter(n => !(n.classList && n.classList.contains('cur'))).map(n => n.textContent).join('')
    opts.forEach(o => { o.tabIndex = 0; o.setAttribute('role', 'button'); o.onclick = () => opts.forEach(x => x.classList.toggle('pl-on', x === o)) })
    const run = async () => {
      if (reduce) return
      b.disabled = true; cf.classList.add('pl-pre'); opts.forEach(x => x.classList.remove('pl-on')); if (bar) bar.style.width = '0'
      await typeInto(input, full); await wait(350)
      cf.classList.remove('pl-pre'); await wait(400); if (bar) bar.style.width = '10%'
      b.disabled = false
    }
    const b = playBtn('▶ 播放示意'); cf.before(b); b.onclick = run
    if (!reduce) { cf.classList.add('pl-pre'); onSee(cf, run, 0.6) }
  })
  // 第 7 頁「/」示意圖：打 /handout → 跳出清單
  $$('.mock', doc).filter(m => $('.menu', m) && $('.input', m) && !m.closest('.callflow')).forEach(m => {
    const input = $('.input', m), cur = $('.cur', input), rest = [...input.childNodes].filter(n => n !== cur).map(n => n.textContent).join('')
    const run = async () => {
      if (reduce) return
      m.classList.add('pl-pre'); [...input.childNodes].forEach(n => { if (n !== cur) n.remove() }); cur.textContent = ''
      await wait(300); cur.textContent = '/'; await wait(450); m.classList.remove('pl-pre'); await wait(250)
      const tn = document.createTextNode(''); input.append(tn)
      for (let i = 1; i <= rest.length; i++) { tn.nodeValue = rest.slice(0, i); await wait(90) }
    }
    const b = playBtn('▶ 播放示意'); m.before(b); b.onclick = run
    if (!reduce) { m.classList.add('pl-pre'); onSee(m, run, 0.7) }
  })
  $$('.compare .after .say', doc).forEach(s => { if (reduce) return; const t = s.textContent; onSee(s, async () => { s.textContent = ''; const c = document.createElement('span'); c.className = 'cur'; c.textContent = '｜'; s.append(c); await typeInto(s, t, 90); await wait(1200); c.remove() }, 0.8) })

  // ── 第 11 頁：鍵盤真的會亮 ──
  $$('.keys', doc).forEach(k => {
    const kbds = $$('kbd', k), pg = k.closest('.pdfpage')
    const hint = document.createElement('p'); hint.className = 'pl-hint'; hint.textContent = '在你的鍵盤上按按看：A、X、空白鍵、方向鍵、1'
    k.before(hint)
    const map = key => {
      key = key.length === 1 ? key.toUpperCase() : key
      return kbds.filter((kb, i) => {
        const t = kb.textContent.trim()
        if (t === key) return true
        if (t === '空白鍵' && key === ' ') return true
        if (t === '←' && key === 'ArrowLeft') return true
        if (t === '→' && key === 'ArrowRight') return true
        const nx = kbds[i + 1], pv = kbds[i - 1]   // A–D、1–4：中間的字也算
        if (nx && kb.nextSibling && kb.nextSibling.nodeValue === '–' && key.length === 1 && key >= t && key <= nx.textContent.trim()) return true
        if (pv && kb.previousSibling && kb.previousSibling.nodeValue === '–' && key.length === 1 && key >= pv.textContent.trim() && key <= t) return true
        return false
      })
    }
    const visible = () => { const r = k.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight }
    addEventListener('keydown', e => {
      if (!visible() || !lb.hidden || e.target.closest('input, textarea, [contenteditable]') || e.metaKey || e.ctrlKey || e.altKey) return
      const hit = map(e.key); if (!hit.length) return
      if (e.key === ' ' || e.key.startsWith('Arrow')) e.preventDefault()
      hit.forEach(kb => { kb.classList.add('pl-on'); setTimeout(() => kb.classList.remove('pl-on'), 220) })
    })
  })

  // ── 常見問題、卡住時：一題一題收起來，問題看得到，點了展開 ──
  $$('.faq', doc).forEach(f => {
    const items = $$(':scope > div', f)
    items.forEach(d => {
      const det = document.createElement('details'), sum = document.createElement('summary'), ans = document.createElement('div'); ans.className = 'pl-ans'
      const q = d.querySelector('h3') || d.querySelector('b')
      sum.textContent = q.textContent; q.remove()
      ;[...d.childNodes].forEach(n => ans.append(n))
      det.append(sum, ans); d.replaceWith(det)
    })
    const tools = document.createElement('div'); tools.className = 'pl-faqtools'
    tools.innerHTML = '<button type="button">全部展開</button><button type="button">全部收起</button>'
    const [o, c] = $$('button', tools); o.onclick = () => $$('details', f).forEach(d => d.open = true); c.onclick = () => $$('details', f).forEach(d => d.open = false)
    f.before(tools)
  })

  // ── 第 13 頁：想一件你常做的事，勾勾看 ──
  $$('.fit', doc).filter(f => /適合/.test(($('.yes h3', f) || {}).textContent || '') && ($('.yes h3', f).textContent.trim() === '適合')).forEach(f => {
    f.classList.add('pl-check')
    const yes = $$('.yes li', f), no = $$('.no li', f), lead = f.closest('.pdfpage').querySelector('.lead .em')
    const all = yes.concat(no), saved = store.get(K('fit'), [])
    const paint = () => {
      const y = yes.filter(l => l.getAttribute('aria-checked') === 'true').length, n = no.filter(l => l.getAttribute('aria-checked') === 'true').length
      $('.yes', f).classList.toggle('pl-win', y === yes.length && !n); $('.no', f).classList.toggle('pl-win', n > 0)
      lead && lead.classList.toggle('pl-win', y === yes.length && !n)
      store.set(K('fit'), all.map(l => l.getAttribute('aria-checked') === 'true'))
    }
    all.forEach((l, i) => { l.setAttribute('role', 'checkbox'); l.setAttribute('aria-checked', !!saved[i]); l.tabIndex = 0
      const t = () => { l.setAttribute('aria-checked', l.getAttribute('aria-checked') !== 'true'); paint() }
      l.onclick = t; l.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); t() } } })
    const hint = document.createElement('p'); hint.className = 'pl-hint'; hint.textContent = '想一件你常做的事，把符合的勾起來：左邊四項全中、右邊都沒中，就適合做成 Skill'
    f.before(hint); paint()
  })

  // ── 完成本課（pd-done，跟首頁共用） ──
  const DONE = () => store.get('pd-done', [])
  const isDone = () => DONE().includes(ID)
  const setDone = on => { let d = DONE().filter(x => x !== ID); if (on) d.push(ID); store.set('pd-done', d); paintDone() }
  const paintDone = () => { const on = isDone(); body.classList.toggle('pl-finished', on); $$('[data-done]').forEach(b => { b.setAttribute('aria-pressed', on); b.textContent = on ? '已完成本課（再按取消）' : '完成本課' }) }

  // 第 15 頁：做到這三件
  const passH = $$('h2', doc).find(h => /做到這.*件/.test(h.textContent))
  const passUl = passH && passH.nextElementSibling && passH.nextElementSibling.matches('ul') ? passH.nextElementSibling : null
  if (passUl) {
    passUl.classList.add('pl-pass')
    const items = $$('li', passUl), saved = store.get(K('pass'), [])
    const box = document.createElement('div'); box.className = 'pl-donebox'
    box.innerHTML = '<span class="msg"></span><button type="button" class="pl-btn sm line" data-done>完成本課</button>'
    passUl.after(box)
    const paint = () => { const n = items.filter(l => l.getAttribute('aria-checked') === 'true').length; box.classList.toggle('all', n === items.length); $('.msg', box).textContent = n === items.length ? '三件都做到了，可以標記完成。' : `勾起你已經做到的（${n} / ${items.length}）`; store.set(K('pass'), items.map(l => l.getAttribute('aria-checked') === 'true')) }
    items.forEach((l, i) => { l.setAttribute('role', 'checkbox'); l.setAttribute('aria-checked', !!saved[i]); l.tabIndex = 0
      const t = () => { l.setAttribute('aria-checked', l.getAttribute('aria-checked') !== 'true'); paint(); if (items.every(x => x.getAttribute('aria-checked') === 'true') && !isDone()) setDone(true) }
      l.onclick = t; l.onkeydown = e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); t() } } })
    paint()
  }
  // 考考你：點選項才看答案
  $$('.quiz', doc).forEach(q => {
    const opts = $$('ol > li', q), ans = $('.ans', q)
    const m = ans && ans.textContent.match(/答案[：:]\s*([A-Z])/)
    if (!m) return
    const right = m[1].charCodeAt(0) - 65
    const pick = i => {
      q.classList.add('pl-answered')
      opts.forEach((o, k) => { o.classList.toggle('pl-right', k === right); o.classList.toggle('pl-wrong', k === i && i !== right); o.removeAttribute('tabindex') })
      btn.remove(); store.set(K('quiz'), i)
    }
    opts.forEach((o, i) => { o.tabIndex = 0; o.setAttribute('role', 'button'); o.onclick = () => { if (!q.classList.contains('pl-answered')) pick(i) }; o.onkeydown = e => { if (e.key === 'Enter' && !q.classList.contains('pl-answered')) pick(i) } })
    const btn = document.createElement('button'); btn.type = 'button'; btn.className = 'pl-quizbtn'; btn.textContent = '直接看答案'
    btn.onclick = () => pick(-1); ans.before(btn)
    const s = store.get(K('quiz'), null); if (s !== null) pick(s)
  })
  // 最後一頁：完成、下載
  const lastPg = pages[pages.length - 1], cta = $('.end-cta', lastPg)
  if (cta) {
    const fin = document.createElement('div'); fin.className = 'pl-fin'
    fin.innerHTML = `<button type="button" class="pl-btn" data-done>完成本課</button><a class="pl-btn line" href="${esc(M.pdf)}" download="${esc(M.pdfName)}">下載這課 PDF</a><span class="note-done">已記在這台裝置，學習地圖會同步顯示。</span>`
    cta.before(fin)
  }
  $$('[data-done]').forEach(b => b.onclick = () => setDone(!isDone()))
  paintDone()

  // 進場：每頁的大區塊捲到才淡入
  if (!reduce) {
    const els = $$('.pdfpage:not(.cover) > :is(.flow3, .revise, .anatomy, .flow4, .shelf, .compare, .three, .cards, .callflow, .warnbox, .steps3, .ab, .fit, .ex, .end-cta, .next, figure, .row)', doc)
    els.forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('pl-reveal'); onSee(el, () => el.classList.add('pl-in'), 0.08) } })
  }

  // ── 名詞小卡：正文第一次出現的名詞加點線底線（不碰提示詞、示意圖、標題） ──
  if (window.GLOSSARY) {
    const names = []
    GLOSSARY.forEach(t => {
      const base = t.term.replace(/[（(].*?[）)]\s*$/, '').trim(), inner = (t.term.match(/[（(](.*?)[）)]\s*$/) || [])[1]
      ;[base, ...(inner && /[A-Za-z]/.test(inner) && inner.length >= 3 ? [inner] : []), ...(t.alias || [])].forEach(n => { if (n && n.length >= 2) names.push([n, t]) })
    })
    names.sort((x, y) => y[0].length - x[0].length)
    const byName = new Map(); names.forEach(([n, t]) => { if (!byName.has(n)) byName.set(n, t) })
    const src = [...byName.keys()].map(n => { const e = n.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return /[A-Za-z]/.test(n) ? `(?<![A-Za-z-])${e}(?![A-Za-z-])` : e }).join('|')
    const re = new RegExp(src, 'g'), has = new RegExp(src), used = new Set()
    textNodes(doc, has, 'A,BUTTON,SUMMARY,H1,H2,KBD,.prompt,.mock,.path,.cover,.pl-chhead,.pl-key,figure,.mini-card,.paper,.say,.part,.refs,.pl-hint,.pl-resume,.toc').forEach(n => {
      const s = n.nodeValue, frag = document.createDocumentFragment(); let lastI = 0
      s.replace(re, (m, i) => {
        const t = byName.get(m); if (!t || used.has(t.term)) return m
        used.add(t.term); frag.append(s.slice(lastI, i))
        const b = document.createElement('button'); b.type = 'button'; b.className = 'gl'; b.textContent = m; b.dataset.term = t.term; b.setAttribute('aria-haspopup', 'dialog')
        frag.append(b); lastI = i + m.length; return m
      })
      if (!lastI) return; frag.append(s.slice(lastI)); n.replaceWith(frag)
    })
    const byTerm = new Map(GLOSSARY.map(t => [t.term, t]))
    const pop = document.createElement('div'); pop.className = 'glpop'; pop.setAttribute('role', 'dialog'); pop.hidden = true; body.append(pop)
    let anchor = null
    const closePop = () => { pop.hidden = true; anchor && anchor.setAttribute('aria-expanded', 'false'); anchor = null }
    const openPop = b => {
      const t = byTerm.get(b.dataset.term)
      pop.innerHTML = `<p class="t"><b>${esc(t.term)}</b><span class="en">${esc(t.en || '')}</span></p><p>${esc(t.plain)}</p><p class="go"><a href="glossary.html#${encodeURIComponent(t.term)}">AI 名詞小字典</a></p><button type="button" class="x" aria-label="關閉">×</button>`
      pop.hidden = false; anchor = b; b.setAttribute('aria-expanded', 'true')
      const r = b.getBoundingClientRect(), w = Math.min(340, innerWidth - 24)
      pop.style.width = w + 'px'; pop.style.left = Math.max(12, Math.min(r.left, innerWidth - w - 12)) + scrollX + 'px'; pop.style.top = r.bottom + 8 + scrollY + 'px'
      $('.x', pop).onclick = closePop
    }
    $$('.gl', doc).forEach(b => b.onclick = e => { e.stopPropagation(); anchor === b ? closePop() : openPop(b) })
    document.addEventListener('click', e => { if (!pop.hidden && !pop.contains(e.target)) closePop() })
    addEventListener('keydown', e => { if (e.key === 'Escape') closePop() })
  }

  document.fonts && document.fonts.ready.then(scan)
  scan()
  if (location.hash) { const t = $(location.hash); t && setTimeout(() => t.scrollIntoView({ block: 'start' }), 60) }
})()
