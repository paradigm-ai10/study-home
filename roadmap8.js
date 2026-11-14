// 學習地圖 v8.5：3 階段、4 個角色、17 主題；必修 83 課、選修 54 課；首版 20 課（已有課程頁的看 核心螃蟹/routes.js 的 LESSON_PAGES）。
// 由 網站/學習站/make_roadmap8.py 從 研究/2026-11-11_AI學習總地圖/roadmap.json＋data/T*.json 產生，不要手改；正本改了就重跑。
// window.ROADMAP8：整張地圖（idmap＝舊課號對照）。window.STAGES：首頁進度與「程度評估」用（第一個角色的主題，只放首版開放的課）。
window.ROADMAP8 = {"idmap":{"1-E2":"1-E1","2-4":"5-2","2-5":"2-4","5-2":"5-3","5-3":"5-4","11-1":"12-1","11-2":"12-2","11-3":"12-3","11-4":"12-4","11-5":"12-5","11-E1":"12-E1","11-E2":"12-E2","11-E3":"12-E3","11-E4":"12-E4","12-1":"13-2","12-2":"13-3","12-3":"13-4","12-4":"13-1","12-E1":"13-E1","12-E2":"13-E2","12-E3":"13-E3","12-E4":"13-E4","13-1":"14-1","13-2":"14-2","13-3":"14-3","13-4":"14-4","13-5":"14-5","13-E1":"14-E1","13-E2":"14-E2","13-E3":"14-E3","14-1":"15-1","14-2":"15-2","14-3":"15-3","14-4":"15-4","14-5":"15-5","14-E1":"15-E1","14-E2":"15-E2","14-E3":"15-E3","15-1":"16-1","15-2":"16-2","15-3":"16-3","15-4":"16-4","15-E1":"16-E1","15-E2":"16-E2","15-E3":"16-E3","16-1":"17-1","16-2":"17-2","16-3":"17-3","16-5":"17-4","16-E1":"17-E1","16-E2":"17-E2","16-E3":"17-E3","5-5":"6-3","5-E2":"6-E2","5-E3":"6-E3","6-4":"7-4","6-E4":"7-E4","6-E5":"7-E5","7-5":"8-5","9-5":"10-5"},"version":"8.5","asof":"2026-11-13","title":"AI 學習地圖","sub":"從用 AI 提升個人產出，到做出網站、App 與影音作品，再把工具上線、交給使用者與團隊。","counts":{"stages":3,"topics":17,"required":83,"electives":54,"outcomes":17,"first_release":20},"first":["1-1","1-2","1-4","2-1","3-1","3-3","3-E2","4-1","4-2","4-4","4-5","5-1","5-2","6-1","6-3","6-E1","7-1","11-2","11-4","11-6"],"stages":[{"id":"s1","no":1,"name":"第一階段","tagline":"以 AI 提升個人產出","roles":["power-user"],"topics":["T1","T2","T3","T4","T5","T6","T7"]},{"id":"s2","no":2,"name":"第二階段","tagline":"以 AI 打造成品、工具與 Agent","roles":["builder","orchestrator"],"topics":["T8","T9","T10","T11","T12","T13"]},{"id":"s3","no":3,"name":"第三階段","tagline":"把 AI 工具上線，交給使用者與團隊","roles":["product-engineer"],"topics":["T14","T15","T16","T17"]}],"roles":[{"id":"power-user","name":"AI Power User","stage":1,"line":"能把 AI 用在讀書、研究與日常工作，並讓它自動處理重複的事","topics":["T1","T2","T3","T4","T5","T6","T7"]},{"id":"builder","name":"AI Builder","stage":2,"line":"實踐想法，做出產品：網站、SaaS、App 與影音作品","topics":["T8","T9","T10","T11"]},{"id":"orchestrator","name":"AI Orchestrator","stage":2,"line":"能設計 AI 系統，讓多個 Agent 與工具分工、自動完成整套工作","topics":["T12","T13"]},{"id":"product-engineer","name":"AI Product Engineer","stage":3,"line":"能把 AI 工具上線給使用者，並導入團隊","topics":["T14","T15","T16","T17"]}],"topics":[{"id":"T1","no":1,"name":"Claude 入門","stage":1,"role":"power-user","outcome":"用 Claude 完成一件本週的真實任務，記下它哪裡做對、哪裡出錯","count":6,"required":5,"electives":1,"lessons":[{"id":"1-1","title":"Claude 帳號註冊、安全設定與第一個任務","type":"必修","n":1},{"id":"1-2","title":"Chat、Cowork 與 Claude Code：每件事該用哪一個","type":"必修","n":2},{"id":"1-4","title":"辨認 AI 的錯：幻覺、附和與能力落差","type":"必修","n":3}],"all":[["1-1","Claude 帳號註冊、安全設定與第一個任務","必修"],["1-2","Chat、Cowork 與 Claude Code：每件事該用哪一個","必修"],["1-3","Claude 方案、模型與額度：Free、Pro、Effort 怎麼設","必修"],["1-4","辨認 AI 的錯：幻覺、附和與能力落差","必修"],["1-5","AI 使用守則：隱私設定與作業、工作標示","必修"],["1-E1","AI 原理入門：模型怎麼產生答案","選修"]]},{"id":"T2","no":2,"name":"Prompt 技巧","stage":1,"role":"power-user","outcome":"整理出 5 個自己常用的 Prompt 範本","count":4,"required":4,"electives":0,"lessons":[{"id":"2-1","title":"Prompt 四要素：一次講清楚需求","type":"必修","n":4}],"all":[["2-1","Prompt 四要素：一次講清楚需求","必修"],["2-2","Prompt 範例與角色：讓輸出照你的格式","必修"],["2-3","追問與修改：把初稿改成能交的版本","必修"],["2-4","寫作 Prompt：台灣用語、個人語氣、去除 AI 腔","必修"]]},{"id":"T3","no":3,"name":"AI 研究與查證","stage":1,"role":"power-user","outcome":"一份附來源、自己查證過的研究摘要","count":7,"required":5,"electives":2,"lessons":[{"id":"3-1","title":"檔案問答：PDF、講義、截圖只根據原文回答","type":"必修","n":5},{"id":"3-3","title":"AI 回答查證：三步驟抓出錯誤","type":"必修","n":6},{"id":"3-E2","title":"研究工具對照：Perplexity、Gemini Notebook","type":"選修","n":7}],"all":[["3-1","檔案問答：PDF、講義、截圖只根據原文回答","必修"],["3-2","網路搜尋：附來源並抽查正確性","必修"],["3-3","AI 回答查證：三步驟抓出錯誤","必修"],["3-4","Research 深入研究：完成一份有出處的報告","必修"],["3-5","AI 新聞判讀：分辨真突破與炒作","必修"],["3-E1","個人知識庫：用 Claude 整理讀書與工作筆記","選修"],["3-E2","研究工具對照：Perplexity、Gemini Notebook","選修"]]},{"id":"T4","no":4,"name":"Projects、Memory 與 Skills","stage":1,"role":"power-user","outcome":"為一門課或一項工作建好 Project，並做一個自己的 Skill","count":8,"required":5,"electives":3,"lessons":[{"id":"4-1","title":"個人化指令：設定你的背景與偏好","type":"必修","n":8},{"id":"4-2","title":"建立個人 Memory 系統","type":"必修","n":9},{"id":"4-4","title":"Skills 入門：呼叫、更新、自己做一個","type":"必修","n":10},{"id":"4-5","title":"建立自己的 Skill：把重複流程變成一句指令","type":"必修","n":11}],"all":[["4-1","個人化指令：設定你的背景與偏好","必修"],["4-2","建立個人 Memory 系統","必修"],["4-3","Projects 工作區：依課程或專案整理對話與檔案","必修"],["4-4","Skills 入門：呼叫、更新、自己做一個","必修"],["4-5","建立自己的 Skill：把重複流程變成一句指令","必修"],["4-E1","Plugins 安裝與管理","選修"],["4-E2","規則持續改善：把每次修正寫回 Skill 與 Project","選修"],["4-E3","Markdown 與文字檔基礎","選修"]]},{"id":"T5","no":5,"name":"Cowork 長任務與電腦操作","stage":1,"role":"power-user","outcome":"交辦 Cowork 完成一件要做 30 分鐘以上的整理工作，並檢查結果","count":5,"required":4,"electives":1,"lessons":[{"id":"5-1","title":"Cowork 入門：交辦一件要做很久的事","type":"必修","n":12},{"id":"5-2","title":"任務拆解：分步驟交辦大任務","type":"必修","n":13}],"all":[["5-1","Cowork 入門：交辦一件要做很久的事","必修"],["5-2","任務拆解：分步驟交辦大任務","必修"],["5-3","Cowork 委派單：寫清楚範圍與完成條件","必修"],["5-4","Claude in Chrome 與本機資料夾：讓 Claude 動手操作","必修"],["5-E1","Computer Use：讓 Claude 操作你的電腦","選修"]]},{"id":"T6","no":6,"name":"Connectors 與自動化","stage":1,"role":"power-user","outcome":"一個每天自動執行的排程任務，連續跑一週","count":6,"required":3,"electives":3,"lessons":[{"id":"6-1","title":"Connectors 入門：連接 Gmail、日曆與雲端硬碟","type":"必修","n":14},{"id":"6-3","title":"排程任務：建立每日自動晨報（含完成條件與檢查）","type":"必修","n":15},{"id":"6-E1","title":"在 Google 文件與 Office 裡使用 Claude","type":"選修","n":16}],"all":[["6-1","Connectors 入門：連接 Gmail、日曆與雲端硬碟","必修"],["6-2","Connector 安全設定：權限與提示詞注入防護","必修"],["6-3","排程任務：建立每日自動晨報（含完成條件與檢查）","必修"],["6-E1","在 Google 文件與 Office 裡使用 Claude","選修"],["6-E2","手機上的 Claude：行程、提醒與地點","選修"],["6-E3","會議流程自動化：從逐字稿到待辦","選修"]]},{"id":"T7","no":7,"name":"AI 工具比較與個人 Agent","stage":1,"role":"power-user","outcome":"定好自己的主力與輔助 AI 工具，寫下各自用在哪些事","count":9,"required":4,"electives":5,"lessons":[{"id":"7-1","title":"AI 工具比較：Claude、ChatGPT、Gemini 怎麼選","type":"必修","n":17}],"all":[["7-1","AI 工具比較：Claude、ChatGPT、Gemini 怎麼選","必修"],["7-2","個人 Agent 比較：Gemini Spark、ChatGPT Dots、Claude Duet","必修"],["7-3","AI 新名詞地圖：看懂 Prompt、Context、Loop 這些說法","必修"],["7-4","跨工具切換：搬移記憶與工作脈絡","必修"],["7-E1","Gemini 與 Google 全家桶","選修"],["7-E2","Microsoft Copilot 與 Office","選修"],["7-E3","Grok 與 X 即時資訊","選修"],["7-E4","中文與台灣模型：DeepSeek、Qwen、TAIDE","選修"],["7-E5","OpenClaw 開源個人 Agent 與風險","選修"]]},{"id":"T8","no":8,"name":"文件、簡報與 Artifact","stage":2,"role":"builder","outcome":"一份可以直接交出去的報告或簡報，加一個 Artifact 小工具","count":9,"required":5,"electives":4,"lessons":[],"all":[["8-1","Claude Docs 與 Word 報告：產出可交付文件","必修"],["8-2","簡報製作：Claude Slides 與 .pptx 檔","必修"],["8-3","試算表與資料分析：Claude Sheets、Excel 與圖表","必修"],["8-4","Artifact 入門：做出可分享的互動頁面","必修"],["8-5","成品交付檢查：先寫規格、交付前自我檢查","必修"],["8-E1","Claude Design 與 Whiteboards：設計稿與共同發想","選修"],["8-E2","Claude Data 儀表板：接上資料自動更新","選修"],["8-E3","進階 Artifact：儲存資料與呼叫 AI","選修"],["8-E4","Gamma 與 Canva：從大綱快速做簡報","選修"]]},{"id":"T9","no":9,"name":"AI 圖片與影片製作","stage":2,"role":"builder","outcome":"一支 30 秒內的短片或一組社群圖卡","count":8,"required":4,"electives":4,"lessons":[],"all":[["9-1","AI 生圖入門：依用途挑工具與寫圖片 Prompt","必修"],["9-2","圖片一致性：固定角色與風格","必修"],["9-3","AI 影片製作：生成片段並剪成短片","必修"],["9-4","AI 內容版權與標示：商用、肖像與 Deepfake","必修"],["9-E1","Claude 創作企劃：腳本、分鏡與品質檢查","選修"],["9-E2","AI 音樂：Suno 作曲與商用授權","選修"],["9-E3","AI 配音與聲音複製：ElevenLabs 與同意原則","選修"],["9-E4","Claude 接設計工具：Canva、Figma、Adobe","選修"]]},{"id":"T10","no":10,"name":"Claude Code 與 Vibe Coding","stage":2,"role":"builder","outcome":"一個自己會用的網站或小工具，分享給至少一個人試用","count":9,"required":5,"electives":4,"lessons":[],"all":[["10-1","Vibe Coding 入門：用描述做出第一個網站","必修"],["10-2","Claude Code 入門：桌面版 Code 分頁與第一個任務","必修"],["10-3","Claude Code 修改管理：核准、復原與存檔點","必修"],["10-4","Claude Code 工作流程：先計畫、再實作、最後驗證","必修"],["10-5","CLAUDE.md 與權限模式：設定專案規則","必修"],["10-E1","終端機與 Git 入門：版本存檔與 GitHub","選修"],["10-E2","Claude Code 額度管理：Context、Compact 與模型選擇","選修"],["10-E3","Claude Code 遠端工作：雲端 Session 與手機","選修"],["10-E4","其他 Vibe Coding 工具：Lovable、Cursor 對照","選修"]]},{"id":"T11","no":11,"name":"網站設計","stage":2,"role":"builder","outcome":"做出一個有自己風格的網站首頁，附參考來源、通過 AI slop 檢查，並且至少有 2D 動態或 3D 場景其中一種","count":19,"required":12,"electives":7,"lessons":[{"id":"11-2","title":"Reference 蒐集：用 Awwwards、Refero 找設計方向","type":"必修","n":18,"group":"Reference 尋找"},{"id":"11-4","title":"Design System 入門：色彩、字型與版面規則","type":"必修","n":19,"group":"設計方向與 Design System"},{"id":"11-6","title":"AI Slop 辨識：用 kill-ai-slop 找出 AI 感設計","type":"必修","n":20,"group":"AI Slop 檢查"}],"all":[["11-1","從想法到網站：需求、內容架構到第一版畫面","必修","從想法到網站"],["11-2","Reference 蒐集：用 Awwwards、Refero 找設計方向","必修","Reference 尋找"],["11-3","參考牆：把喜歡的網站整理成可比較的清單","必修","Reference 尋找"],["11-4","Design System 入門：色彩、字型與版面規則","必修","設計方向與 Design System"],["11-5","多版本選版：用 version-review 一次比較 5 版","必修","設計方向與 Design System"],["11-E1","Figma 與 Claude 串接","選修","設計方向與 Design System"],["11-E2","Landing Page 的結構與文案","選修","設計方向與 Design System"],["11-6","AI Slop 辨識：用 kill-ai-slop 找出 AI 感設計","必修","AI Slop 檢查"],["11-7","設計 Skills 審查：用 impeccable、design-taste 讓 AI 照設計規則做","必修","AI Slop 檢查"],["11-E3","手機版與破版測試：break-ui","選修","AI Slop 檢查"],["11-8","2D 動畫入門：Motion 與捲動效果","必修","2D 動態"],["11-9","動畫審查：分辨好的動畫和有 AI 感的動畫","必修","2D 動態"],["11-E4","像素風與插畫風：pixelfx","選修","2D 動態"],["11-10","3D 網頁入門：Three.js 場景、燈光與鏡頭","必修","3D 網頁"],["11-11","3D 模型製作：Blender 建模、烘焙與匯出 glTF","必修","3D 網頁"],["11-12","3D 效能與真機驗收：壓縮模型、在真的 GPU 上檢查","必修","3D 網頁"],["11-E5","Shader 效果：雨、霧、霓虹","選修","3D 網頁"],["11-E6","3D 地球與資料視覺化：globe-gl","選修","3D 網頁"],["11-E7","捲動式 3D 世界","選修","3D 網頁"]]},{"id":"T12","no":12,"name":"打造自己的 Agent","stage":2,"role":"orchestrator","outcome":"一個會自己跑的個人系統，例如講義進來自動出題、錯題變 Anki 卡","count":9,"required":5,"electives":4,"lessons":[],"all":[["12-1","Agent 入門：判斷哪些事值得做成 Agent","必修"],["12-2","打造第一個 Agent：用 Skill 與 Connector 組成工作流程","必修"],["12-3","MCP 連接：讓 Agent 使用外部工具","必修"],["12-4","Hooks 與排程：讓 Agent 自動啟動","必修"],["12-5","Agent 防錯設計：失敗處理、人工核准與停止","必修"],["12-E1","Zapier、n8n、Make：串接上千個 App","選修"],["12-E2","Agent 資料儲存：寫回 Notion 與 Google 試算表","選修"],["12-E3","RAG 入門：讓 Agent 根據你的資料回答","選修"],["12-E4","個人系統實作：讀書系統與週報系統","選修"]]},{"id":"T13","no":13,"name":"多 AI 協作","stage":2,"role":"orchestrator","outcome":"用 2 個以上的 AI 或 Session 分工完成一件任務，附上分工流程圖","count":8,"required":4,"electives":4,"lessons":[],"all":[["13-1","多 Agent 流程圖：規劃誰做什麼、何時交接","必修"],["13-2","子代理分工：把大任務拆給多個 Claude","必修"],["13-3","多 Session 管理：主控 Session 分派與回報","必修"],["13-4","跨工具協作流程：Claude、ChatGPT、Gemini 分工","必修"],["13-E1","Claude Code 串接 Codex：讓兩個 AI 互相審查","選修"],["13-E2","Agent Teams：多條工作線同時進行","選修"],["13-E3","本地模型入門：Ollama 與 LM Studio","選修"],["13-E4","本地模型隱私應用：敏感資料先在本機處理","選修"]]},{"id":"T14","no":14,"name":"網站上線與使用者登入","stage":3,"role":"product-engineer","outcome":"把第二階段做的網站或工具上線，有網址、能讓別人登入使用","count":8,"required":5,"electives":3,"lessons":[],"all":[["14-1","網站部署：用 GitHub Pages、Vercel 上線","必修"],["14-2","自訂網域：讓網站有自己的網址","必修"],["14-3","使用者登入與資料庫：Supabase 入門","必修"],["14-4","API 金鑰安全：保管金鑰與設定花費上限","必修"],["14-5","上線後維護：更新、故障與回到上一版","必修"],["14-E1","產品加入 AI 功能：讓網站呼叫 Claude","選修"],["14-E2","第三方串接：Google 登入與自動通知","選修"],["14-E3","收費功能：Stripe 金流入門","選修"]]},{"id":"T15","no":15,"name":"Eval 品質測試與資料安全","stage":3,"role":"product-engineer","outcome":"替自己的產品寫一份測試清單，跑過一輪並修掉找到的問題","count":8,"required":5,"electives":3,"lessons":[],"all":[["15-1","Eval 入門：建立測試題與驗收標準","必修"],["15-2","AI 評分：用 Claude 自動檢查輸出品質","必修"],["15-3","提示詞注入防護：保護產品與使用者資料","必修"],["15-4","資料安全：權限、個資保護與外洩預防","必修"],["15-5","成本控管：降低 API 用量與費用","必修"],["15-E1","Skill 與 Plugin 安全審查：避開惡意套件","選修"],["15-E2","使用紀錄與監控：找出產品問題","選修"],["15-E3","AI 使用政策：Anthropic Usage Policy 重點","選修"]]},{"id":"T16","no":16,"name":"使用者回饋與產品改版","stage":3,"role":"product-engineer","outcome":"發布一次產品更新，附上依回饋做的改變與發布貼文","count":7,"required":4,"electives":3,"lessons":[],"all":[["16-1","使用者回饋：問卷、訪談與使用數據","必修"],["16-2","產品迭代：從回饋排出下一版","必修"],["16-3","AI 產品體驗設計：等待、來源與修正","必修"],["16-4","產品發布：用 AI 製作發表文與短影音","必修"],["16-E1","GEO 入門：讓 AI 搜尋找得到你的網站","選修"],["16-E2","網站數據分析：Clarity 與使用者行為","選修"],["16-E3","作品集整理：把專案寫成案例","選修"]]},{"id":"T17","no":17,"name":"Claude Team 與團隊導入","stage":3,"role":"product-engineer","outcome":"一份給團隊或客戶的 AI 導入提案，附試行計畫","count":7,"required":4,"electives":3,"lessons":[],"all":[["17-1","AI 導入提案：試算效益並說服主管","必修"],["17-2","Claude Team 方案：席位、共用 Skill 與 Connector","必修"],["17-3","團隊與 Agent 協作：分工、核准與逐步放手","必修"],["17-4","內部培訓：設計教材教會同事","必修"],["17-E1","團隊共用助理：客服回覆與報價","選修"],["17-E2","Plugin 發布：打包團隊 Skill 給全公司","選修"],["17-E3","AI 顧問接案：作品集與提案書","選修"]]}]};
window.STAGES = [
 {
  "id": "T1",
  "name": "1 Claude 入門",
  "for": "用 Claude 完成一件本週的真實任務，記下它哪裡做對、哪裡出錯",
  "count": 6,
  "lessons": [
   {
    "id": "1-1",
    "title": "Claude 帳號註冊、安全設定與第一個任務",
    "type": "必修",
    "n": 1,
    "can": "用 Claude 完成一件本週的真實任務，記下它哪裡做對、哪裡出錯"
   },
   {
    "id": "1-2",
    "title": "Chat、Cowork 與 Claude Code：每件事該用哪一個",
    "type": "必修",
    "n": 2,
    "can": "用 Claude 完成一件本週的真實任務，記下它哪裡做對、哪裡出錯"
   },
   {
    "id": "1-4",
    "title": "辨認 AI 的錯：幻覺、附和與能力落差",
    "type": "必修",
    "n": 3,
    "can": "用 Claude 完成一件本週的真實任務，記下它哪裡做對、哪裡出錯"
   }
  ]
 },
 {
  "id": "T2",
  "name": "2 Prompt 技巧",
  "for": "整理出 5 個自己常用的 Prompt 範本",
  "count": 4,
  "lessons": [
   {
    "id": "2-1",
    "title": "Prompt 四要素：一次講清楚需求",
    "type": "必修",
    "n": 4,
    "can": "整理出 5 個自己常用的 Prompt 範本"
   }
  ]
 },
 {
  "id": "T3",
  "name": "3 AI 研究與查證",
  "for": "一份附來源、自己查證過的研究摘要",
  "count": 7,
  "lessons": [
   {
    "id": "3-1",
    "title": "檔案問答：PDF、講義、截圖只根據原文回答",
    "type": "必修",
    "n": 5,
    "can": "一份附來源、自己查證過的研究摘要"
   },
   {
    "id": "3-3",
    "title": "AI 回答查證：三步驟抓出錯誤",
    "type": "必修",
    "n": 6,
    "can": "一份附來源、自己查證過的研究摘要"
   },
   {
    "id": "3-E2",
    "title": "研究工具對照：Perplexity、Gemini Notebook",
    "type": "選修",
    "n": 7,
    "can": "一份附來源、自己查證過的研究摘要"
   }
  ]
 },
 {
  "id": "T4",
  "name": "4 Projects、Memory 與 Skills",
  "for": "為一門課或一項工作建好 Project，並做一個自己的 Skill",
  "count": 8,
  "lessons": [
   {
    "id": "4-1",
    "title": "個人化指令：設定你的背景與偏好",
    "type": "必修",
    "n": 8,
    "can": "為一門課或一項工作建好 Project，並做一個自己的 Skill"
   },
   {
    "id": "4-2",
    "title": "建立個人 Memory 系統",
    "type": "必修",
    "n": 9,
    "can": "為一門課或一項工作建好 Project，並做一個自己的 Skill"
   },
   {
    "id": "4-4",
    "title": "Skills 入門：呼叫、更新、自己做一個",
    "type": "必修",
    "n": 10,
    "can": "為一門課或一項工作建好 Project，並做一個自己的 Skill"
   },
   {
    "id": "4-5",
    "title": "建立自己的 Skill：把重複流程變成一句指令",
    "type": "必修",
    "n": 11,
    "can": "為一門課或一項工作建好 Project，並做一個自己的 Skill"
   }
  ]
 },
 {
  "id": "T5",
  "name": "5 Cowork 長任務與電腦操作",
  "for": "交辦 Cowork 完成一件要做 30 分鐘以上的整理工作，並檢查結果",
  "count": 5,
  "lessons": [
   {
    "id": "5-1",
    "title": "Cowork 入門：交辦一件要做很久的事",
    "type": "必修",
    "n": 12,
    "can": "交辦 Cowork 完成一件要做 30 分鐘以上的整理工作，並檢查結果"
   },
   {
    "id": "5-2",
    "title": "任務拆解：分步驟交辦大任務",
    "type": "必修",
    "n": 13,
    "can": "交辦 Cowork 完成一件要做 30 分鐘以上的整理工作，並檢查結果"
   }
  ]
 },
 {
  "id": "T6",
  "name": "6 Connectors 與自動化",
  "for": "一個每天自動執行的排程任務，連續跑一週",
  "count": 6,
  "lessons": [
   {
    "id": "6-1",
    "title": "Connectors 入門：連接 Gmail、日曆與雲端硬碟",
    "type": "必修",
    "n": 14,
    "can": "一個每天自動執行的排程任務，連續跑一週"
   },
   {
    "id": "6-3",
    "title": "排程任務：建立每日自動晨報（含完成條件與檢查）",
    "type": "必修",
    "n": 15,
    "can": "一個每天自動執行的排程任務，連續跑一週"
   },
   {
    "id": "6-E1",
    "title": "在 Google 文件與 Office 裡使用 Claude",
    "type": "選修",
    "n": 16,
    "can": "一個每天自動執行的排程任務，連續跑一週"
   }
  ]
 },
 {
  "id": "T7",
  "name": "7 AI 工具比較與個人 Agent",
  "for": "定好自己的主力與輔助 AI 工具，寫下各自用在哪些事",
  "count": 9,
  "lessons": [
   {
    "id": "7-1",
    "title": "AI 工具比較：Claude、ChatGPT、Gemini 怎麼選",
    "type": "必修",
    "n": 17,
    "can": "定好自己的主力與輔助 AI 工具，寫下各自用在哪些事"
   }
  ]
 }
];
