// 全局目錄：33 課照建議順序排，分五段。順序只是建議，每課都能直接點進去；
// 「can」是學完能做到的一件事，讓已經會的人一眼就知道可以跳過。
window.STAGES = [
  {
    name: '起步：會用 AI 聊天',
    for: '還沒用過，或只問過幾次的人',
    lessons: [
      { id: 'what-is-ai', title: 'AI 到底是什麼', min: 4, can: '用一句話跟朋友解釋 AI 在做什麼' },
      { id: 'hallucination', title: '它會錯：幻覺與隨機', min: 4, can: '知道什麼時候不能直接相信它' },
      { id: 'tools-plans', title: '該用哪個 AI，免費版夠不夠', min: 5, can: '選好一個 AI，決定要不要付費' },
      { id: 'privacy', title: '什麼東西不要貼給 AI', min: 4, can: '分得出哪些資料可以給、哪些不行' },
      { id: 'first-chat', title: '把需求講清楚', min: 5, can: '一次就問到想要的答案' },
      { id: 'iterate', title: '追問、修改、拆小步', min: 4, can: '答案不對時，知道下一句該怎麼說' },
      { id: 'files-web', title: '丟檔案、丟圖、叫它查網路', min: 4, can: '讓它讀你的講義或照片再回答' },
      { id: 'examples', title: '給範例，比寫長 prompt 有用', min: 4, can: '貼一份範例，讓它照著格式寫' },
      { id: 'verify', title: '查證答案', min: 4, can: '花一分鐘確認它說的是真的' },
      { id: 'taiwan-zh', title: '讓它說台灣的中文', min: 3, can: '不再出現「視頻」「質量」' },
    ],
  },
  {
    name: '讓 AI 認識你',
    for: '天天在用，但每次都要重講自己是誰的人',
    lessons: [
      { id: 'instructions', title: '指令與記憶', min: 4, can: '讓它記住你的科系、偏好、說話方式' },
      { id: 'projects', title: 'Projects：一個主題一個房間', min: 5, can: '開一個放滿講義的讀書專案' },
      { id: 'restart', title: '對話變長就重開', min: 3, can: '知道它開始變笨的時候怎麼辦' },
      { id: 'files-out', title: '叫它直接給你檔案', min: 5, can: '拿到能打開的 Word、簡報、表格' },
      { id: 'artifacts', title: '叫它做一個小網頁', min: 5, can: '做出一個自己用的小工具' },
      { id: 'research', title: 'Research：讓它幫你查一小時', min: 4, can: '交出一份有出處的資料整理' },
      { id: 'office', title: '在 Excel、Word 裡用', min: 4, can: '不離開表格就讓它幫你整理' },
    ],
  },
  {
    name: '讓 AI 照你的方法做',
    for: '有幾件事每週都在重複做的人',
    lessons: [
      { id: 'split', title: '哪些事可以交給 AI', min: 4, can: '把一件工作拆成 AI 做和你做的部分' },
      { id: 'skills', title: 'Skills：把做法存起來', min: 6, page: 'skills.html', can: '說一句「出題」，它就照你的做法出題' },
      { id: 'connectors', title: '接上你的行事曆、雲端、信箱', min: 5, can: '問「我這週最忙哪天」，它看得到答案' },
      { id: 'chrome', title: '在 Chrome 裡用 Claude', min: 4, can: '讓它幫你點網頁、填表單' },
    ],
  },
  {
    name: '讓 AI 自己做事',
    for: '已經有 Project 和 Skill，想讓它自己跑的人',
    lessons: [
      { id: 'agent', title: '會自己動手的 AI', min: 5, can: '交代一件事，讓它自己做完' },
      { id: 'local-files', title: '讓它整理你電腦裡的檔案', min: 4, can: '一次整理好一整個資料夾' },
      { id: 'schedule', title: '排程：讓它每天自己跑', min: 5, can: '每天早上收到它整理好的東西' },
      { id: 'safety', title: '權限越大越要小心', min: 4, can: '設好它不能碰的東西' },
      { id: 'multi-agent', title: '同時派好幾個 AI', min: 4, can: '把一個大工作分給幾個 AI 一起做' },
      { id: 'claude-code', title: 'Claude Code：不會寫程式也能用', min: 6, can: '用講的叫它改你的檔案' },
      { id: 'vibe', title: '用講的做出網站', min: 5, can: '做出一個能分享給朋友的網頁' },
      { id: 'system', title: '建自己的系統', min: 6, can: '把前面學的串成每天在用的一套' },
    ],
  },
  {
    name: '阿糰的實戰案例',
    for: '想看完整做一次的人，任何時候都可以看',
    lessons: [
      { id: 'study-system', title: '讀書系統：共筆自動出題、錯題變 Anki', min: 8, can: '複製一套自己的讀書系統' },
      { id: 'reader', title: '共筆閱讀器：雙擊就解釋', min: 6, can: '讀共筆時卡住，點一下就有解釋' },
      { id: 'asset-site', title: '資產網站：帳戶整理成一頁', min: 7, can: '做一頁自己的資產總覽' },
      { id: 'photo-site', title: '攝影網站：旅行照片變作品集', min: 7, can: '把照片做成一個作品集網站' },
    ],
  },
]
// 給每課一個全站編號
{ let n = 0; STAGES.forEach(s => s.lessons.forEach(l => { l.n = ++n })) }
