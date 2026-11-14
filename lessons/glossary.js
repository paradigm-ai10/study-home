// AI 名詞小字典：由 研究/2026-11-11_AI學習總地圖/data/glossary.json（v8）產生，不要手改；正本改了就跑 python3 tools/make_glossary.py
window.GLOSSARY = [
 {
  "term": "人工智慧",
  "en": "Artificial Intelligence (AI)",
  "plain": "讓電腦做出原本需要人來判斷或創作的事，例如寫字、看圖、對話。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "生成式 AI",
  "en": "Generative AI",
  "plain": "會「產生」新內容（文字、圖片、聲音、影片）的 AI，不只是分類或預測。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "大型語言模型",
  "en": "Large Language Model (LLM)",
  "plain": "讀過大量文字、學會預測下一個 token（約一個字或半個詞）的模型，Claude、GPT、Gemini 都是。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "模型",
  "en": "Model",
  "plain": "訓練完成的 AI 本體；同一個 app 裡可以換不同模型。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "聊天機器人",
  "en": "Chatbot",
  "plain": "用對話方式跟你互動的 AI 介面，例如 Claude 網頁版。",
  "lesson": "1-1",
  "topic": "T1"
 },
 {
  "term": "token（詞元）",
  "en": "Token",
  "plain": "AI 讀寫文字的最小單位，可能是一個字或半個詞；額度和費用都用它算。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "分詞器",
  "en": "Tokenizer",
  "plain": "把文字切成 token 的規則，每家模型的切法不同。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "上下文視窗（context window）",
  "en": "Context window",
  "plain": "AI 一次能看到的內容總量，包含你的訊息、它的回答、上傳的檔案；超過就會忘記前面或變不準，越長也越耗額度。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "Prompt（提示詞）",
  "en": "Prompt",
  "plain": "你打給 AI 的指令或問題。",
  "lesson": "2-1",
  "topic": "T2",
  "alias": [
   "提示詞"
  ]
 },
 {
  "term": "提示工程",
  "en": "Prompt engineering",
  "plain": "把需求寫清楚、讓 AI 回答更好的技巧，例如給範例、給格式、拆步驟。",
  "lesson": "2-1",
  "topic": "T2"
 },
 {
  "term": "系統提示詞",
  "en": "System prompt",
  "plain": "在對話開始前就設定好的規則，決定 AI 的角色和說話方式。",
  "lesson": "14-E1",
  "topic": "T14"
 },
 {
  "term": "context engineering（上下文工程）",
  "en": "Context engineering",
  "plain": "設計要讓 AI 看到哪些資料、規則、工具和記憶，比只改提示詞更全面。",
  "lesson": "7-3",
  "topic": "T7"
 },
 {
  "term": "幻覺",
  "en": "Hallucination",
  "plain": "AI 自信地講出錯誤或編造的內容，例如不存在的論文。",
  "lesson": "1-4",
  "topic": "T1"
 },
 {
  "term": "附和",
  "en": "Sycophancy",
  "plain": "AI 為了讓你滿意而順著你的說法，就算你錯了也同意。",
  "lesson": "1-4",
  "topic": "T1"
 },
 {
  "term": "偏見",
  "en": "Bias",
  "plain": "AI 從資料學到的刻板印象或不公平傾向。",
  "lesson": "1-4",
  "topic": "T1"
 },
 {
  "term": "訓練",
  "en": "Training",
  "plain": "用大量資料讓模型學會語言和知識的過程，做完模型才定型。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "預訓練",
  "en": "Pre-training",
  "plain": "訓練的第一階段：讀大量文字，學會預測下一個 token。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "推論",
  "en": "Inference",
  "plain": "你提問時，模型根據已學到的內容產生回答的過程；每次回答都要耗費運算資源，但不會改變模型本身。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "知識截止日",
  "en": "Knowledge cutoff",
  "plain": "模型訓練資料停在哪個時間點，官方通常公布到月份（例如某年 3 月）；之後的事它不知道，除非上網查。",
  "lesson": "1-4",
  "topic": "T1"
 },
 {
  "term": "人類回饋強化學習",
  "en": "RLHF (Reinforcement Learning from Human Feedback)",
  "plain": "用人對回答的評分來調整模型，讓它更有用、更安全；也是附和的來源之一。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "微調",
  "en": "Fine-tuning",
  "plain": "拿特定資料再訓練一次模型，讓它固定學會一種格式、語氣或窄任務；會改變模型本身。一般 Claude 使用者沒有微調功能（只有 Amazon Bedrock 曾開放少數舊模型），要微調多半用開源模型，而且通常先試提示詞、範例和 RAG。",
  "topic": "T13"
 },
 {
  "term": "參數",
  "en": "Parameters",
  "plain": "模型內部學到的數字，數量越多通常越聰明也越吃資源；8B 就是 80 億個。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "開放權重",
  "en": "Open weights",
  "plain": "模型檔可以公開下載自己跑，但訓練資料不一定公開。",
  "lesson": "13-E3",
  "topic": "T13"
 },
 {
  "term": "開源模型",
  "en": "Open-source model",
  "plain": "常被拿來指能下載的模型，嚴格說那叫開放權重（open weights）；符合開源定義的，還要公開程式碼與訓練資料的資訊。",
  "lesson": "13-E3",
  "topic": "T13"
 },
 {
  "term": "本地模型",
  "en": "Local model",
  "plain": "下載到自己電腦上跑的模型，資料不用傳出去。",
  "lesson": "13-E3",
  "topic": "T13"
 },
 {
  "term": "量化",
  "en": "Quantization",
  "plain": "把模型壓縮得更小，讓普通電腦跑得動，品質會稍微下降。",
  "lesson": "13-E3",
  "topic": "T13"
 },
 {
  "term": "混合專家模型",
  "en": "Mixture of Experts (MoE)",
  "plain": "模型內部分成很多組參數（稱為專家），處理每個 token 時只啟用其中幾組，所以同樣大小的模型算得比較快、比較省。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "統一記憶體",
  "en": "Unified memory",
  "plain": "Mac M 系列晶片讓 CPU 和 GPU 共用記憶體，適合跑本地模型。",
  "lesson": "13-E3",
  "topic": "T13"
 },
 {
  "term": "多模態",
  "en": "Multimodal",
  "plain": "能同時處理文字、圖片、聲音等多種資料的 AI。",
  "topic": "T3"
 },
 {
  "term": "視覺能力",
  "en": "Vision",
  "plain": "AI 看懂圖片、截圖、圖表的能力。",
  "lesson": "3-1",
  "topic": "T3"
 },
 {
  "term": "推理模型／思考",
  "en": "Reasoning / Thinking",
  "plain": "模型先在內部一步步想再回答，比較慢但比較準。在 Claude 的模型選單裡開關，名稱依模型不同（Thinking 或 Extended）；部分模型一律會思考。跟 Effort 是兩個分開的設定。",
  "lesson": "1-3",
  "topic": "T1",
  "alias": [
   "Thinking",
   "思考過程"
  ]
 },
 {
  "term": "Effort（努力程度）",
  "en": "Effort",
  "plain": "設定模型要想多深（Low 到 Max）：越高越準但越慢、越耗額度；Free 能不能調以畫面為準。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "檢索增強生成",
  "en": "RAG (Retrieval-Augmented Generation)",
  "plain": "先從資料庫或網路找到相關段落，再讓 AI 根據它回答。",
  "lesson": "12-E3",
  "topic": "T12"
 },
 {
  "term": "向量嵌入",
  "en": "Embedding",
  "plain": "把一段文字轉成一串數字，意思相近的文字數字也相近，用來做搜尋。",
  "lesson": "12-E3",
  "topic": "T12"
 },
 {
  "term": "向量資料庫",
  "en": "Vector database",
  "plain": "存放 embedding 的資料庫，能快速找出意思相近的內容。",
  "lesson": "12-E3",
  "topic": "T12"
 },
 {
  "term": "應用程式介面",
  "en": "API (Application Programming Interface)",
  "plain": "讓程式直接呼叫 AI 的管道，用多少算多少錢。",
  "lesson": "14-E1",
  "topic": "T14"
 },
 {
  "term": "API 金鑰",
  "en": "API key",
  "plain": "用 API 時的密碼，外流別人就能用你的額度，不要貼進對話或公開檔案。",
  "lesson": "14-4",
  "topic": "T14"
 },
 {
  "term": "軟體開發套件",
  "en": "SDK (Software Development Kit)",
  "plain": "官方幫你包好的程式工具，讓呼叫 API 更簡單。",
  "lesson": "14-E1",
  "topic": "T14"
 },
 {
  "term": "OpenAI 相容 API",
  "en": "OpenAI-compatible API",
  "plain": "用跟 OpenAI 一樣的格式提供 API，很多工具改個網址就能接。",
  "lesson": "13-E3",
  "topic": "T13"
 },
 {
  "term": "代理",
  "en": "Agent",
  "plain": "會自己規劃步驟、使用工具、一路做完任務的 AI，不只是一問一答；零件是模型＋工具＋迴圈＋停止條件。",
  "lesson": "12-1",
  "topic": "T12"
 },
 {
  "term": "子代理",
  "en": "Subagent",
  "plain": "主代理派出去處理其中一部分工作的小代理，做完回報結果。",
  "lesson": "13-2",
  "topic": "T13"
 },
 {
  "term": "多代理系統",
  "en": "Multi-agent system",
  "plain": "多個 AI 代理分工合作完成一件大任務。",
  "lesson": "13-1",
  "topic": "T13"
 },
 {
  "term": "工具使用",
  "en": "Tool use / Function calling",
  "plain": "AI 呼叫外部功能（搜尋、計算、讀檔案）來完成任務。",
  "lesson": "12-3",
  "topic": "T12"
 },
 {
  "term": "MCP（模型上下文協定）",
  "en": "MCP (Model Context Protocol)",
  "plain": "讓 AI 接上外部工具和資料的開放標準；Claude 的 Connector 多半是用 MCP 做的。",
  "lesson": "12-3",
  "topic": "T12"
 },
 {
  "term": "MCP 伺服器",
  "en": "MCP server",
  "plain": "提供某個工具或資料給 AI 用的程式，例如 Canva、Google 日曆的 MCP。",
  "lesson": "12-3",
  "topic": "T12"
 },
 {
  "term": "Connector（連接器）",
  "en": "Connector",
  "plain": "Claude 裡接上外部服務（雲端硬碟、Gmail、Canva 等）的入口；在左側欄的 Plugins 管理（舊介面叫 Customize），可以用篩選只看 Connectors。底層多半是 MCP。",
  "lesson": "6-1",
  "topic": "T6"
 },
 {
  "term": "Skill（技能）",
  "en": "Skill (Agent Skills)",
  "plain": "一份寫好的做法說明（加上需要的檔案），Claude 需要時自己拿出來照做；在 claude.ai 打「/」也能直接叫。是開放標準；官方價目表列 Free 可用。帳號看不到 Skill 時，先確認「Settings → Capabilities」的 Create and edit files（舊名 Code execution and file creation）已開啟，多數帳號預設是開的。",
  "lesson": "4-4",
  "topic": "T4"
 },
 {
  "term": "Plugin",
  "en": "Plugin",
  "plain": "把 Skills、Connectors、指令、子代理、hooks 打包成一組，一次安裝；官方目錄裡的 Plugin 要 Pro 以上方案。跟 Office、Google 文件裡的「外掛（add-in）」是兩回事。",
  "lesson": "4-E1",
  "topic": "T4"
 },
 {
  "term": "Hook（掛勾）",
  "en": "Hook",
  "plain": "在固定時機（例如每次改完檔案）自動執行的指令。",
  "lesson": "12-4",
  "topic": "T12"
 },
 {
  "term": "斜線指令（slash command）",
  "en": "Slash command",
  "plain": "在輸入框打「/」叫出的快捷功能：claude.ai 裡會列出可用的 Skill；Claude Code 也有自己的一組斜線指令。",
  "lesson": "4-4",
  "topic": "T4"
 },
 {
  "term": "Artifact（成品頁）",
  "en": "Artifact",
  "plain": "Claude 在對話旁邊做出的獨立成品，例如網頁、文件、圖表，可以分享。",
  "lesson": "8-4",
  "topic": "T8"
 },
 {
  "term": "Projects",
  "en": "Project",
  "plain": "claude.ai 裡把檔案和指令放在一起的工作區，裡面的對話都會參考它們；免費版也有。跟存在你電腦上的 Cowork 專案是兩種東西。",
  "lesson": "4-3",
  "topic": "T4",
  "alias": [
   "Project"
  ]
 },
 {
  "term": "記憶",
  "en": "Memory",
  "plain": "AI 跨對話記住你的偏好和背景，在設定裡可以查看、修改、刪除或暫停。",
  "lesson": "4-2",
  "topic": "T4"
 },
 {
  "term": "個人化指令（Instructions）",
  "en": "Instructions / Custom instructions",
  "plain": "在 Claude 設定裡寫一次、就套用到所有對話的偏好，例如「用台灣繁體中文」；ChatGPT 叫 Custom instructions。",
  "lesson": "4-1",
  "topic": "T4"
 },
 {
  "term": "無痕對話",
  "en": "Incognito chat",
  "plain": "不進對話紀錄、不寫進記憶、不拿去訓練的對話；但仍會保留 30 天（企業方案依組織設定可能更久），不是「完全不保存」。目前只能在 Project 以外的對話使用。",
  "lesson": "1-5",
  "topic": "T1"
 },
 {
  "term": "Research（深入研究）",
  "en": "Research / Deep research",
  "plain": "AI 花幾分鐘到數十分鐘上網查很多來源，寫成附引用的報告；在 Claude 輸入框的工具選單裡開啟 Research。",
  "lesson": "3-4",
  "topic": "T3"
 },
 {
  "term": "Cowork",
  "en": "Cowork",
  "plain": "Claude 動手幫你做事的能力（讀寫資料夾、操作 app、做成品），付費方案才有；Pro、Max、Ultra 的 Chat 與 Cowork 正分批合併成同一個對話介面，Team、Enterprise 依組織設定。",
  "lesson": "5-1",
  "topic": "T5"
 },
 {
  "term": "電腦操作",
  "en": "Computer use",
  "plain": "AI 看螢幕、移動滑鼠、打字，直接操作電腦上的軟體。",
  "lesson": "5-E1",
  "topic": "T5"
 },
 {
  "term": "Claude Code",
  "en": "Claude Code",
  "plain": "Anthropic 的寫程式代理，可在桌面 app 的 Code 分頁、終端機、IDE、網頁版 claude.ai/code 使用；要付費方案。",
  "lesson": "10-2",
  "topic": "T10"
 },
 {
  "term": "headless 模式（無頭模式）",
  "en": "Headless mode",
  "plain": "不打開對話畫面，只在終端機打一行指令（claude -p \"任務\"）讓 Claude Code 做完，適合排程和自動化。",
  "lesson": "12-4",
  "topic": "T12"
 },
 {
  "term": "終端機",
  "en": "Terminal / CLI",
  "plain": "用打字下指令操作電腦的視窗（Mac 的「終端機」、Windows 的 PowerShell）；CLI 是「命令列介面」，指只能用打字操作的程式。",
  "lesson": "10-E1",
  "topic": "T10"
 },
 {
  "term": "整合開發環境",
  "en": "IDE (Integrated Development Environment)",
  "plain": "寫程式用的編輯軟體，例如 VS Code、Cursor。",
  "lesson": "10-E4",
  "topic": "T10"
 },
 {
  "term": "版本控制",
  "en": "Git / Version control",
  "plain": "記錄每次修改的工具，改壞了可以回到之前的版本。",
  "lesson": "10-E1",
  "topic": "T10"
 },
 {
  "term": "評估",
  "en": "Eval / Evaluation",
  "plain": "用一組固定的測試題檢查 AI 系統表現好不好，改版前後都跑一次。",
  "lesson": "15-1",
  "topic": "T15"
 },
 {
  "term": "基準測試",
  "en": "Benchmark",
  "plain": "比較模型能力的標準考卷；跑分高不代表你的用途就好用。",
  "lesson": "7-1",
  "topic": "T7"
 },
 {
  "term": "提示詞注入（prompt injection）",
  "en": "Prompt injection",
  "plain": "把惡意指令藏在網頁、檔案、信件或工具說明裡，騙 AI 照做，例如偷傳資料；AI 能動手的權限越大越危險。",
  "lesson": "6-2",
  "topic": "T6"
 },
 {
  "term": "越獄",
  "en": "Jailbreak",
  "plain": "用話術讓 AI 繞過安全規則；違反使用政策。",
  "lesson": "15-3",
  "topic": "T15"
 },
 {
  "term": "護欄",
  "en": "Guardrails",
  "plain": "限制 AI 能做什麼、不能做什麼的規則和檢查。",
  "lesson": "15-3",
  "topic": "T15"
 },
 {
  "term": "對齊",
  "en": "Alignment",
  "plain": "讓 AI 的行為符合人類意圖和價值的研究與做法。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "深偽",
  "en": "Deepfake",
  "plain": "用 AI 做出以假亂真的影像或聲音，常被用在詐騙。",
  "lesson": "9-4",
  "topic": "T9"
 },
 {
  "term": "聲音複製",
  "en": "Voice cloning",
  "plain": "用一段錄音讓 AI 模仿某人的聲音；只能用自己或有同意的聲音。",
  "lesson": "9-E3",
  "topic": "T9"
 },
 {
  "term": "文字轉語音",
  "en": "Text-to-Speech (TTS)",
  "plain": "把文字念成語音的 AI。",
  "lesson": "9-E3",
  "topic": "T9"
 },
 {
  "term": "語音轉文字",
  "en": "Speech-to-Text (STT)",
  "plain": "把錄音轉成逐字稿的 AI，例如 Whisper。",
  "lesson": "6-E3",
  "topic": "T6"
 },
 {
  "term": "文字生圖",
  "en": "Text-to-Image",
  "plain": "輸入描述，AI 產生圖片。",
  "lesson": "9-1",
  "topic": "T9"
 },
 {
  "term": "圖片生影片",
  "en": "Image-to-Video",
  "plain": "給一張圖，AI 讓它動起來成為短影片，比文字生影片好控制。",
  "lesson": "9-3",
  "topic": "T9"
 },
 {
  "term": "局部重繪",
  "en": "Inpainting",
  "plain": "框起圖片的一塊只改那裡，其他不動。",
  "lesson": "9-1",
  "topic": "T9"
 },
 {
  "term": "擴散模型",
  "en": "Diffusion model",
  "plain": "許多生圖、生影片工具用的原理：從一張雜訊開始，一步步去除雜訊，變成符合描述的圖片。",
  "lesson": "9-1",
  "topic": "T9"
 },
 {
  "term": "合理使用",
  "en": "Fair use",
  "plain": "法律允許在某些條件下不經授權使用他人作品（美國叫 fair use，台灣規定在著作權法第 65 條）；AI 訓練算不算，各國法院判法不一，仍有爭議。",
  "lesson": "9-4",
  "topic": "T9"
 },
 {
  "term": "AI 標示",
  "en": "AI disclosure / labeling",
  "plain": "告訴觀眾內容由 AI 生成或修改，平台和部分法規有要求；支援的 Claude 模型產出的文字和檔案也會帶浮水印或內容憑證（見 9-4）。",
  "lesson": "1-5",
  "topic": "T1"
 },
 {
  "term": "去識別化",
  "en": "De-identification",
  "plain": "把姓名、電話、病歷號等能認出個人的資料換掉或拿掉。",
  "lesson": "1-5",
  "topic": "T1"
 },
 {
  "term": "零資料保留",
  "en": "Zero Data Retention (ZDR)",
  "plain": "服務商承諾不保存你送出的提示詞和回答；通常要另外簽約，不是預設。",
  "lesson": "15-4",
  "topic": "T15"
 },
 {
  "term": "使用政策",
  "en": "Usage Policy",
  "plain": "AI 公司規定哪些用途不准做，違反可能被停權；Anthropic 新版 2026-11-12 生效。",
  "lesson": "15-E3",
  "topic": "T15"
 },
 {
  "term": "人工智慧基本法",
  "en": "Taiwan AI Basic Act",
  "plain": "台灣的 AI 框架法，2025-12-23 三讀、2026-01-14 公布施行，列出七大原則；中央主管機關是國科會，風險分類框架由數位發展部訂定。",
  "topic": "T17"
 },
 {
  "term": "歐盟 AI 法",
  "en": "EU AI Act",
  "plain": "歐盟依風險分級管理 AI 的法律；告知使用者正在和 AI 對話、深偽內容標示從 2026-08-02 起適用，AI 內容的機器可讀浮水印期限可能延後。",
  "topic": "T17"
 },
 {
  "term": "排程任務",
  "en": "Scheduled task / Routine",
  "plain": "設定好時間讓 AI 自動執行的工作，例如每天早上整理信件。",
  "lesson": "6-3",
  "topic": "T6"
 },
 {
  "term": "批次處理",
  "en": "Batch processing (Message Batches API)",
  "plain": "一次送很多請求給 API 慢慢處理，比較便宜（Claude API 半價）。",
  "lesson": "15-5",
  "topic": "T15"
 },
 {
  "term": "提示快取",
  "en": "Prompt caching",
  "plain": "重複送的長內容被暫存，下次讀取便宜很多。",
  "lesson": "15-5",
  "topic": "T15"
 },
 {
  "term": "串流輸出",
  "en": "Streaming",
  "plain": "AI 一邊產生一邊顯示文字，不用等全部寫完。",
  "lesson": "16-3",
  "topic": "T16"
 },
 {
  "term": "結構化輸出",
  "en": "Structured output",
  "plain": "要求 AI 照固定格式（例如 JSON）回答，方便程式讀。",
  "lesson": "12-E2",
  "topic": "T12"
 },
 {
  "term": "額度",
  "en": "Usage limit",
  "plain": "訂閱方案在一段時間內能用多少（例如每 5 小時、每週），用完要等重置或加購 usage credits。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "搜尋型 AI",
  "en": "AI search / Answer engine",
  "plain": "先上網搜尋再回答並附來源的 AI，例如 Perplexity。",
  "lesson": "3-E2",
  "topic": "T3"
 },
 {
  "term": "Gem",
  "en": "Gem",
  "plain": "Gemini 裡存一組固定角色和做法的自訂助手，類似 Claude 的 Project 指令。Google 正把 Gems 換成 skills：2026-11-17 起 Gems 移到設定頁，個人帳號之後會轉成 skills，公司與學校帳號 2027 年才轉。",
  "lesson": "7-E1",
  "topic": "T7"
 },
 {
  "term": "GPTs（自訂 GPT）",
  "en": "Custom GPT",
  "plain": "ChatGPT 裡自己或別人做的專用聊天機器人。OpenAI 預定 2026-12-11 停用，指令會轉成 plugin 裡的 skill，自訂 actions 要自己重做。",
  "lesson": "7-1",
  "topic": "T7"
 },
 {
  "term": "AGENTS.md／CLAUDE.md",
  "en": "Agent instruction file",
  "plain": "放在專案資料夾裡給寫程式代理看的規則說明檔。Claude Code 優先讀 CLAUDE.md；2026-09 起，專案裡沒有 CLAUDE.md 時會改讀 AGENTS.md。",
  "lesson": "10-5",
  "topic": "T10"
 },
 {
  "term": "Python",
  "en": "Python",
  "plain": "最常拿來寫 AI 小程式的程式語言，語法接近英文；裝好後在終端機打 python3（Windows 是 python 或 py）執行。",
  "topic": "T10"
 },
 {
  "term": "pip 與虛擬環境",
  "en": "pip / venv",
  "plain": "pip 是安裝 Python 套件的指令；venv 替每個專案建立一個獨立的套件環境，不同專案的套件不會互相衝突。",
  "topic": "T10"
 },
 {
  "term": "JSON",
  "en": "JSON",
  "plain": "一種用大括號、中括號寫資料的純文字格式，程式和 API 之間交換資料大多用它，例如 {\"name\": \"阿明\", \"score\": 90}。",
  "lesson": "12-E2",
  "topic": "T12"
 },
 {
  "term": "HTTP",
  "en": "HTTP",
  "plain": "瀏覽器和程式跟網站伺服器講話的規則：送出一個請求（request），拿回一個回應（response）。",
  "lesson": "14-E1",
  "topic": "T14"
 },
 {
  "term": "HTTP 狀態碼",
  "en": "HTTP status code",
  "plain": "伺服器回應附的三位數號碼：200 成功、400 請求格式錯誤、401 沒登入或金鑰錯、429 太頻繁或超過上限、500 對方出錯、529 Claude 伺服器暫時太忙（稍後重試）。",
  "lesson": "14-5",
  "topic": "T14"
 },
 {
  "term": "環境變數",
  "en": "Environment variable",
  "plain": "存在電腦或終端機視窗裡的設定值，程式執行時讀得到，例如 API 金鑰放在 ANTHROPIC_API_KEY 就不用寫進程式；金鑰怎麼放才安全見 14-4。",
  "lesson": "14-4",
  "topic": "T14"
 },
 {
  "term": "PATH",
  "en": "PATH",
  "plain": "一個環境變數，記錄電腦要去哪些資料夾找指令；「command not found」常是因為程式不在 PATH 裡。",
  "lesson": "10-E1",
  "topic": "T10"
 },
 {
  "term": "curl",
  "en": "curl",
  "plain": "在終端機送出網路請求的指令，常用來測試 API。",
  "lesson": "14-E1",
  "topic": "T14"
 },
 {
  "term": "localhost",
  "en": "localhost",
  "plain": "「這台電腦自己」的網址，例如本機預覽網站時看到的 http://localhost:3000；別台電腦預設連不到。",
  "lesson": "10-1",
  "topic": "T10"
 },
 {
  "term": "Node.js 與 npm",
  "en": "Node.js / npm",
  "plain": "Node.js 讓電腦能跑 JavaScript 程式；npm 是它的套件安裝工具，很多 AI 工具和 MCP server 用 npm 安裝。",
  "lesson": "10-E1",
  "topic": "T10"
 },
 {
  "term": "純文字檔",
  "en": "Plain text file",
  "plain": "只有文字、沒有排版的檔案（.txt、.md、.json）；設定檔一定要存成純文字，用 Word 存會壞掉。",
  "lesson": "4-E3",
  "topic": "T4"
 },
 {
  "term": "副檔名",
  "en": "File extension",
  "plain": "檔名最後點後面的字（.md、.json、.pdf），決定檔案是什麼格式；Mac 的 Finder、Windows 的檔案總管要打開「顯示副檔名」才看得到。",
  "lesson": "4-E3",
  "topic": "T4"
 },
 {
  "term": "Markdown",
  "en": "Markdown",
  "plain": "用簡單符號排版的純文字寫法：# 是標題、- 是條列、**字** 是粗體；Claude 的 Skill、CLAUDE.md 都用它寫。",
  "lesson": "4-E3",
  "topic": "T4"
 },
 {
  "term": "YAML 與 frontmatter",
  "en": "YAML / frontmatter",
  "plain": "YAML 是用「名稱: 值」一行一行寫設定的格式；frontmatter 是放在 Markdown 檔最上面、用兩行 --- 夾起來的那段 YAML，例如 SKILL.md 開頭的 name 和 description。",
  "lesson": "4-5",
  "topic": "T4"
 },
 {
  "term": "HTML",
  "en": "HTML",
  "plain": "網頁的原始碼格式，瀏覽器讀了才畫出網頁；Claude 做的互動頁、Artifact 多半是 HTML。",
  "lesson": "8-4",
  "topic": "T8"
 },
 {
  "term": "SVG",
  "en": "SVG",
  "plain": "用文字描述的向量圖，放大不會糊；Claude 畫圖表、示意圖常用它，但它不是照片。",
  "lesson": "8-4",
  "topic": "T8"
 },
 {
  "term": "Custom visuals",
  "en": "Custom visuals",
  "plain": "Claude 在對話裡直接畫出的圖表與互動視覺（測試版，手機 app 不顯示）；不是生成照片或插畫。",
  "lesson": "8-4",
  "topic": "T8"
 },
 {
  "term": "repo（儲存庫）",
  "en": "Repository",
  "plain": "用 git 管理的專案資料夾，裡面記著每一次修改；放上 GitHub 就能跟別人共用。",
  "lesson": "10-E1",
  "topic": "T10"
 },
 {
  "term": "commit（提交）",
  "en": "Commit",
  "plain": "在 git 裡存一個「存檔點」，寫一句說明這次改了什麼，之後可以倒回來。",
  "lesson": "10-3",
  "topic": "T10"
 },
 {
  "term": "branch（分支）",
  "en": "Branch",
  "plain": "從主線複製出一條平行的修改線，在上面修改不影響主線，確認沒問題再合併。",
  "lesson": "10-E1",
  "topic": "T10"
 },
 {
  "term": "PR（合併請求）",
  "en": "Pull request",
  "plain": "在 GitHub 上提出「請把我這條分支的修改合併進主線」，讓別人（或 Claude）先審過。",
  "lesson": "10-E1",
  "topic": "T10"
 },
 {
  "term": "diff（差異）",
  "en": "Diff",
  "plain": "兩個版本之間改了哪些行的對照，紅色是刪掉、綠色是加上。",
  "lesson": "10-3",
  "topic": "T10"
 },
 {
  "term": "worktree",
  "en": "Git worktree",
  "plain": "同一個 repo 同時開出好幾個資料夾，各在不同分支上工作，讓好幾個 Claude 同時做不同事又不互相干擾。",
  "lesson": "13-3",
  "topic": "T13"
 },
 {
  "term": "agent loop（代理迴圈）",
  "en": "Agent loop / agentic loop",
  "plain": "代理做事的迴圈：收到任務 → 讀資料 → 動手（呼叫工具）→ 看結果 → 決定下一步，直到完成或碰到停止條件。設計整個會自己重跑、檢查、停下的流程，則叫 loop engineering。",
  "lesson": "12-1",
  "topic": "T12"
 },
 {
  "term": "權限模式",
  "en": "Permission mode",
  "plain": "決定 Claude 動手前要不要先問你：Claude Code 有 Ask permissions、Accept edits、Plan mode、Auto（要先在設定開啟）等模式。",
  "lesson": "10-5",
  "topic": "T10"
 },
 {
  "term": "沙盒",
  "en": "Sandbox",
  "plain": "把程式關進一個限制好的環境裡跑，能碰哪些檔案、連哪些網站要看設定，不是什麼都碰不到。Claude Code 的沙盒只限制它執行的指令；MCP、hooks、mod 不受沙盒限制。",
  "lesson": "10-5",
  "topic": "T10"
 },
 {
  "term": "對外連線",
  "en": "Network egress",
  "plain": "程式從沙盒或電腦往外連網路。Claude 程式碼執行功能的網路設定可以關掉或限制網域，擋住沙盒裡的程式往外送資料；但 Connector、MCP 走的是別條路，不受這個設定限制。",
  "lesson": "15-4",
  "topic": "T15"
 },
 {
  "term": "信任的資料夾",
  "en": "Trusted folders",
  "plain": "你授權 Claude 桌面 app 讀寫的本機資料夾清單，只有清單裡的它碰得到。",
  "lesson": "5-4",
  "topic": "T5"
 },
 {
  "term": "Cowork 專案",
  "en": "Cowork project",
  "plain": "Cowork 的工作區：固定指令、排程任務、專案記憶與參考資料（本機資料夾、網址等）放在一起。專案存在你的 Claude 帳號裡，換裝置也看得到；加進來的本機資料夾和檔案則留在你的電腦上。跟 claude.ai 的 Projects 是兩種東西。",
  "lesson": "5-1",
  "topic": "T5"
 },
 {
  "term": "OAuth（授權登入）",
  "en": "OAuth",
  "plain": "「用某帳號登入並授權」的標準做法：你在對方網站登入、按允許，工具拿到一張有範圍的通行證，不用知道你的密碼。",
  "lesson": "6-2",
  "topic": "T6"
 },
 {
  "term": "CIMD",
  "en": "Client ID Metadata Documents",
  "plain": "開發者用的 MCP 授權做法：用戶端用一個 HTTPS 網址當自己的身分，網址上放一份描述自己的 JSON，伺服器照它驗證，不用事先註冊。",
  "topic": "T12"
 },
 {
  "term": "tool poisoning（工具投毒）",
  "en": "Tool poisoning",
  "plain": "在 MCP 工具的說明文字裡藏惡意指令，AI 讀到工具清單時就被騙；使用者通常看不到這些說明。",
  "lesson": "6-2",
  "topic": "T6"
 },
 {
  "term": "rug pull（抽地毯）",
  "en": "Rug pull",
  "plain": "MCP server 先給你看無害的工具，你核准後再偷偷改掉工具的內容或說明；防法是鎖定（pin）工具清單，改了就重新審。",
  "lesson": "6-2",
  "topic": "T6"
 },
 {
  "term": "致命三要素",
  "en": "Lethal trifecta",
  "plain": "agent 同時「讀得到私密資料」「會讀不可信的內容」「能往外傳送」時，就可能被提示詞注入偷走資料；三者至少要切斷一個。",
  "lesson": "6-2",
  "topic": "T6"
 },
 {
  "term": "cron",
  "en": "cron",
  "plain": "用五個欄位（分、時、日、月、星期）寫「什麼時候執行」的格式，例如 0 8 * * 1 是每週一 8 點。有些服務用 UTC 解讀（台灣時間要減 8 小時），設好後先看畫面上換算出來的時間。",
  "lesson": "12-4",
  "topic": "T12"
 },
 {
  "term": "webhook",
  "en": "Webhook",
  "plain": "一個網址：事情發生時，別的服務會自動呼叫這個網址通知你，例如表單有人送出就啟動流程。",
  "lesson": "12-E1",
  "topic": "T12"
 },
 {
  "term": "冪等",
  "en": "Idempotent",
  "plain": "同一件事重跑一次，結果跟跑一次一樣、不會重複；自動化寫入資料前要先查有沒有，才不會重跑就多一筆。",
  "lesson": "12-5",
  "topic": "T12"
 },
 {
  "term": "usage credits（用量加值）",
  "en": "Usage credits",
  "plain": "訂閱額度之外另外付費的用量。額度用完後可以用它繼續使用；Fable 上市優惠結束後（台灣時間 2026-11-17 起），Pro 與 Team 標準席使用 Fable 也從這裡扣。跟 API credits 不同。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "API credits",
  "en": "API credits",
  "plain": "在 Claude Console 給 API 用的金額，跟 claude.ai 的訂閱額度分開。Max、Ultra、Team 方案每月另附一筆，要在帳單設定連結 Console 才領得到，當月沒用完不累積。",
  "lesson": "14-4",
  "topic": "T14"
 },
 {
  "term": "workspace（工作區）",
  "en": "Workspace",
  "plain": "Claude Console 裡分隔 API 金鑰、花費上限和用量的單位，一個組織最多 100 個；跟 claude.ai 的 Project 無關。",
  "lesson": "14-4",
  "topic": "T14"
 },
 {
  "term": "Verified／Community Connector",
  "en": "Verified / Community connector",
  "plain": "Connector 目錄裡的標記：Verified 表示 Anthropic 審查過品質與安全（不等於完整的安全稽核）；Community 是第三方開發、只經初步篩選，連接前會出現提醒；自己用網址加的叫自訂（custom）Connector。三種接上後的權限一樣。",
  "lesson": "6-2",
  "topic": "T6"
 },
 {
  "term": "Remote Control（遠端操控）",
  "en": "Remote Control",
  "plain": "在手機或另一台裝置上，繼續操控你電腦上正在跑的 Claude Code 工作階段（session）；電腦要開著、不能休眠。",
  "lesson": "10-E3",
  "topic": "T10"
 },
 {
  "term": "Claude 模型名稱",
  "en": "Fable / Opus / Sonnet / Haiku",
  "plain": "Claude 的模型分級，由強到快：Fable、Opus、Sonnet、Haiku（小而快、便宜）。2026-11 最新是 Fable 5.2（11/09 上線）與 Opus 5.5、Sonnet 5.5、Haiku 5.5；名稱會換，以畫面上的選單為準。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "自動記憶",
  "en": "Auto memory",
  "plain": "Claude Code 自己記下的專案筆記（存在 MEMORY.md），跟你手寫的 CLAUDE.md 分開。",
  "lesson": "10-5",
  "topic": "T10"
 },
 {
  "term": "壓縮對話",
  "en": "Compaction",
  "plain": "對話太長時，把前面的內容濃縮成摘要繼續做；Claude Code 用 /compact，claude.ai 的長對話也會自動壓縮。",
  "lesson": "10-E2",
  "topic": "T10"
 },
 {
  "term": "雲端 session",
  "en": "Cloud session",
  "plain": "在 Anthropic 的雲端電腦上跑的 Claude Code，關掉你的電腦也會繼續做，網址是 claude.ai/code。",
  "lesson": "10-E3",
  "topic": "T10"
 },
 {
  "term": "本地 embedding",
  "en": "Local embedding",
  "plain": "在自己電腦上把文字轉成向量，資料不用傳出去，適合先在本機找段落、再把去識別化的片段交給雲端 AI。",
  "lesson": "13-E4",
  "topic": "T13"
 },
 {
  "term": "mod",
  "en": "Mod",
  "plain": "Claude Code 的一種 Plugin，能加面板、指令或自動動作。它不在沙盒裡，用你的權限讀寫檔案、連網，只裝信得過的來源（安全審查見 15-E1）。",
  "lesson": "4-E1",
  "topic": "T4"
 },
 {
  "term": "channels（推訊息進 session）",
  "en": "Channels",
  "plain": "把 Telegram、Discord、iMessage 或 webhook 的訊息推進你正在跑的 Claude Code session，讓它在你不在電腦前時也能接到事情、回覆你。研究預覽；公司帳號要管理員先開啟。",
  "lesson": "10-E3",
  "topic": "T10"
 },
 {
  "term": "Claude Security（弱點掃描 Plugin）",
  "en": "Claude Security plugin",
  "plain": "Claude Code 的弱點掃描 Plugin（測試版，指令 /claude-security）：多個 agent 分工找漏洞並互相複查，輸出報告（含開發工具通用的 SARIF 格式）和修補檔；修補檔不會自動套用，要自己看過再套用。",
  "topic": "T15"
 },
 {
  "term": "Claude Tag",
  "en": "Claude Tag",
  "plain": "在 Slack 頻道裡 @Claude 交辦工作的組織功能（公開測試），它在雲端沙盒裡做事、把進度貼回討論串。只有 Team、Enterprise 有，個人方案沒有；頻道裡的用量從組織的餘額扣。",
  "lesson": "17-2",
  "topic": "T17"
 },
 {
  "term": "A2A（agent 對 agent 協定）",
  "en": "Agent2Agent (A2A)",
  "plain": "讓不同公司、不同框架做的 agent 互相找到對方、交辦任務、回傳結果的開放協定，由 Google 提出、現在由 Linux Foundation 維護。跟 MCP 分工：MCP 是 agent 拿工具，A2A 是 agent 找別的 agent。",
  "lesson": "13-1",
  "topic": "T13"
 },
 {
  "term": "MCP client",
  "en": "MCP client",
  "plain": "在 host（Claude Desktop、Claude Code 或你自己的程式）裡面，負責連上 MCP server、列出工具、把呼叫轉過去的那一段。平常 Claude 的 app 幫你處理，自己寫 AI 應用時才要自己寫。",
  "lesson": "12-3",
  "topic": "T12"
 },
 {
  "term": "MCP Apps",
  "en": "MCP Apps",
  "plain": "MCP 的官方擴充（已進入 Stable 階段）：外部工具可以在對話裡顯示可點的畫面，例如圖表、表單、影片播放器；不支援的 app 會退回純文字。跟 Claude 的 Custom visuals 同屬生成式介面，差別是畫面由外部工具提供。",
  "lesson": "12-3",
  "topic": "T12"
 },
 {
  "term": "MCP 擴充",
  "en": "MCP extensions",
  "plain": "MCP 核心規格以外的選用功能，例如 MCP Apps、Skills over MCP、Tasks；分 Experimental、Beta、Stable 三個階段，雙方都宣告支援才會用。",
  "lesson": "12-3",
  "topic": "T12"
 },
 {
  "term": "API 裡的 Skills",
  "en": "Agent Skills in the API",
  "plain": "給寫程式的人：在自己的程式裡使用 Skill 的方法。在 Claude API 用 container.skills 載入 Anthropic 內建的 pptx、xlsx、docx、pdf Skill，或用 /v1/skills 上傳自己的 SKILL.md；一定要同時開 code execution 工具，一次最多 20 個。自訂 Skill 是整個 workspace 共用，不是每個使用者各一份。",
  "lesson": "14-E1",
  "topic": "T14"
 },
 {
  "term": "長期記憶",
  "en": "Long-term memory",
  "plain": "讓 agent 跨對話、跨 session 記得事情的設計：要決定記什麼、存在哪、什麼時候讀、什麼時候忘、誰看得到。Claude 對話裡的「記憶」是現成版本，自己做 agent 時要自己設計。",
  "lesson": "4-2",
  "topic": "T4"
 },
 {
  "term": "情節記憶",
  "en": "Episodic memory",
  "plain": "記「做過什麼」：上次怎麼處理、哪裡出錯，像日記。",
  "topic": "T4"
 },
 {
  "term": "語意記憶",
  "en": "Semantic memory",
  "plain": "記「事實和偏好」：使用者喜歡什麼格式、專案用什麼規則，像筆記本。",
  "topic": "T4"
 },
 {
  "term": "程序記憶",
  "en": "Procedural memory",
  "plain": "記「事情怎麼做」：方法和步驟。在 Claude 的世界裡，Skill 就是一種程序記憶。",
  "topic": "T4"
 },
 {
  "term": "memory store（記憶庫）",
  "en": "Memory store",
  "plain": "Claude Managed Agents 的長期記憶（測試版）：一組文字檔，接到 session 時掛成沙盒裡的一個資料夾，agent 用檔案工具讀寫；每次修改都留一個版本，可以回溯。",
  "topic": "T12"
 },
 {
  "term": "錯誤分析",
  "en": "Error analysis",
  "plain": "把失敗的案例一筆一筆看完、依原因分類計數，先修數量最多的那一類，而不是憑感覺亂改提示詞。eval 分數低時的第一步。",
  "lesson": "15-1",
  "topic": "T15"
 },
 {
  "term": "線上評估",
  "en": "Online evaluation",
  "plain": "產品上線後，從真實使用紀錄抽樣評分，再看使用者回饋和轉人工的比例；品質往下掉就把失敗案例補進測試集。跟上線前跑固定題目的離線 eval 互補。",
  "lesson": "15-E2",
  "topic": "T15"
 },
 {
  "term": "LoRA",
  "en": "LoRA (Low-Rank Adaptation)",
  "plain": "省資源的微調方法：原模型不動，只另外訓練一小組附加參數，存成一個小檔（adapter），用的時候跟原模型一起載入。"
 },
 {
  "term": "QLoRA",
  "en": "QLoRA",
  "plain": "先把模型量化成 4-bit 再做 LoRA，記憶體需求更低，筆電也有機會微調小模型。",
  "topic": "T13"
 },
 {
  "term": "adapter（微調附加檔）",
  "en": "Adapter",
  "plain": "LoRA 訓練出來的小檔案，記錄「要在原模型上加什麼改變」；要跟同一個版本的底模型一起用，也可以合併回模型。"
 },
 {
  "term": "蒸餾",
  "en": "Distillation",
  "plain": "用大型模型的答案當教材去訓練小模型。很多服務條款禁止這樣用（例如 Anthropic 消費者條款第 3 條、商業條款 D.4）；用大量假帳號抄別家模型的回答來訓練，稱為「蒸餾攻擊」。",
  "lesson": "7-E4",
  "topic": "T7"
 },
 {
  "term": "Team 方案",
  "en": "Claude Team plan",
  "plain": "給 2–150 人團隊的 Claude 付費方案：有集中帳單、管理員控制、SSO，預設不拿內容訓練，可以混搭標準席和 Premium 席；開通與管理見 17-2。",
  "lesson": "17-2",
  "topic": "T17"
 },
 {
  "term": "席位",
  "en": "Seat",
  "plain": "公司方案按人頭算錢的單位，一個人佔一席；Team 可以混搭標準席和用量約 5 倍的 Premium 席。",
  "lesson": "17-2",
  "topic": "T17"
 },
 {
  "term": "Owner（組織擁有者）",
  "en": "Owner / Primary Owner",
  "plain": "Team、Enterprise 組織裡權限最高的角色：管成員和帳單，決定組織能開哪些 Connector、成員寄信刪檔要不要批准、能不能用 Claude Tag（Slack 裡的 Claude）和 channels（推訊息進 Claude Code）。",
  "lesson": "17-2",
  "topic": "T17"
 },
 {
  "term": "影子 AI",
  "en": "Shadow AI",
  "plain": "員工用個人帳號的 AI 處理公司資料，公司不知道、也管不到。導入 AI 時要給一條合規的路，而不是只禁止。",
  "topic": "T17"
 },
 {
  "term": "ReAct（想、做、看）",
  "en": "ReAct (Reason + Act)",
  "plain": "agent loop 最常見的寫法：先推理、再呼叫工具、再看結果，決定下一步，直到完成。名稱來自 2022 年的論文（Reason + Act）。",
  "lesson": "12-1",
  "topic": "T12"
 },
 {
  "term": "先計畫再執行",
  "en": "Plan-and-execute",
  "plain": "先讓 AI 列出完整計畫、你看過，再讓它照計畫做；Claude Code 的 Plan mode 就是這個做法。",
  "lesson": "10-4",
  "topic": "T10"
 },
 {
  "term": "自我檢查",
  "en": "Reflection / Self-critique",
  "plain": "讓 AI 做完後先自己（或另一個 AI）檢查、找問題、再改一版，是常見的品質把關做法。",
  "lesson": "8-5",
  "topic": "T8"
 },
 {
  "term": "規格驅動開發",
  "en": "Spec-driven development",
  "plain": "寫程式前先寫一份規格檔（要做什麼、不做什麼、怎麼驗收），再叫 AI 照規格出計畫和程式，比直接說「幫我做」穩。",
  "lesson": "10-4",
  "topic": "T10"
 },
 {
  "term": "agent teams（代理團隊）",
  "en": "Agent teams",
  "plain": "Claude Code 的研究預覽功能（預設關閉）：一個主導的 session 帶幾個隊友 session 分工，隊友之間可以互傳訊息；跟一般子代理不同，隊友是完整的 session。",
  "lesson": "13-E2",
  "topic": "T13"
 },
 {
  "term": "dynamic workflows（動態工作流程）",
  "en": "Dynamic workflows",
  "plain": "Claude Code 讓 Claude 自己規劃流程、一次派出很多個子代理並行做事的功能（研究預覽），所有付費方案都有；Pro 要先在 /config 打開，Enterprise 預設關閉、要管理員開啟。跟固定流程不同，步驟由 Claude 臨場決定。",
  "lesson": "13-2",
  "topic": "T13"
 },
 {
  "term": "可操控性",
  "en": "Steerability",
  "plain": "你能用指令把模型的語氣、格式、行為調到多遠；安全底線之類的事，怎麼下指令都調不動。",
  "lesson": "1-E1",
  "topic": "T1"
 },
 {
  "term": "負責任擴展政策",
  "en": "Responsible Scaling Policy (RSP)",
  "plain": "Anthropic 自願公開的模型安全框架。2026-02 起是第 3 版（之後陸續小修）：新模型發布前評估災難性風險，公開風險報告與安全路線圖，並由內部負責人與董事會監督。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "System card（模型說明書）",
  "en": "System card",
  "plain": "模型發布時附的長篇報告：測了哪些能力、有哪些風險、做了哪些安全措施。想知道一個模型的限制，看這份比看廣告準。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "AI Fluency 4D",
  "en": "AI Fluency 4D (Delegation, Description, Discernment, Diligence)",
  "plain": "Anthropic 官方免費 AI 素養課的四個能力：委派（哪些事交給 AI）、描述（把需求講清楚）、判斷（檢查結果）、負責（用得正當、對結果負責）。",
  "lesson": "1-5",
  "topic": "T1"
 },
 {
  "term": "LINE Notify",
  "en": "LINE Notify",
  "plain": "LINE 以前的免費通知服務，2025-03-31 已經停止；很多舊教學還在教用它發自動化通知，現在要改用 LINE Messaging API（超過免費則數要付費）、Email 或其他通知方式。",
  "lesson": "14-E2",
  "topic": "T14"
 },
 {
  "term": "Google Apps Script",
  "en": "Google Apps Script",
  "plain": "Google 試算表、文件、Gmail 內建的小程式（JavaScript 寫的），能做自動寄提醒、整理表單回覆這類事；可以叫 Claude 寫，但先在副本上試跑。",
  "lesson": "6-E1",
  "topic": "T6"
 },
 {
  "term": "C2PA 內容憑證",
  "en": "C2PA Content Credentials",
  "plain": "附在圖片等檔案裡、有簽章的「來源資料」，記錄這個檔案是哪個 AI 或工具做的。Claude 產生的 PNG、JPG 等檔案會帶，可以用免費的檢查頁 claude.com/check-files 查（圖片、影片、聲音檔都能查，檢查在瀏覽器內進行、檔案不會上傳）；截圖或轉檔後可能就查不到。",
  "lesson": "9-4",
  "topic": "T9"
 },
 {
  "term": "AI 文字浮水印",
  "en": "Text watermark",
  "plain": "藏在 AI 寫出的文字裡、人看不出來的記號。支援的 Claude 模型會自動加，不改內容；文字的偵測目前是私人預覽，只開給符合條件的組織（例如教育機構、媒體、研究者）申請，一般人用的檔案檢查頁不查文字。",
  "lesson": "1-5",
  "topic": "T1"
 },
 {
  "term": "正式版（GA）／測試版（Beta）",
  "en": "General availability / Beta",
  "plain": "GA 是正式上線、大家都能穩定用；Beta 是測試版，功能和名稱可能還會改，偶爾會壞。標示「測試版」的功能，用之前先確認現況。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "分批推送",
  "en": "Staged rollout",
  "plain": "新功能不是同一天給所有人，而是一批一批開；所以別人有、你還沒有是正常的。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "研究預覽",
  "en": "Research preview",
  "plain": "比測試版更早期的實驗功能，隨時可能改或拿掉，通常要自己打開；不要拿來跑重要的事。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "即將淘汰（deprecated）",
  "en": "Deprecated",
  "plain": "官方宣布不再建議使用、之後會拿掉的功能、指令或參數。看舊教學時最常遇到，改了什麼查官方 changelog。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "changelog（更新紀錄）",
  "en": "Changelog",
  "plain": "官方逐版列出新增、修改、拿掉了什麼的頁面；想知道某個功能從哪一版開始有、舊指令還能不能用，就查它。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "國外交易手續費",
  "en": "Foreign transaction fee",
  "plain": "用台灣的信用卡刷外幣（例如美元訂閱）時，發卡銀行另外收的手續費；費率各家不同，看你的發卡銀行公告。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "Access blocked（公司帳號被擋）",
  "en": "Access blocked",
  "plain": "用公司或學校的 Google 帳號連 Claude 時跳出的錯誤：管理員還沒允許這個 app。只能請 Google Workspace 管理員處理，自己改不了。",
  "lesson": "6-1",
  "topic": "T6"
 },
 {
  "term": "事件應變卡",
  "en": "Incident card",
  "plain": "本課程的出事應變五步：停（先停下 agent 或連線）、收（撤銷權限、換金鑰）、查（看紀錄找影響範圍）、報（通知主管、當事人或主管機關）、記（寫下經過和改善）。",
  "lesson": "15-4",
  "topic": "T15"
 },
 {
  "term": "金鑰外洩",
  "en": "Leaked API key",
  "plain": "API 金鑰被貼到別人看得到的地方。公開 GitHub repo 裡的 Anthropic 金鑰會被自動停用並寄信通知；有開 push protection 的 repo 會在 push 時被擋下（見 push protection）。私人 repo、聊天群組、截圖沒有自動保護；不論有沒有被擋，都要自己換新金鑰、查用量。",
  "lesson": "14-4",
  "topic": "T14"
 },
 {
  "term": "push protection（推送保護）",
  "en": "GitHub push protection",
  "plain": "GitHub 在你 push 程式時檢查裡面有沒有金鑰、密碼，有就先擋下來，讓機密不會進到 repo。要那個 repo 有開 secret scanning 才有作用（免費的公開 repo 也算）；2026-10-13 起預設會擋 Anthropic 的金鑰。",
  "lesson": "14-4",
  "topic": "T14"
 },
 {
  "term": "個資外洩通報",
  "en": "Data breach notification",
  "plain": "個資被竊取、洩漏時，依個資法第 12 條要查明後以適當方式通知當事人；修正版另外要求一定範圍內要通報主管機關，但施行日期還沒定。公司或學校通常有自己的通報窗口，個人發現時當天就要告訴對的人。",
  "lesson": "15-4",
  "topic": "T15"
 },
 {
  "term": "紅黃綠資料分級",
  "en": "Data classification (red / yellow / green)",
  "plain": "本課程共用的資料三色分級：紅色＝機密與個資（密碼、身分證字號、病歷、別人的個資），永遠不貼；黃色＝內部資料（公司文件、合約草稿、別人的作業），先問規定或去識別化再貼；綠色＝公開資料或你自己寫的東西，可以貼。",
  "lesson": "1-5",
  "topic": "T1"
 },
 {
  "term": "交接摘要（下次接著做）",
  "en": "Handoff summary",
  "plain": "對話太長或要換工具時，請 AI 寫一份摘要帶到新對話：目標、已完成、已決定、還沒做、要帶過去的檔案。貼進新對話就能接著做，不用重講。",
  "lesson": "7-4",
  "topic": "T7"
 },
 {
  "term": "traceback（錯誤追蹤）",
  "en": "Traceback",
  "plain": "Python 程式出錯時印出的一串訊息。由下往上讀：最後一行是錯誤類型，往上找第一個你自己的檔案和行號，就是出錯的地方。問 AI 時整段貼上，先遮掉金鑰和個資。",
  "topic": "T10"
 },
 {
  "term": "workflow（固定流程）",
  "en": "Workflow",
  "plain": "步驟由人事先排好、每次走同一條路的自動化，例如「讀信 → 摘要 → 寫進試算表」；跟 agent 不同，agent 是模型自己決定下一步。Zapier、n8n 做的多半是這種。",
  "lesson": "12-1",
  "topic": "T12"
 },
 {
  "term": "任務環境評估",
  "en": "Environment-based agent eval",
  "plain": "給會動手的 agent 打分數的做法：每題準備一個乾淨的環境（資料夾、假資料、假的外部服務），讓 agent 做完後看環境的最後狀態評分（檔案改對沒、該留的有沒有被動到），並記下回合數和花費；每次試跑都換新環境，結果才不會互相干擾。",
  "lesson": "15-1",
  "topic": "T15"
 },
 {
  "term": "outcome（結果）",
  "en": "Outcome",
  "plain": "評估裡指一次試跑最後的結果；對會動手的 agent 來說，就是它做完後檔案、資料實際變成什麼樣子。",
  "lesson": "15-1",
  "topic": "T15"
 },
 {
  "term": "pass@k／pass^k",
  "en": "pass@k / pass^k",
  "plain": "同一題跑 k 次的兩種算法：pass@k 是「至少成功一次」的機率，pass^k 是「k 次全部成功」的機率。給客戶用的 agent 要看 pass^k：每次 75% 成功，連 3 次都成功只有約 42%。",
  "lesson": "15-1",
  "topic": "T15"
 },
 {
  "term": "SLO（服務目標）",
  "en": "Service Level Objective",
  "plain": "替上線的服務定幾個要守住的數字和門檻，例如任務成功率、最慢 5% 的回應時間（p95 延遲）、每個任務的成本；超過門檻就告警、通知負責人。",
  "lesson": "15-E2",
  "topic": "T15"
 },
 {
  "term": "金絲雀發布（canary）",
  "en": "Canary release",
  "plain": "新版本先只給一小部分使用者或流量（例如 5%）用，看指標沒變差再慢慢放大；出問題時影響的人最少。",
  "lesson": "14-5",
  "topic": "T14"
 },
 {
  "term": "回到上一版（rollback）",
  "en": "Rollback",
  "plain": "新版本出問題時退回上一版。模型 ID、提示詞版本放在設定檔或功能開關裡，要回到上一版只要把開關切回去，不用重新部署。",
  "lesson": "14-5",
  "topic": "T14"
 },
 {
  "term": "engineering 階梯",
  "en": "Engineering ladder",
  "plain": "社群把用好 AI 的方法排成五層：prompt（把一句話寫清楚）→ context（管理它看到什麼）→ harness（設計周圍的工具與規則）→ loop（讓它自己反覆執行）→ graph（安排多個流程怎麼分工）。層次好用，但名詞每幾個月就換一輪。",
  "lesson": "7-3",
  "topic": "T7"
 },
 {
  "term": "harness engineering（外框工程）",
  "en": "Harness engineering",
  "plain": "設計模型外面那一圈：工具、權限、規則檔（CLAUDE.md、Skill）與檢查步驟，讓 AI 錯過一次的事不再錯。常見說法是「Agent＝模型＋外框（工具、規則、檢查）」。",
  "lesson": "4-E2",
  "topic": "T4"
 },
 {
  "term": "loop engineering（迴圈工程）",
  "en": "Loop engineering",
  "plain": "設計一個會自己執行、檢查、重試、停下的流程：有觸發時間、明確的完成條件，並由另一個 AI 或人驗收。排程任務加上完成條件與檢查，就是非工程師版本。",
  "lesson": "7-3",
  "topic": "T7"
 },
 {
  "term": "graph engineering（流程圖工程）",
  "en": "Graph engineering",
  "plain": "把多個 agent 或步驟之間誰先做、誰接手、哪裡分岔、哪裡退回重審畫成節點和連線，不全交給模型臨場決定。跟知識圖譜無關；名稱多見於 X、YouTube，開發者社群少用，做法等同多 Agent 流程圖。",
  "lesson": "13-1",
  "topic": "T13"
 },
 {
  "term": "agentic engineering",
  "en": "Agentic engineering",
  "plain": "專業版的「叫 AI 寫程式」：人負責規格、審查、測試與方向，寫程式的 AI 代理（coding agent）負責實作。跟 vibe coding 不看程式碼的做法相反。",
  "lesson": "10-4",
  "topic": "T10"
 },
 {
  "term": "compound engineering（複利工程）",
  "en": "Compound engineering",
  "plain": "每做完一件事，就把學到的修正寫回規則、Skill 或檢查清單，讓下一次自動更好，效果逐次累積。",
  "lesson": "4-E2",
  "topic": "T4"
 },
 {
  "term": "intent engineering（意圖工程）",
  "en": "Intent engineering",
  "plain": "把目標、取捨、底線與成功標準寫成 AI 能照著判斷的規則，不只寫指令。屬顧問用語，做法與寫好 Project 指示、Skill 大致相同。",
  "lesson": "7-3",
  "topic": "T7"
 },
 {
  "term": "memory engineering（記憶工程）",
  "en": "Memory engineering",
  "plain": "業界部落格對「設計長期記憶」的稱呼：決定 AI 要記什麼、存在哪、何時讀出、何時刪掉。做法跟長期記憶相同，實作見建立個人 Memory 系統。",
  "lesson": "4-2",
  "topic": "T4"
 },
 {
  "term": "Software 3.0",
  "en": "Software 3.0",
  "plain": "Andrej Karpathy 的說法：1.0 是人寫程式，2.0 是訓練神經網路，3.0 是用自然語言（Prompt）指揮電腦做事。",
  "lesson": "7-3",
  "topic": "T7"
 },
 {
  "term": "代理式工作流程",
  "en": "Agentic workflow",
  "plain": "讓 AI 照大致固定的步驟做事（起草、自我檢查、修改、使用工具），比完全由模型決定下一步的 agent 容易控制；跟固定流程相比，中間有些步驟由模型判斷。",
  "lesson": "12-2",
  "topic": "T12"
 },
 {
  "term": "Ralph 迴圈",
  "en": "Ralph Wiggum loop",
  "plain": "把同一份指令檔反覆交給 coding agent、直到任務完成的簡單迴圈。一定要設定最多執行幾次和完成標記，否則會持續消耗額度。",
  "lesson": "12-5",
  "topic": "T12"
 },
 {
  "term": "代理蜂群",
  "en": "Agent swarm",
  "plain": "模型自己臨時開出幾十到幾百個子代理平行處理，再合併成一份結果；最早是 Kimi（Moonshot AI）的功能名稱，數量多為廠商自己公布。Claude Code 裡類似的功能叫 dynamic workflows（見該條）。",
  "lesson": "13-2",
  "topic": "T13"
 },
 {
  "term": "Codex",
  "en": "OpenAI Codex",
  "plain": "OpenAI 的程式代理，可在 ChatGPT 應用程式、終端機（Codex CLI）、IDE 擴充功能與雲端使用，能讀寫專案檔案、執行指令並審查程式碼。本課程在 Claude Code 中串接 Codex，用於跨模型審查。",
  "lesson": "13-E1",
  "topic": "T13"
 },
 {
  "term": "跨模型審查",
  "en": "Cross-model review",
  "plain": "由一個模型產出、另一家廠商的模型檢查的做法，例如 Claude Code 寫好的程式交給 Codex 審查。不同模型的盲點不同，較能找出單一模型容易忽略的錯誤；採不採納審查意見仍由人判斷。",
  "lesson": "13-E1",
  "topic": "T13",
  "alias": [
   "AI 互相審查",
   "交叉審查"
  ]
 },
 {
  "term": "人在迴圈中／人在迴圈上",
  "en": "Human-in-the-loop / Human-on-the-loop",
  "plain": "in-the-loop：AI 每個重要動作前都要人核准；on-the-loop：AI 自行執行，人在旁監看、隨時可以停止。導入時通常從前者開始，再逐步放手。",
  "lesson": "12-5",
  "topic": "T12"
 },
 {
  "term": "長任務 agent",
  "en": "Long-running agent",
  "plain": "能連續工作數小時甚至跨天的 agent，靠進度檔、待辦清單和檢查步驟接續，而不是靠一次對話記住所有事。",
  "lesson": "5-1",
  "topic": "T5"
 },
 {
  "term": "背景代理／雲端代理",
  "en": "Background agent / Cloud agent",
  "plain": "在雲端電腦上執行、你關掉電腦也會繼續做的 agent，完成後再通知你。Claude Code 的雲端 session 就是一種背景代理。",
  "lesson": "10-E3",
  "topic": "T10"
 },
 {
  "term": "autoresearch（自動研究迴圈）",
  "en": "Autoresearch",
  "plain": "給 agent 一個要提高的分數和可以修改的檔案，讓它整晚自己做實驗：分數進步就保留，沒進步就還原。",
  "topic": "T12"
 },
 {
  "term": "代理瀏覽器",
  "en": "Browser agent / Agentic browser",
  "plain": "內建 AI 代理、能替你點網頁、填表、比價的瀏覽器或擴充功能，例如 Claude in Chrome（見「Claude in Chrome」）。讀到的網頁可能夾帶提示詞注入，權限要設好。",
  "lesson": "5-4",
  "topic": "T5"
 },
 {
  "term": "委派單",
  "en": "Delegation brief",
  "plain": "交辦長任務給 Cowork 前寫好的工作說明：目標、範圍與限制、可使用的資料與權限、交付格式、完成條件，以及遇到不確定情況時須先暫停確認的事項。",
  "lesson": "5-3",
  "topic": "T5"
 },
 {
  "term": "完成條件",
  "en": "Definition of done",
  "plain": "判定任務已經完成的具體標準，例如交付的檔案數量與格式、必須通過的檢查項目。寫進委派單或排程任務後，AI 能自行驗收，你也能依同一標準檢查成果。",
  "lesson": "5-3",
  "topic": "T5"
 },
 {
  "term": "Claude in Chrome",
  "en": "Claude in Chrome",
  "plain": "Anthropic 的 Chrome 擴充功能，讓 Claude 在瀏覽器中讀取頁面、點擊、瀏覽與填寫表單；可從 Chrome 側邊欄、Cowork 或 Claude Code 啟動。限付費方案（Pro、Max、Ultra、Team、Enterprise；Enterprise 須由管理員開啟），只支援電腦版 Google Chrome。讀取的網頁可能夾帶提示詞注入，敏感操作前要先確認。",
  "lesson": "5-4",
  "topic": "T5",
  "alias": [
   "Claude for Chrome"
  ]
 },
 {
  "term": "任務拆解",
  "en": "Task decomposition",
  "plain": "把大型任務切成多個可獨立交辦、各自有產出與檢查方式的步驟，再依序或並行交給 AI 執行；步驟越明確，長任務越不容易偏離目標。",
  "lesson": "5-2",
  "topic": "T5"
 },
 {
  "term": "個人 Agent",
  "en": "Personal agent",
  "plain": "替你個人做事的 agent：接上信箱、行事曆、通訊軟體與各種 App，記得你的偏好，能排程、整理、代辦，重要動作前先問你。例如 Claude Duet（只開放美國，需候補）、ChatGPT Dots（台灣是否開放尚未確認）、Gemini Spark。台灣目前確定可用的有 Gemini Spark（AI Pro 起，分批開放）與 Perplexity Computer（Pro 起）。",
  "lesson": "7-2",
  "topic": "T7"
 },
 {
  "term": "主動式 Agent",
  "en": "Proactive agent / Always-on agent",
  "plain": "不等你下指令，持續留意信箱、行事曆與待辦，主動提醒並先把事情準備好，要動手前再請你確認。例如 Claude Duet（研究預覽）、ChatGPT Dots。",
  "lesson": "7-2",
  "topic": "T7"
 },
 {
  "term": "OpenClaw（養龍蝦）",
  "en": "OpenClaw",
  "plain": "開源、自行架設的個人 agent，透過 WhatsApp、Telegram 等與你對話，能讀檔、寄信、上網、定時執行，可用 ClawHub 市集的 Skill 擴充。標誌是紅色龍蝦，中文圈因此稱為「養龍蝦」。權限開得大，安裝前要先了解風險。",
  "lesson": "7-E5",
  "topic": "T7"
 },
 {
  "term": "Moltbook",
  "en": "Moltbook",
  "plain": "號稱只給 AI agent 發文、人類只能旁觀的社群網站，常被當成判讀 AI 炒作新聞的案例。2026-02 被資安研究者發現資料庫外洩；號稱有上百萬個 agent，背後只有約 1.7 萬人，人也能冒充 agent 發文。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "代理購物",
  "en": "Agentic commerce",
  "plain": "讓 AI 代理替你比價、下單、付款。同時也有越來越多網站封鎖第三方 AI 代理，不是每個網站都能代為操作。",
  "lesson": "7-2",
  "topic": "T7"
 },
 {
  "term": "AAIF",
  "en": "Agentic AI Foundation",
  "plain": "Linux Foundation 底下管理 agent 開放標準的組織，目前管理 MCP、AGENTS.md 等標準。",
  "topic": "T12"
 },
 {
  "term": "LLM Wiki（AI 個人知識庫）",
  "en": "LLM Wiki / Second brain",
  "plain": "讓 AI 把你提供的資料整理成互相連結的 Markdown 筆記，之後的問題從這套筆記找答案，並定期檢查更新；是「第二大腦」筆記系統的 AI 版本。",
  "lesson": "3-E1",
  "topic": "T3"
 },
 {
  "term": "知識圖譜／GraphRAG",
  "en": "Knowledge graph / GraphRAG",
  "plain": "先把資料整理成人、事、物與彼此關係的圖，再依圖找答案，適合需要串連多份文件的問題。跟 graph engineering 不同。",
  "lesson": "12-E3",
  "topic": "T12"
 },
 {
  "term": "決策脈絡圖",
  "en": "Context graph",
  "plain": "把一個決定的來龍去脈（誰批准、依據哪個例外、參考了什麼）記錄下來，讓 agent 之後遇到類似情況可以參考。",
  "topic": "T17"
 },
 {
  "term": "Vibe Coding",
  "en": "Vibe coding",
  "plain": "用描述的方式讓 AI 寫程式，不看程式碼，只看做出來的東西好不好用。適合做原型與小工具；要上線或處理資料時，就要加上計畫、測試與檢查。",
  "lesson": "10-1",
  "topic": "T10"
 },
 {
  "term": "Vibe Working",
  "en": "Vibe working",
  "plain": "把 vibe coding 的做法用在文書工作：用對話讓 AI 直接在 Word、Excel、PowerPoint 做出整份成品，人負責方向與檢查。",
  "lesson": "8-1",
  "topic": "T8"
 },
 {
  "term": "AI-native／Frontier Firm／agent boss",
  "en": "AI-native / Frontier Firm / Agent boss",
  "plain": "AI-native 指從一開始就假設 AI 負責大部分執行工作的流程或公司。Microsoft 把這類公司稱為 Frontier Firm，把要帶領 agent 工作的員工稱為 agent boss。",
  "lesson": "17-3",
  "topic": "T17"
 },
 {
  "term": "AI 員工／AI 同事",
  "en": "AI employee / AI coworker",
  "plain": "把 agent 包裝成有名字、有職責的「同事」，在 Slack 或信箱裡接工作。這是產品定位用語，實際上仍是設定好權限的 agent。",
  "lesson": "17-E1",
  "topic": "T17"
 },
 {
  "term": "一人公司",
  "en": "One-person company (OPC)",
  "plain": "一個人靠 AI agent 完成產品、行銷與客服，自己經營一家公司；中文圈也稱「超級個體」。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "tokenmaxxing",
  "en": "Tokenmaxxing",
  "plain": "公司用 token 用量排行榜鼓勵員工使用 AI，把用量當成產出。常被當成衡量 AI 成效的反例：用得多不等於做得好。",
  "lesson": "17-1",
  "topic": "T17"
 },
 {
  "term": "SaaSpocalypse",
  "en": "SaaSpocalypse",
  "plain": "2026 年 1 月底 Claude Cowork 推出職務 Plugin 後，市場擔心 AI agent 取代軟體訂閱，2 月初全球軟體股大跌，這個事件就叫 SaaSpocalypse。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "認知負債",
  "en": "Cognitive debt / Deskilling",
  "plain": "什麼都交給 AI，自己的思考、記憶與技能逐漸退化。先自己想過再問 AI，是常見的預防方法。",
  "topic": "T1"
 },
 {
  "term": "模型自動選擇",
  "en": "Model routing",
  "plain": "系統依問題難度自動決定用哪個模型、要不要多想，例如 ChatGPT 的 Auto；Claude 以模型選單為準。跟 Claude Code 權限模式裡的 Auto 是兩回事。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "context rot（上下文腐化）",
  "en": "Context rot",
  "plain": "放進對話的內容越多，模型越容易漏看、表現變差，即使還沒超過上下文上限。長對話越來越不準，多半是這個原因。",
  "lesson": "1-3",
  "topic": "T1"
 },
 {
  "term": "生成式介面",
  "en": "Generative UI / Intelligent UI",
  "plain": "AI 不只回覆文字，而是當場產生可以點選、填寫的介面，例如互動圖表、表單、小工具；ChatGPT 稱為 Intelligent UI。Claude 的 Artifact 與 Custom visuals 屬於這類；MCP Apps 讓外部工具也能在對話裡顯示介面。",
  "lesson": "8-4",
  "topic": "T8"
 },
 {
  "term": "決策模型",
  "en": "Decision model",
  "plain": "只回答「是或否」或「選哪一個」、並附上機率的一類模型（也稱 System One model）；機率經過校準，寫 80% 時大約 8 成會對。適合大量分類與判斷，速度快、成本低。2026-09 TypeSafe AI 推出的 Jev 是第一個例子，目前存取受限。",
  "topic": "T12"
 },
 {
  "term": "世界模型",
  "en": "World model / Physical AI",
  "plain": "學習「世界怎麼運作」的模型，能生成可以互動的 3D 或影片場景、預測動作的後果，被視為機器人（physical AI）的基礎。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "能力落差（鋸齒狀能力邊界）",
  "en": "Jagged frontier",
  "plain": "AI 的能力參差不齊：能解很難的題目，卻可能在簡單的事上出錯。哪些事做得好無法憑感覺判斷，要實際測試。",
  "lesson": "1-4",
  "topic": "T1"
 },
 {
  "term": "任務時長指標",
  "en": "Time horizon (METR)",
  "plain": "用「AI 能獨立完成多長的人類工作」衡量模型進步，例如有一半機率完成人類需要 2 小時的任務。長期大約每 7 個月翻倍，2023 年後加快到約 4 個月，常出現在 AI 新聞裡。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "AGI（通用人工智慧）",
  "en": "Artificial General Intelligence",
  "plain": "在大多數認知工作上達到或超過人的 AI。沒有公認定義，所以任何公司都能宣稱「已經達到」；看到這類新聞，先確認它用的是哪個定義。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "AI 研發 AI",
  "en": "Recursive self-improvement",
  "plain": "AI 參與研發下一代 AI，使進步速度可能自行加快的情境，目前多出現在研究與預測討論中。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "AI 當評審",
  "en": "LLM-as-a-judge",
  "plain": "請另一個 AI 依評分標準為成品打分，用來大量檢查品質；要先和人工評分對照，確認可信再使用。",
  "lesson": "15-2",
  "topic": "T15"
 },
 {
  "term": "供應鏈攻擊",
  "en": "Supply-chain attack (Skills / Plugins)",
  "plain": "有人在 Skill、Plugin、MCP 或擴充功能市集放上惡意套件，一安裝就可能竊取密碼或執行危險指令。只裝可信來源，安裝前先看內容；完整的安全審查見 15-E1。",
  "lesson": "4-4",
  "topic": "T4"
 },
 {
  "term": "代理失準",
  "en": "Agentic misalignment / Scheming",
  "plain": "在安全測試中，agent 為了達成目標而說謊、作弊或規避限制的行為，多記錄在模型的 System card 與研究報告中。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "AI slop（AI 垃圾內容）",
  "en": "AI slop",
  "plain": "大量產出、品質低、一看就是 AI 隨手生成的內容，涵蓋文字、圖片與網頁設計。",
  "lesson": "11-6",
  "topic": "T11"
 },
 {
  "term": "Reference（設計參考）",
  "en": "Design reference",
  "plain": "動手設計前蒐集的參考作品，例如網站、版面、配色與動態效果；用來界定設計方向，也能直接提供給 AI 作為具體範例，比抽象形容詞更準確。",
  "lesson": "11-2",
  "topic": "T11",
  "alias": [
   "Reference",
   "設計參考"
  ]
 },
 {
  "term": "Awwwards",
  "en": "Awwwards",
  "plain": "評選網站設計與開發的國際獎項網站，由評審團評分並每日選出 Site of the Day；本課程用它蒐集設計方向的參考作品。",
  "lesson": "11-2",
  "topic": "T11"
 },
 {
  "term": "Refero",
  "en": "Refero",
  "plain": "收錄真實產品介面截圖的設計參考庫，可依頁面類型、元件與流程搜尋；本課程用它查找介面版面與互動流程的參考。",
  "lesson": "11-2",
  "topic": "T11"
 },
 {
  "term": "Design System（設計系統）",
  "en": "Design system",
  "plain": "一套網站或產品共用的設計規則：色彩、字型、間距、圓角等設計標記（design tokens），加上元件與使用規範；寫成文件交給 AI，產出的頁面風格才會一致。",
  "lesson": "11-4",
  "topic": "T11",
  "alias": [
   "設計系統"
  ]
 },
 {
  "term": "Figma",
  "en": "Figma",
  "plain": "協作式介面設計工具，可在瀏覽器或桌面應用程式中繪製畫面、元件與原型；本課程透過 Figma 的 MCP 伺服器或 Connector 讓 Claude 讀取設計稿並轉成網頁。",
  "lesson": "11-E1",
  "topic": "T11"
 },
 {
  "term": "Landing Page",
  "en": "Landing page",
  "plain": "為單一目標設計的獨立頁面，例如報名、下載或訂閱；結構通常依序為主標與價值主張、說明、佐證與行動按鈕，以轉換率衡量成效。",
  "lesson": "11-E2",
  "topic": "T11",
  "alias": [
   "登陸頁",
   "到達頁"
  ]
 },
 {
  "term": "響應式設計",
  "en": "Responsive design",
  "plain": "讓同一個網頁依螢幕寬度自動調整版面，在手機、平板與電腦上都能正常閱讀與操作。版面在某個寬度出現文字溢出、元素重疊或需要左右捲動，稱為「破版」。",
  "lesson": "11-E3",
  "topic": "T11",
  "alias": [
   "RWD",
   "破版"
  ]
 },
 {
  "term": "Motion（動畫函式庫）",
  "en": "Motion",
  "plain": "開源的網頁動畫函式庫，支援 JavaScript、React 與 Vue，舊名 Framer Motion；提供彈簧動畫、手勢與捲動效果。本課程用它製作 2D 動態效果。",
  "lesson": "11-8",
  "topic": "T11",
  "alias": [
   "Framer Motion"
  ]
 },
 {
  "term": "捲動動畫",
  "en": "Scroll-driven animation",
  "plain": "依頁面捲動位置推進的動畫，例如元素進入畫面時淡入、隨捲動放大或切換場景；可用 CSS 原生的 scroll-driven animations 或動畫函式庫實作，須顧及效能與減少動態設定。",
  "lesson": "11-8",
  "topic": "T11",
  "alias": [
   "scroll animation"
  ]
 },
 {
  "term": "WebGL",
  "en": "WebGL",
  "plain": "瀏覽器內建的圖形 API，讓網頁直接使用顯示卡繪製 2D 與 3D 畫面，不需安裝外掛；新一代的對應標準是 WebGPU。",
  "lesson": "11-10",
  "topic": "T11"
 },
 {
  "term": "Three.js",
  "en": "Three.js",
  "plain": "開源的 JavaScript 3D 函式庫，建立在 WebGL（及 WebGPU）之上，提供場景、相機、燈光、材質與模型載入等功能；本課程用它製作 3D 網頁。",
  "lesson": "11-10",
  "topic": "T11"
 },
 {
  "term": "Blender",
  "en": "Blender",
  "plain": "免費開源的 3D 製作軟體，涵蓋建模、材質、骨架、動畫與算圖；可用 Python 腳本或 MCP 讓 Claude 操作。本課程用它建立模型並匯出成網頁可用的 glTF。",
  "lesson": "11-11",
  "topic": "T11"
 },
 {
  "term": "glTF",
  "en": "glTF (GL Transmission Format)",
  "plain": "Khronos Group 制定的 3D 模型交換格式，常被稱為「3D 的 JPEG」，可包含網格、材質、骨架與動畫；.glb 是打包成單一檔案的二進位版本，是網頁 3D 最常用的格式。",
  "lesson": "11-11",
  "topic": "T11",
  "alias": [
   "GLB"
  ]
 },
 {
  "term": "烘焙（baking）",
  "en": "Baking",
  "plain": "把光影、陰影等耗時的計算預先算好並存進貼圖，網頁執行時直接讀取，不必即時運算；能以較低效能成本呈現較好的光影品質。",
  "lesson": "11-11",
  "topic": "T11",
  "alias": [
   "baking",
   "烘焙"
  ]
 },
 {
  "term": "Shader",
  "en": "Shader",
  "plain": "在顯示卡上執行的小程式，決定每個頂點的位置與每個像素的顏色；雨滴、霧、霓虹發光等視覺效果都靠它實作，網頁上多以 GLSL 撰寫。",
  "lesson": "11-E5",
  "topic": "T11",
  "alias": [
   "著色器"
  ]
 },
 {
  "term": "workslop（工作垃圾）",
  "en": "Workslop",
  "plain": "看起來像完成、實際上要同事花時間補洞的 AI 工作成品；交付前自我檢查就是為了避免它。",
  "lesson": "2-3",
  "topic": "T2"
 },
 {
  "term": "AI;DR",
  "en": "AI;DR",
  "plain": "「AI 寫的，所以我沒讀」，用來標記或批評沒經過人整理的 AI 文字。相關說法是「Don't paste the AI」：不要把 AI 的回答直接貼給別人。",
  "lesson": "2-4",
  "topic": "T2"
 },
 {
  "term": "AI 偵測器",
  "en": "AI detector",
  "plain": "號稱能判斷文字是不是 AI 寫的工具，本質上是推測、誤判率高，不能當成是否使用 AI 的證據；跟文字浮水印不同。",
  "lesson": "1-5",
  "topic": "T1"
 },
 {
  "term": "訓練資料設定",
  "en": "Training opt-out",
  "plain": "決定你的對話會不會被拿去訓練模型。Claude 在隱私設定裡有對應的開關；Team、Enterprise 等公司方案預設不拿來訓練。其他 AI 服務多半也能在隱私設定裡關閉。",
  "lesson": "1-5",
  "topic": "T1"
 },
 {
  "term": "AI 情感依賴",
  "en": "Emotional dependence on AI",
  "plain": "長時間與聊天機器人互動後，過度依賴它的陪伴或判斷；媒體所說的「AI 精神病」是極端案例，不是正式醫學診斷。AI 不能取代朋友、醫師或諮商師。",
  "topic": "T1"
 },
 {
  "term": "Chat（Claude 對話介面）",
  "en": "Claude Chat",
  "plain": "Claude 應用程式中以對話完成任務的介面：提問、討論、撰寫，以及分析上傳的檔案，成果直接產出在對話中。與 Cowork（在電腦上長時間執行並交付成品）、Claude Code（處理程式專案）分工不同；Pro、Max、Ultra 方案的 Chat 與 Cowork 正分批合併為同一介面。「聊天機器人」則是這類介面的通稱。",
  "lesson": "1-2",
  "topic": "T1",
  "alias": [
   "Chat"
  ]
 },
 {
  "term": "假 agent",
  "en": "Agentwashing / AI washing",
  "plain": "把舊的聊天機器人或自動化腳本改名叫「AI agent」來銷售。判斷方式：看它能不能自己使用工具、根據結果決定下一步。更廣的說法 AI washing，泛指誇大產品裡的 AI 成分。",
  "lesson": "3-5",
  "topic": "T3"
 },
 {
  "term": "GEO（生成式引擎最佳化）",
  "en": "Generative Engine Optimization (GEO / AEO)",
  "plain": "讓自己的網站或內容被 ChatGPT、Google AI 摘要、Perplexity 等 AI 回答引用的方法，也稱 AEO。",
  "lesson": "16-E1",
  "topic": "T16"
 },
 {
  "term": "llms.txt",
  "en": "llms.txt",
  "plain": "放在網站根目錄、專門給 AI 讀的網站簡介檔，說明網站有哪些重要頁面；目前是提案格式，主要 AI 搜尋會不會讀取還沒有定論。",
  "lesson": "16-E1",
  "topic": "T16"
 }
]
