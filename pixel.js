// 像素場景：照 crab-desk 的畫法（一格一個方塊、SVG 內建動畫），改成白天、奶油色系。
// 主角是 paradigm-panel 那隻像素阿糰。
const PAL = {
  C: '#FF6B57', c: '#e0523f', // 阿糰
  K: '#3A2E5C', // 葡萄：眼睛、線條
  Y: '#FFC857', y: '#f0b23a', // 陽光
  W: '#FFFBF2', w: '#FFF4E0', // 奶油
  S: '#cfe9f5', s: '#e6f4fa', // 天空
  B: '#7fc8e8', b: '#5fb3d9', // 海、螢幕
  G: '#9fd48a', g: '#7bbf68', // 草
  T: '#f3dcae', t: '#e7c993', // 沙、桌面
  D: '#b98a63', d: '#9a6e4b', // 木頭
  P: '#d9cfee', // 淡紫
  R: '#ffb3a7', // 淡珊瑚
}

const CRITTER = ['.CCCCCC.', 'CCKCCKCC', 'CCCCCCCC', 'cCCCCCCc', '.c.c.c.c']
const CRITTER_BLINK = ['.CCCCCC.', 'CCCCCCCC', 'CCCCCCCC', 'cCCCCCCc', '.c.c.c.c']

const wiggle = d => `<animateTransform attributeName="transform" type="translate" values="-0.5,0;0.5,0" dur="${d}" calcMode="discrete" repeatCount="indefinite"/>`
const hop = (d, b = '0s') => `<animateTransform attributeName="transform" type="translate" values="0,0;0,0;0,-1;0,0" dur="${d}" begin="${b}" calcMode="discrete" repeatCount="indefinite"/>`
const blink = (v, d, b = '0s') => `<animate attributeName="opacity" values="${v}" dur="${d}" begin="${b}" calcMode="discrete" repeatCount="indefinite"/>`
const drift = (dx, d) => `<animateTransform attributeName="transform" type="translate" values="0,0;${dx},0;0,0" dur="${d}" repeatCount="indefinite"/>`

const fill = (x, y, w, h, ch, anim) => ({ x, y, rows: Array.from({ length: h }, () => ch.repeat(w)), anim })
const critter = (x, y, move = '') => [
  { x, y, rows: CRITTER, anim: move + blink('1;1;1;1;1;0', '3s') },
  { x, y, rows: CRITTER_BLINK, anim: move + blink('0;0;0;0;0;1', '3s') },
]
const cloud = (x, y, d) => ({ x, y, rows: ['..WWW...', '.WWWWWW.', 'WWWWWWWW'], anim: drift(6, d) })
const sun = (x, y) => [
  { x: x - 1, y: y - 1, rows: ['.Y...Y.', '.......', 'Y.....Y', '.......', '.Y...Y.'], anim: blink('1;0.35;1', '1.6s') },
  fill(x + 1, y, 3, 3, 'Y'),
]

