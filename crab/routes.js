/* 核心螃蟹：七個入口（三個版本共用）。改對應或連結只改這裡。
   part 是螃蟹身上的部位代號，每個版本的模型都要有同名的可點物件。
   href 還沒定的放 null：點了會先做轉場，再顯示「這頁還在做」。 */
window.CRAB_ROUTES = [
  { id: 'map',   part: 'shell',      zh: '學習地圖',      en: 'Learning map',      hint: '33 課照順序排好，從哪裡開始都看得到', href: null },
  { id: 'ask',   part: 'eyes',       zh: '你想學什麼',    en: 'What to learn',     hint: '說給我們聽，下一支片就做它',           href: null },
  { id: 'pick',  part: 'claw-left',  zh: '幫我挑',        en: 'Pick for me',       hint: '回答幾題，幫你挑從哪一課開始',         href: null },
  { id: 'solve', part: 'claw-right', zh: '解決一件事',    en: 'Solve one thing',   hint: '帶一件麻煩事來，一步步用 AI 做掉',     href: null },
  { id: 'words', part: 'legs',       zh: 'AI 名詞小字典', en: 'AI words',          hint: 'Skill、MCP、Agent，一句話講清楚',      href: null },
  { id: 'news',  part: 'bubbles',    zh: 'AI 新聞',       en: 'AI news',           hint: '每週整理好，學生也看得懂',             href: null },
  { id: 'free',  part: 'parcel',     zh: '領取資源',      en: 'Free stuff',        hint: 'skill 檔、PDF、提示詞，直接帶走',      href: null },
];

/* 學習站已開放課程頁的課（2026-11-13 課程地圖 v8.5：首版 20 課〔roadmap.json 的 first_release〕，目前有課程頁的 8 課：1-1、1-4、2-1、3-1、4-1、4-4、4-5、6-3；課號 v8.1→v8.5 沒變）。
   只放已經有頁面的課：放進來的課才會出現在首頁的路徑、下一步、程度評估；其餘首版課在地圖和清單上顯示「即將上線」。
   每課的網址放這裡（2026-11-12 課程頁寫好，全部接上；檔案在 網站/學習站/lessons/），首頁的「開始」按鈕、學習地圖、幫我挑都從這裡讀；還沒寫好的放 null，首頁會先給替代的下一步。
   網址相對於首頁資料夾（環境/f4-雨夜書桌/），或寫完整網址。 */
window.LESSON_PAGES = {
  '1-1': '../../../lessons/1-1.html',
  '1-4': '../../../lessons/1-4.html',
  '2-1': '../../../lessons/2-1.html',
  '3-1': '../../../lessons/3-1.html',
  '4-1': '../../../lessons/4-1.html',
  '4-4': '../../../lessons/4-4.html',
  '4-5': '../../../lessons/4-5.html',
  '6-3': '../../../lessons/6-3.html',
};
