/* 核心螃蟹：七個入口（三個版本共用）。改對應或連結只改這裡。
   part 是螃蟹身上的部位代號，每個版本的模型都要有同名的可點物件。
   href 還沒定的放 null：點了會先做轉場，再顯示「這頁還在做」。 */
window.CRAB_ROUTES = [
  { id: 'map',   part: 'shell',      zh: '學習地圖',      en: 'Learning map',      hint: '照階段與主題，一課一課排好', href: null },
  { id: 'ask',   part: 'eyes',       zh: '主題提案',    en: 'What to learn',     hint: '說給我們聽，下一支片就做它',           href: '../../../ask/index.html' },   // 2026-11-22 寫信給我們的那一頁
  { id: 'pick',  part: 'claw-left',  zh: '程度評估',        en: 'Pick for me',       hint: '回答幾題，幫你挑從哪一課開始',         href: null },
  { id: 'solve', part: 'claw-right', zh: '實作案例',    en: 'Solve one thing',   hint: '帶一件麻煩事來，一步步用 AI 做掉',     href: '../../../cases/index.html' },   // 2026-11-22 先放 6-1、6-E4 兩個案例
  { id: 'words', part: 'legs',       zh: 'AI 名詞辭典', en: 'AI words',          hint: 'Skill、MCP、Agent，一句話講清楚',      href: '../../../lessons/glossary.html' },
  { id: 'news',  part: 'bubbles',    zh: 'AI 新聞',       en: 'AI news',           hint: '每週整理好，學生也看得懂',             href: null },
  { id: 'free',  part: 'parcel',     zh: '資源下載',      en: 'Downloads',         hint: 'Skill 檔案、PDF 講義與提示詞範本',     href: '../../../resources/index.html' },   // 2026-11-14 資源頁做好；網址相對於首頁資料夾（rooms/f4/）
];

/* 哪些課已上線（window.LESSON_PAGES）不在這個檔了：2026-11-22 起由試算表決定，發布時產生在 ../roadmap8.js 的最後面。
   一堂課要上線：課程頁放 學習站/lessons/<課號>.html，試算表「課程」分頁那一列的網頁進度改成「已上線」，再按發布。 */