function pixels(w, h, sprites, label = '') {
  const out = []
  for (const s of sprites) {
    const rects = []
    s.rows.forEach((row, ry) => [...row].forEach((ch, rx) => {
      if (PAL[ch]) rects.push(`<rect x="${s.x + rx}" y="${s.y + ry}" width="1.02" height="1.02" fill="${PAL[ch]}"/>`)
    }))
    out.push(s.anim ? `<g>${rects.join('')}${s.anim}</g>` : rects.join(''))
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" role="img" aria-label="${label}" preserveAspectRatio="xMidYMid slice">${out.join('')}</svg>`
}

// 每個主題一張 40×20 的小場景：天空＋地面＋道具＋阿糰
const room = (floor = 'T', top = 'S') => [fill(0, 0, 40, 14, top), fill(0, 14, 40, 6, floor), fill(0, 14, 40, 1, floor === 'T' ? 't' : 'g')]
const SCENES = {
  idea: () => pixels(40, 20, [...room('G'), cloud(3, 2, '7s'),
    fill(22, 3, 7, 7, 'Y', blink('1;0.75;1', '1.4s')), fill(24, 10, 3, 2, 'K'),
    { x: 21, y: 2, rows: ['.........', '.........'] },
    { x: 19, y: 4, rows: ['Y', '', '', 'Y'], anim: blink('1;0;1', '1s') }, { x: 31, y: 4, rows: ['Y', '', '', 'Y'], anim: blink('0;1;0', '1s') },
    ...critter(11, 9, hop('1.3s'))], '認識 AI'),
  chat: () => pixels(40, 20, [...room('G'),
    fill(17, 2, 13, 5, 'W'), { x: 18, y: 7, rows: ['WW'] }, { x: 19, y: 4, rows: ['K.K.K'], anim: blink('1;0.2;1', '0.9s') },
    fill(24, 8, 11, 4, 'P'), { x: 32, y: 12, rows: ['PP'] }, { x: 26, y: 9, rows: ['KKKKK', '', 'KKK'] },
    ...critter(7, 9, hop('1.1s'))], '會對話'),
  shelf: () => pixels(40, 20, [...room('T'),
    fill(22, 2, 14, 12, 'D'), fill(23, 3, 12, 3, 'w'), fill(23, 7, 12, 3, 'w'), fill(23, 11, 12, 2, 'w'),
    { x: 23, y: 3, rows: ['CC.YY.BB.PP', 'CC.YY.BB.PP', 'CC.YY.BB.PP'] }, { x: 24, y: 7, rows: ['GG.RR.YY', 'GG.RR.YY', 'GG.RR.YY'] },
    { x: 27, y: 11, rows: ['C'], anim: blink('1;0;1', '1.2s') },
    ...critter(8, 9, wiggle('0.5s'))], '讓 AI 記得你'),
  paper: () => pixels(40, 20, [...room('T'),
    fill(20, 3, 9, 11, 'W'), { x: 21, y: 5, rows: ['KKKKKK', '', 'KKKK', '', 'KKKKK'] },
    fill(28, 6, 9, 8, 'w'), { x: 29, y: 10, rows: ['...Y', '.C.Y', 'BC.Y'] , anim: blink('1;0.7;1', '1.5s')},
    ...critter(7, 9, wiggle('0.36s'))], '讓 AI 做出東西'),
  cards: () => pixels(40, 20, [...room('T'),
    fill(20, 8, 15, 6, 'D'), fill(20, 8, 15, 1, 'd'),
    fill(22, 3, 5, 6, 'W'), fill(28, 4, 5, 5, 'R'), { x: 23, y: 5, rows: ['KKK', '', 'KK'] },
    { x: 29, y: 1, rows: ['W'], anim: blink('1;0;1', '1.3s') },
    ...critter(8, 9, hop('1.5s'))], '把做法存起來'),
  cable: () => pixels(40, 20, [...room('G'), cloud(26, 1, '8s'),
    fill(28, 6, 8, 7, 'W'), fill(28, 6, 8, 2, 'C'), { x: 29, y: 9, rows: ['K.K.K', '', 'K.K'] },
    { x: 15, y: 11, rows: ['KKKKKKKKKKKKK'] }, { x: 27, y: 10, rows: ['K'] },
    { x: 17, y: 11, rows: ['Y'], anim: `<animateTransform attributeName="transform" type="translate" values="0,0;10,0" dur="1.4s" repeatCount="indefinite"/>` },
    ...critter(6, 9, '')], '接上你的資料'),
  clock: () => pixels(40, 20, [...room('T'),
    fill(25, 2, 9, 9, 'W'), fill(29, 3, 1, 4, 'K'), { x: 29, y: 6, rows: ['KKK'], anim: blink('1;0.4;1', '1s') },
    fill(4, 13, 32, 1, 'K'), { x: 6, y: 12, rows: ['YY'], anim: `<animateTransform attributeName="transform" type="translate" values="0,0;26,0" dur="3s" repeatCount="indefinite"/>` },
    ...critter(10, 7, hop('0.9s'))], '讓 AI 自己跑'),
  tools: () => pixels(40, 20, [...room('T'),
    fill(20, 6, 12, 7, 'K'), fill(21, 7, 10, 5, 'B', blink('1;0.8;1', '0.8s')), fill(19, 13, 14, 1, 'd'),
    { x: 22, y: 8, rows: ['WWW', '', 'WWWWW'] },
    { x: 34, y: 8, rows: ['DDD', '.D.', '.D.', '.D.'], anim: `<animateTransform attributeName="transform" type="rotate" values="0 35 11;-20 35 11;0 35 11" dur="0.6s" repeatCount="indefinite"/>` },
    ...critter(8, 9, wiggle('0.36s'))], '自己做工具'),
  study: () => pixels(40, 20, [...room('T'),
    fill(18, 11, 18, 3, 'D'), fill(20, 7, 7, 4, 'C'), fill(21, 8, 5, 2, 'W'), fill(28, 8, 6, 3, 'B'),
    { x: 30, y: 9, rows: ['WW'], anim: blink('1;0.3;1', '1.1s') },
    { x: 33, y: 2, rows: ['.G.', 'GGG', '.D.'] },
    ...critter(8, 9, wiggle('0.45s'))], '實戰案例'),
}

// 首頁大場景：白天的海邊小鎮，阿糰們各做各的
function heroScene() {
  const sp = [
    fill(0, 0, 120, 22, 's'), fill(0, 12, 120, 10, 'S'),
    ...sun(100, 4), cloud(14, 4, '12s'), cloud(52, 2, '15s'), cloud(76, 7, '10s'),
    fill(0, 20, 120, 4, 'B'), fill(0, 20, 120, 1, 'b'),
    { x: 8, y: 20, rows: ['WW....WW'], anim: drift(4, '3s') }, { x: 70, y: 21, rows: ['WWW'], anim: drift(-4, '4s') },
    fill(0, 24, 120, 12, 'T'), fill(0, 24, 120, 1, 't'),
    // 小書桌＋打字的阿糰
    fill(14, 27, 14, 2, 'D'), fill(15, 29, 1, 4, 'd'), fill(26, 29, 1, 4, 'd'),
    { x: 20, y: 23, rows: ['KKKKK', 'KBBBK', 'KKKKK'] }, { x: 21, y: 24, rows: ['W'], anim: blink('1;0;1', '0.5s') },
    ...critter(9, 26, wiggle('0.36s')),
    // 跳的阿糰＋旗子
    { x: 48, y: 18, rows: ['KCCCC', 'KCCC.', 'KC...', 'K....', 'K....', 'K....', 'K....', 'K....'] },
    ...critter(52, 26, hop('1.2s')),
    // 遮陽傘下看書
    { x: 78, y: 18, rows: ['..CWCWC..', '.CWCWCWC.', 'CWCWCWCWC', '....K....', '....K....', '....K....', '....K....', '....K....'] },
    ...critter(73, 28, ''), fill(81, 29, 5, 3, 'W'), fill(83, 29, 1, 3, 'K'),
    // 棕櫚樹
    { x: 103, y: 15, rows: ['.GG..GG.', 'GGGGGGGG', '...dd...', '...dd...', '...dd...', '...dd...', '...dd...', '...dd...', '...dd...', '...dd...', '...dd...'] },
    ...critter(94, 30, hop('1.6s', '0.5s')),
  ]
  return pixels(120, 36, sp, '阿糰們在海邊學 AI')
}

// 打勾（完成）：像素畫的小勾
const checkIcon = () => pixels(7, 6, [{ x: 0, y: 0, rows: ['......C', '.....CC', 'C...CC.', 'CC.CC..', '.CCC...', '..C....'] }], '已完成')

window.PIXEL = { SCENES, heroScene, checkIcon, pixels, fill, critter, cloud, sun, hop, wiggle, blink, drift, PAL,
  critterIcon: () => pixels(10, 6, critter(1, 0, hop('1.6s')), '阿糰') }
