// 學習地圖第 7 版（2026-11-12 定案）：3 階段、12 模組、208 課；第一版只開 8 課，其他標「即將推出」。
// 這個檔由 研究/2026-11-11_AI學習總地圖/data 產生（f4 首頁用），要改開哪些課，改 OPEN 再重產。
// 2026-11-12：開放的 8 課課名與學習成果改用心智圖版的專業寫法（學習站/心智圖/data.js 的 label、ability）。
// window.STAGES：首頁沿用的格式，只放階段 1 的五個模組和開放的課；window.ROADMAP7：整張地圖（模組名、課數、每課課名 all）。
window.ROADMAP7 = {"version":7,"total":208,"open":["L0-01","L0-04","L1-01","L1-07","L2-01","L3-03","L4-01","L4-06"],"stages":[{"id":"s1","no":"1","name":"AI Power User","desc":"把 AI 用到極致，建立高效率的個人工作流","modules":[{"id":"L0","name":"模型與 AI 基礎","tagline":"先把帳號、規矩和「AI 為什麼會講錯」弄懂，再決定用哪一家、要不要付錢。","count":22,"hours":3.2,"lessons":[{"id":"L0-01","title":"帳號設定與首次提問","min":20,"can":"完成帳號註冊與兩步驟驗證，於網頁、桌面與行動裝置同步使用，並以影像輸入完成第一次提問"},{"id":"L0-04","title":"LLM 的限制：幻覺與附和","min":20,"can":"說明 LLM 以 token 逐步預測生成回答的機制，辨識幻覺（hallucination）、知識截止與附和（sycophancy），並採取對應的提問策略"}],"all":[["L0-01","帳號設定與首次提問"],["L0-02","先找到你的第一個用途"],["L0-03","看懂對話畫面，確認你的帳號是哪一種"],["L0-04","LLM 的限制：幻覺與附和"],["L0-05","知道對話為什麼越長越笨、額度為什麼用得快"],["L0-06","選模型和 Effort：大事用大的，小事用小的"],["L0-07","AI 的規矩一：什麼資料能貼、隱私怎麼設"],["L0-08","AI 的規矩二：作業與工作的界線、怎麼標示"],["L0-09","選對工具與方案：免費夠不夠、什麼時候該付錢"],["L0-10","看全景：Claude 有哪些功能、各在哪個模組學（當作接下來的地圖）"],["L0-11","依你最常做的事挑 AI，看懂台灣方案和台幣價格"],["L0-12","用 ChatGPT 做到 Claude 能做的事（GPTs、Projects、Work、Codex）"],["L0-13","用 Gemini 處理 Google 全家桶裡的事（Gems、Gemini Notebook、Workspace）（選修：學校或公司用 Google 的人）"],["L0-14","在 Word、Excel、Outlook 裡用 Microsoft Copilot（選修：學校或公司用 Microsoft 的人）"],["L0-15","認識中文模型與台灣模型，判斷能不能用（DeepSeek、Qwen、Kimi、TAIDE）"],["L0-16","查 X 上的即時討論：Grok 與 X 訂閱（選修）"],["L0-17","在好幾個 AI 之間切換，不用每次重講一遍"],["L0-18","設計多工具並用的固定流程"],["L0-19","原理深入：token、上下文視窗（context window）、訓練與知識截止日"],["L0-20","看見偏見：AI 的回答為什麼會偏向某些人或立場"],["L0-21","AI 安全的大圖：它為什麼有個性、為什麼會拒絕你、公司怎麼管最危險的能力"],["L0-22","AI 會怎麼改變工作：用研究資料而不是恐慌來看"]]},{"id":"L1","name":"Prompt 與 Context Engineering","tagline":"把需求講清楚、讓它記得你是誰，同樣的事每次都拿到能用的答案。","count":13,"hours":3.9,"lessons":[{"id":"L1-01","title":"結構化提示四要素","min":20,"can":"以背景、任務、限制、格式四要素撰寫結構化提示，並以分隔符區隔資料與指令"},{"id":"L1-07","title":"個人化指令設定","min":20,"can":"撰寫個人化指令，使每個新對話自動套用身分設定、回答格式與查證規則"}],"all":[["L1-01","結構化提示四要素"],["L1-02","給一個範例，讓它照你要的樣子做"],["L1-03","讓它先問你、指定它的角色和你的程度"],["L1-04","追問與修改：把答案改到能用"],["L1-05","把大任務拆成小步，每步停下來確認"],["L1-06","分清楚：哪些東西放指令、記憶、Project、Skill"],["L1-07","個人化指令設定"],["L1-08","讓它說台灣的中文"],["L1-09","管理記憶與找回舊對話：看、改、刪、暫停、搜尋"],["L1-10","開一個 Project：一個主題一個房間"],["L1-11","把 Project 設計好：記憶分開、整理、封存、分享"],["L1-12","照你的語氣寫、切換口氣，不要 AI 腔"],["L1-13","從 ChatGPT、Gemini 搬過來：匯入與匯出記憶"]]},{"id":"L2","name":"AI 研究與知識管理","tagline":"讓它根據你的檔案和網路來源回答，而且你抓得出它哪裡錯。","count":7,"hours":3.6,"lessons":[{"id":"L2-01","title":"以檔案為依據回答","min":20,"can":"上傳文件並限定以檔案為唯一依據回答、標註頁碼，再抽查原文驗證內容"}],"all":[["L2-01","以檔案為依據回答"],["L2-02","叫它查網路、讀網頁，附上來源並抽查"],["L2-03","查證：三個動作抓出 AI 的錯"],["L2-04","評估成果：先寫標準，再決定要不要用 AI"],["L2-05","用 Research 做一份有出處的深入研究"],["L2-06","用 Perplexity 這類「搜尋型 AI」快速查有來源的答案"],["L2-07","判斷 AI 新聞與排行榜：看到「重大突破」先問五件事，每月 10 分鐘跟上更新"]]},{"id":"L3","name":"內容與多模態","tagline":"直接交出成品：報告、試算表、簡報、小工具頁，需要時再加上圖片、影片和聲音。","count":19,"hours":6.6,"lessons":[{"id":"L3-03","title":"互動式 Artifact","min":35,"can":"以需求規格（使用者、輸入、行為、風格、錯誤處理）產出可互動的 Artifact 工具頁，完成修改與發布"}],"all":[["L3-01","給它圖片、截圖和掃描檔"],["L3-02","分清楚要 Artifact（成品頁）還是檔案，並打開產生檔案的開關"],["L3-03","互動式 Artifact"],["L3-04","讓 Claude 交一份 Word 或 PDF 報告"],["L3-05","讓 Claude 做一份有公式的 Excel 試算表"],["L3-06","做簡報：Slides 範本或 .pptx 檔兩條路"],["L3-07","用範本做可以一起編輯的文件與設計稿（Docs／Design）"],["L3-08","在 Claude 裡開一張試算表、一塊白板（Claude Sheets、Whiteboards）"],["L3-09","上傳資料讓 Claude 分析、畫圖；付費再接資料來源做 Claude Data 儀表板"],["L3-10","做會記住資料、能分享、會呼叫 AI 的頁面"],["L3-11","讓 Claude 當你的企劃、編劇和品管"],["L3-12","依用途挑一個生圖工具，生出第一張可用的圖"],["L3-13","讓同一個角色、同一個風格出現在每一張圖（選修）"],["L3-14","做出幾秒到幾十秒的 AI 影片，再剪成一支短片（選修）"],["L3-15","用 Suno 做一首歌，弄清楚能不能商用（選修）"],["L3-16","用 AI 配音、語音和聲音複製，並守住同意這條線（選修）"],["L3-17","用 Gamma、Canva 從大綱快速做出簡報和設計稿（選修）"],["L3-18","從 Claude 直接叫設計與生成工具（Connector、Plugin、MCP）（選修）"],["L3-19","AI 作品的版權、訓練資料爭議和標示"]]},{"id":"L4","name":"個人 AI 工作空間","tagline":"把 Claude 接上你的信箱、雲端和電腦，做成一套每天在用的工作環境。","count":20,"hours":10.1,"lessons":[{"id":"L4-01","title":"Connector／Skill／Plugin","min":20,"can":"區分 Connector（MCP）、Skill、Plugin 的功能與適用情境，依需求選擇正確的擴充方式"},{"id":"L4-06","title":"內建 Skill 的啟用與呼叫","min":25,"can":"開啟程式碼執行環境、啟用內建 Skill，並以自動載入或「/」指令呼叫"}],"all":[["L4-01","Connector／Skill／Plugin"],["L4-02","接上你的第一個 Connector（以 Google 雲端硬碟、Gmail、日曆為例）"],["L4-03","在手機上讓 Claude 查空檔、加行程、設提醒、找地點"],["L4-04","接上之前先設權限：最小權限與提示詞注入（prompt injection）"],["L4-05","看懂並存好純文字檔：Markdown、YAML 與副檔名的最少知識"],["L4-06","內建 Skill 的啟用與呼叫"],["L4-07","安裝別人做的 Skill：先做 6 點安全檢查再上傳"],["L4-08","做自己的 Skill：用 skill-creator 起草、看懂 SKILL.md、用測試題驗"],["L4-09","裝一個 Plugin，並安全地管理它"],["L4-10","用 Create with Claude 做自己的 Plugin（不用寫檔案）"],["L4-11","在桌面 app 裝本機擴充，讓 Claude 用你電腦上的工具"],["L4-12","用網址加一個不在目錄裡的 Connector（遠端 MCP）"],["L4-13","在 Google 文件、試算表、簡報裡叫 Claude（Google Workspace）"],["L4-14","在 Excel、Word、PowerPoint、Outlook 裡叫 Claude（Microsoft 365）"],["L4-15","整理別人留下的 Google 試算表：修公式、清亂表（加做：讓 Claude 寫 Apps Script）"],["L4-16","讓 Claude 動手做長任務（合一版的 Cowork 能力）"],["L4-17","讓 Claude 讀寫你電腦裡的資料夾"],["L4-18","讓 Claude 在 Chrome 裡幫你點網頁（Claude in Chrome）"],["L4-19","讓 Claude 操作你的電腦（computer use）"],["L4-20","建立自己跟上 AI 更新的系統"]]}]},{"id":"s2","no":"2","name":"AI Builder","desc":"用 AI 開發、串接與自動化，打造自己的 AI 系統","modules":[{"id":"L5","name":"AI Coding","tagline":"從零開始寫 Python，再學會指揮 Claude Code 在你的電腦上寫程式：看懂 diff、用 git 存檔、設好權限與防線。","count":26,"hours":25.0,"lessons":[],"all":[["L5-01","不碰終端機也能用：桌面 app 的 Code 分頁（Claude Code 從這裡開始）"],["L5-02","打開終端機、在資料夾之間移動、看懂路徑"],["L5-03","裝好寫程式的基本工具：VS Code、Node、npm、git、gh 與 GitHub 帳號"],["L5-04","安裝 Claude Code 並登入（訂閱帳號 vs API key）"],["L5-05","交辦第一個任務，看懂 Claude 正在做什麼"],["L5-06","看懂 diff、核准或退回修改，改壞了就倒回去"],["L5-07","Git 基礎：存檔點、分支、推上 GitHub"],["L5-08","看懂錯誤訊息，自己除錯"],["L5-09","選對權限模式：Manual、Accept edits、Plan、Auto"],["L5-10","照固定順序做事：探索 → 計畫 → 實作 → 驗證 → 提交"],["L5-11","設定永久的 allow 與 deny 規則（permissions 與 settings.json）"],["L5-12","讓 Claude Code 記住規矩與筆記：CLAUDE.md、自動記憶與 /memory"],["L5-13","管好 context：/context、/compact、/clear 與長對話"],["L5-14","控制成本與額度：模型、Effort、用量"],["L5-15","先設好防線再放手：沙盒、機密保護、信任提示與提示詞注入"],["L5-16","開 PR、讓 Claude 審程式、用 worktree 同時開好幾條工作線"],["L5-17","在自己的電腦裝好 Python，跑出第一支程式"],["L5-18","用 uv 建專案、裝套件，不把電腦弄亂"],["L5-19","變數、型別與字串：讓程式記住東西"],["L5-20","清單與字典：一次處理很多筆資料"],["L5-21","迴圈與條件：讓程式自己判斷、自己重複"],["L5-22","函式與模組：把步驟包成能重複用的積木"],["L5-23","讀懂錯誤訊息與 traceback，自己找到出錯的那一行"],["L5-24","讀寫檔案並處理例外，讓程式失敗得有禮貌"],["L5-25","讓 Claude Code 陪你寫、並讀懂你的第一支小工具"],["L5-26","選寫程式的 AI 工具，並讓 Claude Code、Codex、Cursor、Copilot 共用同一套設定"]]},{"id":"L6","name":"Web 與 App 開發","tagline":"用 Claude Code 做出真的能用的網站：先做靜態頁，再用 Next.js 做前端元件、後端 API、Supabase 資料庫，最後部署上線。","count":6,"hours":6.8,"lessons":[],"all":[["L6-01","TypeScript 與 Node 的最少知識（選修）"],["L6-02","用講的做一個網站，在本機看到它並分享成 Artifact"],["L6-03","前端基礎：用 Claude Code 做出 React／Next.js 頁面與元件"],["L6-04","後端與 API 路由：讓網站能存取資料、呼叫 Claude（Next.js route handlers；金鑰只放伺服器端）"],["L6-05","資料庫入門：用 Supabase（PostgreSQL）建資料表、讀寫資料，看懂 Row Level Security"],["L6-06","把網站部署上線：GitHub Pages 或 Vercel"]]},{"id":"L7","name":"API 與服務串接","tagline":"讓程式和外部世界說話：JSON、HTTP、金鑰，Claude API 的各種能力，OAuth 與 Webhook，還有什麼時候改用本地與開源模型。","count":29,"hours":27.8,"lessons":[],"all":[["L7-01","JSON：程式和 API 交換資料的共同語言"],["L7-02","HTTP 與 API：用程式跟網路服務對話"],["L7-03","環境變數、.env 與金鑰安全：把祕密跟程式分開放"],["L7-04","API、webhook、JSON 白話版（先懂觀念，再寫程式）"],["L7-05","先不花錢跑一次 agent 迴圈：用假回應讀懂 Claude API 程式，接上 Claude API"],["L7-06","開好開發者帳號、拿到 API 金鑰（Claude Console 與 ant CLI）"],["L7-07","看懂 API 計費、用量等級與花費上限"],["L7-08","送出第一個 Messages API 請求（system、messages、max_tokens）"],["L7-09","處理多輪對話、串流顯示、拒絕與錯誤回應（含 streaming）"],["L7-10","依任務挑模型（Fable 5.2、Opus 5.5、Sonnet 5.5、Haiku 5.5）"],["L7-11","讓程式看圖、讀 PDF，並上傳一次重複使用（vision、PDF support 與 Files API）"],["L7-12","寫出穩定好用的系統提示（進階 prompt engineering）"],["L7-13","控制 Effort 與花費（adaptive thinking、task budget）"],["L7-14","讓 Claude 呼叫你寫的函式（tool use 基礎與 tool runner）"],["L7-15","用 Anthropic 代跑的工具：網路搜尋、抓網頁、執行程式（server tools）"],["L7-16","在 API 裡用 Skills：內建的 Excel／Word／PPT／PDF 和你自己上傳的 skill"],["L7-17","讓輸出一定是合法 JSON（structured outputs）"],["L7-18","重複內容只付一次錢（prompt caching）"],["L7-19","算 token、管好上下文視窗（token counting、compaction、context editing）"],["L7-20","OAuth 與 Webhook：串接第三方服務（Google 日曆授權讀取、GitHub 事件通知與驗證簽章）"],["L7-21","在 AWS、Google Cloud、Azure 上用 Claude（Bedrock、Vertex、Foundry）"],["L7-22","判斷什麼時候需要本地模型"],["L7-23","挑一個你的電腦跑得動、授權又合用的模型"],["L7-24","用 Ollama 或 LM Studio 跑起第一個本地模型（二選一）"],["L7-25","本地模型的隱私與安全：不是裝在自己電腦就沒事"],["L7-26","把本地模型接到其他工具（API、Claude Code、MCP）"],["L7-27","讓本地模型當 Claude 前面的資料過濾站（去識別化與本地 embedding）"],["L7-28","用數字回答「本地模型夠不夠用」（選修）"],["L7-29","判斷要不要微調，並用 LoRA 微調一個小開源模型（選修）"]]},{"id":"L8","name":"Agent 架構與工具生態","tagline":"把模型變成會自己做事的 agent：用 Claude Code 的 Skill、子代理、hooks、MCP、plugin 組系統，再用 Agent SDK 寫程式，並學會 context、記憶、RAG 和多代理的設計。","count":25,"hours":23.5,"lessons":[],"all":[["L8-01","agent 是什麼：模型＋工具＋迴圈＋停止條件"],["L8-02","判斷要不要做 agent、做成什麼樣子（設計判斷與工具介面）"],["L8-03","Claude Code 裡的 Skill 多了什麼：放的位置、參數、動態內容、誰來觸發"],["L8-04","派子代理分工：讓每個子代理各做一塊"],["L8-05","讓 Claude 在固定時機自動做事（hooks）"],["L8-06","接上外部工具：在 Claude Code 設定 MCP server"],["L8-07","在 Claude Code 裝與管 plugin：/plugin、安裝範圍、context 成本"],["L8-08","把零件組成系統：CLAUDE.md、Skill、子代理、Hook、MCP、Plugin、mod 什麼時候用哪個"],["L8-09","同時派很多個 Claude：agent view、agent teams、dynamic workflows、/batch 與跨 session 傳訊"],["L8-10","自己做 plugin、架 marketplace、跑 eval，發給團隊"],["L8-11","用 Claude Code 組出我的第一個 agent"],["L8-12","用 Agent SDK 做出第一個會讀檔改檔的 agent（Agent SDK 入門）"],["L8-13","控制你的 agent：權限回呼、自訂工具、hooks、sessions 與設定載入（Agent SDK 控制）"],["L8-14","自己寫一個本機 MCP server（stdio）"],["L8-15","把 MCP server 放上網路並發布（Streamable HTTP、OAuth、Registry）"],["L8-16","自己寫一個 MCP client，並認識官方 extensions（MCP Apps、Skills over MCP、Server Cards）"],["L8-17","設計 agent 看到的所有內容（context engineering 與記憶）"],["L8-18","給 agent 長期記憶：寫什麼、存哪裡、何時忘、誰看得到、有沒有用"],["L8-19","讓 AI 根據你的資料回答（RAG 與 embeddings）"],["L8-20","把檢索做到又準又穩（contextual retrieval、混合搜尋與 rerank）"],["L8-21","設計多個 AI 分工合作的系統（多代理架構）"],["L8-22","別家 agent 框架與跨系統互通：LangGraph、OpenAI Agents SDK、Google ADK、A2A 與 OpenAI SDK 相容層（選修）"],["L8-23","讓 AI 操作電腦與瀏覽器（computer use 與 browser use API）"],["L8-24","讓 Anthropic 幫你託管 agent（Claude Managed Agents）"],["L8-25","設計能跑好幾小時的長任務 agent（harness 設計）"]]},{"id":"L9","name":"自動化與工作流","tagline":"讓重複的事自己跑：排程、晨報、LINE 與會議流程、Zapier／n8n、失敗處理與人工核准，再到 Claude Code 的 headless、GitHub 與雲端排程，最後組成自己的系統。","count":19,"hours":13.2,"lessons":[],"all":[["L9-01","挑出值得自動化的事，並寫好「完成的樣子」"],["L9-02","把長任務交出去：寫一張好的委派單"],["L9-03","建立第一個排程任務：讓 Claude 固定時間自己做事"],["L9-04","每日晨報：Gmail＋日曆＋雲端硬碟自動整理"],["L9-05","把結果寫回 Notion 或 Google 試算表，讓自動化有「資料庫」"],["L9-06","把 LINE 群組變成待辦表，需要時用官方帳號發通知"],["L9-07","會議流程：逐字稿 → 紀錄 → 待辦分派 → 下次開會前追蹤（上班族必做，學生有小組會議再做）"],["L9-08","做一個團隊共用的客服回覆助理：規則放好、沒資料就說不知道、回覆一定人審"],["L9-09","報價與提案：Excel 範本加 Skill，價格只從價目表來"],["L9-10","用 Zapier 讓 Claude 動到幾千個 App"],["L9-11","用 n8n 或 Make 做可控、可重跑的流程"],["L9-12","自動化會壞：失敗處理、監看與緊急煞車"],["L9-13","在程式裡做出人機分工與核准：三級權限、非同步核准與看得懂的核准訊息（human-in-the-loop 實作）"],["L9-14","用一行指令跑完任務：headless（claude -p）與輸出格式"],["L9-15","讓 GitHub 上的 @claude 幫你做事（GitHub Actions）"],["L9-16","不用守著也能做：雲端 session、Remote Control、手機與背景"],["L9-17","讓 Claude Code 定時自己做：雲端排程、本機排程、/loop 與 /goal"],["L9-18","設計你的個人系統（讀書版）：講義進來、題目出來、錯題回饋"],["L9-19","設計你的個人系統（週報版）：工作紀錄自動累積成週報草稿"]]}]},{"id":"s3","no":"3","name":"Production & Mastery","desc":"將成果產品化，確保品質與長期可維運","modules":[{"id":"L10","name":"產品化、部署與導入","tagline":"把做好的 AI 原型變成別人每天能放心用的產品：安全上線、有登入和資料庫、看得見在做什麼、長期顧得住，並讓團隊真的用起來。","count":11,"hours":11.4,"lessons":[],"all":[["L10-01","把 AI 應用安全地上線（後端、金鑰、速率限制、重試）"],["L10-02","上線一個有登入與資料庫的 App（Supabase Auth＋資料庫＋Vercel）"],["L10-03","把 Agent SDK agent 正式部署：容器、session 保存、多租戶隔離與出口代理"],["L10-04","看得見 agent 在做什麼（可觀測性、logging 與追蹤）"],["L10-05","讓上線的 agent 系統長期活著：版本鎖定、模型退役遷移、灰度與回滾、事故處理（上線維運）"],["L10-06","把 AI 功能做給人用：期待、進度、來源、修正、回饋與上線指標（AI 產品設計）"],["L10-07","算出 AI 幫團隊省多少，寫一頁說服主管的導入提案"],["L10-08","開通與管理 Team 方案：席位、角色、Connector、共用 Skill 與 Plugin"],["L10-09","帶團隊和 agent 一起工作：分好角色、在公開處工作、逐步放手（含 Slack 裡的 Claude Tag）"],["L10-10","把會的東西教給別人（教學設計與寫教材）"],["L10-11","做出作品集並寫顧問提案（接案與導入服務）"]]},{"id":"L11","name":"評估、測試與安全","tagline":"上線前後都要證明它可靠、安全、付得起：用 eval 量品質、擋住注入、管好權限與成本，並守住團隊政策與台灣法規。","count":11,"hours":13.1,"lessons":[],"all":[["L11-01","先寫評估再改功能：建評估集、評分者與人工校準（evals 入門）"],["L11-02","把 eval 接進每次改版：回歸集、CI、錯誤分析與上線後評估"],["L11-03","替 agent 建任務環境評估：每題一個乾淨環境、看最後狀態評分"],["L11-04","評一個 Skill 或 agent 本身：題庫、觸發率、過程與結果"],["L11-05","替 Skill、子代理與 Claude Code 設定跑正式評估：有無比較、過程檢查點、回歸"],["L11-06","把成本壓下來又不掉品質（成本控管與 Batch API）"],["L11-07","擋住提示詞注入（prompt injection）與越獄攻擊"],["L11-08","控管 agent 的權限、沙盒與資料外洩路徑（含供應鏈）"],["L11-09","MCP 的授權、資安與供應鏈：OAuth 2.1、驗證 iss、擋 tool poisoning 與 rug pull"],["L11-10","替團隊寫 AI 政策、資料分級與試行計畫（治理）"],["L11-11","職場規範與台灣法規：公司裡能怎麼用 AI"]]}]}]};
window.STAGES = [
 {
  "id": "L0",
  "name": "L0 模型與 AI 基礎",
  "for": "先把帳號、規矩和「AI 為什麼會講錯」弄懂，再決定用哪一家、要不要付錢。",
  "count": 22,
  "lessons": [
   {
    "id": "L0-01",
    "title": "帳號設定與首次提問",
    "min": 20,
    "can": "完成帳號註冊與兩步驟驗證，於網頁、桌面與行動裝置同步使用，並以影像輸入完成第一次提問",
    "n": 1
   },
   {
    "id": "L0-04",
    "title": "LLM 的限制：幻覺與附和",
    "min": 20,
    "can": "說明 LLM 以 token 逐步預測生成回答的機制，辨識幻覺（hallucination）、知識截止與附和（sycophancy），並採取對應的提問策略",
    "n": 2
   }
  ]
 },
 {
  "id": "L1",
  "name": "L1 Prompt 與 Context Engineering",
  "for": "把需求講清楚、讓它記得你是誰，同樣的事每次都拿到能用的答案。",
  "count": 13,
  "lessons": [
   {
    "id": "L1-01",
    "title": "結構化提示四要素",
    "min": 20,
    "can": "以背景、任務、限制、格式四要素撰寫結構化提示，並以分隔符區隔資料與指令",
    "n": 3
   },
   {
    "id": "L1-07",
    "title": "個人化指令設定",
    "min": 20,
    "can": "撰寫個人化指令，使每個新對話自動套用身分設定、回答格式與查證規則",
    "n": 4
   }
  ]
 },
 {
  "id": "L2",
  "name": "L2 AI 研究與知識管理",
  "for": "讓它根據你的檔案和網路來源回答，而且你抓得出它哪裡錯。",
  "count": 7,
  "lessons": [
   {
    "id": "L2-01",
    "title": "以檔案為依據回答",
    "min": 20,
    "can": "上傳文件並限定以檔案為唯一依據回答、標註頁碼，再抽查原文驗證內容",
    "n": 5
   }
  ]
 },
 {
  "id": "L3",
  "name": "L3 內容與多模態",
  "for": "直接交出成品：報告、試算表、簡報、小工具頁，需要時再加上圖片、影片和聲音。",
  "count": 19,
  "lessons": [
   {
    "id": "L3-03",
    "title": "互動式 Artifact",
    "min": 35,
    "can": "以需求規格（使用者、輸入、行為、風格、錯誤處理）產出可互動的 Artifact 工具頁，完成修改與發布",
    "n": 6
   }
  ]
 },
 {
  "id": "L4",
  "name": "L4 個人 AI 工作空間",
  "for": "把 Claude 接上你的信箱、雲端和電腦，做成一套每天在用的工作環境。",
  "count": 20,
  "lessons": [
   {
    "id": "L4-01",
    "title": "Connector／Skill／Plugin",
    "min": 20,
    "can": "區分 Connector（MCP）、Skill、Plugin 的功能與適用情境，依需求選擇正確的擴充方式",
    "n": 7
   },
   {
    "id": "L4-06",
    "title": "內建 Skill 的啟用與呼叫",
    "min": 25,
    "can": "開啟程式碼執行環境、啟用內建 Skill，並以自動載入或「/」指令呼叫",
    "n": 8
   }
  ]
 }
];
