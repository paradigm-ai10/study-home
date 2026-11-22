// 一章一翻試做（2026-11-16，Thomas：五章就翻五次；形式用 C「讀完才翻」；重點整理叫 Take home message，五行內）
// 畫面：封面＋每章一個畫面。章內照樣往下捲；捲到章末才看到這章的 Take home message 和「下一章」鈕（讀到才解鎖）。
// Take home message 的字全部來自 PDF：每節的「這段重點」（粗）＋那節開頭第一句（沒有就用那節標題），最多五行。
// 由 pdf-chapter.js 呼叫，載入順序：pdf-chapter-core.js → pdf-chapter.js。
window.PLCHAPTER = {
  build(o) {
    const { doc, CH, esc, $, $$, reduce, label, after } = o
    const C = CH.length, screens = []
    const mk = cls => { const d = document.createElement('div'); d.className = 'pl-screen ' + cls; d.tabIndex = -1; return d }
    const txt = el => { if (!el) return ''; const c = el.cloneNode(true); if (c.matches('.pl-key')) { const lb = c.querySelector(':scope > span'); lb && lb.remove() } return c.textContent.replace(/\s+/g, ' ').trim() }
    const firstSentence = s => { const m = s.match(/^.*?[。！？]/); return (m ? m[0] : s).trim() }

    // 封面：第一個章開頭之前的東西
    const first = $('.pl-chhead', doc), cov = mk('s-cover')
    doc.insertBefore(cov, doc.firstChild)
    while (cov.nextSibling && cov.nextSibling !== first) cov.append(cov.nextSibling)
    screens.push({ el: cov, kind: 'cover' })
    CH.forEach(c => {
      const head = $('#ch-' + c.k), s = mk('s-chap'); head.before(s); s.append(head)
      c.pages.forEach(p => s.append(p))
      screens.push({ el: s, kind: 'ch', ch: c })
    })
    const lastS = screens[screens.length - 1].el
    while (lastS.nextSibling) lastS.append(lastS.nextSibling)

    // 章開頭：大編號、章名、說明、這章的幾節（可點）
    screens.forEach(s => {
      if (s.kind !== 'ch') return
      const c = s.ch
      $('.pl-chhead', s.el).innerHTML = `<div class="pl-chtitle"><span class="no">${String(c.i + 1).padStart(2, '0')}</span><div><small>第 ${c.i + 1} 章／共 ${C} 章</small><b>${esc(c.t)}</b><span>${esc(c.d)}</span></div></div>
        <ol class="pl-chips">${c.pages.map((p, j) => `<li><a href="#p${p.dataset.n}"><span>${j + 1}</span>${esc(label(p))}</a></li>`).join('')}</ol>`
    })

    // 章末：Take home message ＋ 翻到下一章
    screens.forEach((s, i) => {
      if (s.kind === 'cover') {
        const nav = document.createElement('nav'); nav.className = 'pl-flipnav'; nav.setAttribute('aria-label', '翻頁')
        nav.innerHTML = `<span></span><span></span><button type="button" class="pl-next" data-go="1"><span>開始第 1 章：${esc(CH[0].t)}</span><b aria-hidden="true">→</b></button>`
        s.el.append(nav); return
      }
      const c = s.ch
      const lines = c.pages.map(p => {
        const key = txt($('.pl-key', p)); if (!key) return null
        const lead = $('p.lead', p), h = $('h1', p)
        // 每行＝那節的標題（問題）＋「這段重點」（答案）；標題跟重點一樣時只留重點
        const sub = h ? txt(h) : lead ? firstSentence(txt(lead)) : ''
        return { key, sub: sub && sub !== key ? sub : '' }
      }).filter(Boolean).slice(0, 5)
      if (lines.length) {
        const card = document.createElement('aside'); card.className = 'pl-takehome'; card.setAttribute('aria-label', `第 ${c.i + 1} 章 Take home message`)
        card.innerHTML = `<p class="th-h"><b>Take home message</b><span>第 ${c.i + 1} 章｜${esc(c.t)}</span></p>
          <ol>${lines.map(l => `<li>${l.sub ? `<span>${esc(l.sub)}</span>` : ''}<b>${esc(l.key)}</b></li>`).join('')}</ol>`
        s.el.append(card)
      }
      const nx = screens[i + 1], pv = screens[i - 1]
      const nav = document.createElement('nav'); nav.className = 'pl-flipnav' + (nx ? ' locked' : ''); nav.setAttribute('aria-label', '翻頁')
      nav.innerHTML = `<button type="button" class="pl-prev" data-go="${i - 1}">← ${pv.kind === 'cover' ? '封面' : '上一章：' + esc(pv.ch.t)}</button>
        <span class="pl-where">${CH.map((_, j) => `<i class="${j < c.i ? 'past' : j === c.i ? 'now' : ''}"></i>`).join('')}<small>第 ${c.i + 1} 章／共 ${C} 章</small></span>
        ${nx ? `<button type="button" class="pl-next" data-go="${i + 1}"><span>下一章：${esc(nx.ch.t)}</span><b aria-hidden="true">→</b></button>` : '<span></span>'}`
      s.el.append(nav)
    })
    doc.addEventListener('click', e => { const b = e.target.closest('.pl-flipnav [data-go]'); if (b) show(+b.dataset.go, { focus: true }) })

    // 讀到章末才解鎖；還沒讀到時右下角提示
    const hint = document.createElement('div'); hint.className = 'pl-gatehint'; hint.setAttribute('aria-hidden', 'true'); hint.innerHTML = '讀完這章，往下就能翻到下一章 <b>↓</b>'; document.body.append(hint)
    const gate = () => {
      const s = screens[cur], nav = $(':scope > .pl-flipnav', s.el)
      const reached = nav.getBoundingClientRect().top < innerHeight - 30
      if (nav.classList.contains('locked') && reached) { nav.classList.remove('locked'); nav.classList.add('opened') }
      if (reached && s.kind === 'ch' && !s.read && scrollY > 40) { s.read = true; dispatchEvent(new CustomEvent('pl-chapter-read', { detail: { i: s.ch.i } })) }   // 讀到這章最後了（最後一章沒有鎖，也算）
      hint.classList.toggle('on', s.kind === 'ch' && nav.classList.contains('locked') && scrollY > 200)
    }
    addEventListener('scroll', gate, { passive: true }); addEventListener('resize', gate)

    // ── 翻 ──
    let cur = 0, busy = null
    const main = doc.closest('.pl-main') || doc
    const mainTop = () => main.getBoundingClientRect().top + scrollY
    const toTop = () => scrollTo({ top: mainTop(), behavior: 'instant' })
    const show = (i, opt = {}) => {
      i = Math.max(0, Math.min(screens.length - 1, i))
      const init = !screens.some(s => s.el.dataset.on)
      if (!init && i === cur) { if (!opt.noScroll) toTop(); return }
      if (busy) busy()
      const old = screens[cur], nw = screens[i], dir = i > cur ? 1 : -1
      screens.forEach((s, k) => { if (k !== i) delete s.el.dataset.on; if (k !== i && k !== cur) s.el.hidden = true })
      nw.el.hidden = false; nw.el.dataset.on = '1'
      if (!opt.noScroll) toTop()
      cur = i
      if (!init && !opt.quick && !reduce && old !== nw) {
        old.el.classList.add('leaving'); old.el.style.top = '0px'
        const as = [old.el.animate([{ opacity: 1, transform: 'translateY(0)' }, { opacity: 0, transform: `translateY(${dir > 0 ? -16 : 16}px)` }], { duration: 260, easing: 'ease-in', fill: 'forwards' }),
                    nw.el.animate([{ opacity: 0, transform: `translateY(${dir > 0 ? 22 : -22}px)` }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, delay: 160, easing: 'cubic-bezier(.22,.8,.24,1)', fill: 'backwards' })]
        const done = () => { busy = null; as.forEach(a => a.cancel()); old.el.classList.remove('leaving'); old.el.style.cssText = ''; if (screens[cur] !== old) old.el.hidden = true }
        busy = done; Promise.all(as.map(a => a.finished)).then(() => busy === done && done(), () => {})
      } else if (old !== nw) old.el.hidden = true
      if (!opt.noScroll) setTimeout(toTop, 0)
      if (opt.focus) nw.el.focus({ preventScroll: true })
      after(); setTimeout(gate, 60)
    }
    const idxOf = el => Math.max(0, screens.findIndex(s => s.el === el || s.el.contains(el)))
    const showEl = (el, opt = {}) => {
      const i = idxOf(el); show(i, { ...opt, noScroll: true })
      const s = screens[i]
      setTimeout(() => { if (el === s.el || el.matches('.pl-chhead') || (s.kind === 'cover' && el.matches('.pdfpage'))) toTop(); else scrollTo({ top: el.getBoundingClientRect().top + scrollY - 96, behavior: 'instant' }) }, 0)   // 96：讓開上面黏著的小螃蟹進度條
    }
    const visible = p => screens[cur].el.contains(p)

    // ── 小螃蟹進度：每章占一段，章裡依讀到第幾節、那節讀了多少往前走 ──
    const frac = () => {
      const s = screens[cur]; if (s.kind === 'cover') return 0
      const ps = s.ch.pages, L = ps.length, y = innerHeight * 0.35
      if (innerHeight + scrollY >= document.documentElement.scrollHeight - 4) return (s.ch.i + 1) / C
      let k = 0; ps.forEach((p, j) => { if (p.getBoundingClientRect().top < y) k = j })
      const r = ps[k].getBoundingClientRect(), w = Math.max(0, Math.min(1, (y - r.top) / Math.max(1, r.height)))
      return (s.ch.i + (k + w) / L) / C
    }
    const posOf = el => {
      const s = screens[idxOf(el)]; if (!s || s.kind === 'cover') return 0
      const j = s.ch.pages.indexOf(el.closest ? el.closest('.pdfpage') : null)
      return (s.ch.i + (j > 0 ? j / s.ch.pages.length : 0)) / C
    }
    const goTo = f => {
      const x = Math.max(0, Math.min(0.9999, f)) * C, ci = Math.floor(x), c = CH[ci], L = c.pages.length
      const r = (x - ci) * L, j = Math.min(L - 1, Math.floor(r)), w = r - j
      const i = screens.findIndex(s => s.ch === c)
      if (i !== cur) show(i, { quick: true, noScroll: true })
      const p = c.pages[j], top = p.getBoundingClientRect().top + scrollY
      scrollTo({ top: j === 0 && w < 0.02 ? mainTop() : top + w * p.getBoundingClientRect().height - innerHeight * 0.35 + 2, behavior: 'instant' })
    }
    return { screens, show, showEl, idxOf, visible, frac, posOf, goTo, get cur() { return cur } }
  }
}
