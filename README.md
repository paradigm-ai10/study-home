# study-home

主導者：Thomas（GitHub：ThomasChenTheButt）

Paradigm 學習站首頁（f4 雨夜書桌）的預覽版，用 GitHub Pages 放上網，方便在手機和別台電腦看。

- 網址：https://paradigm-ai10.github.io/study-home/
- 手機看 3D：網址後面加 `?live`（不加只會看到靜態圖）
- 正本在 Thomas 電腦的 `網站/學習站/核心螃蟹/環境/f4-雨夜書桌/`，這裡是複製出來的，路徑改成英文：
  - `crab/rooms/f4/`：首頁（3D 版 index.html、簡潔版 simple.html）
  - `crab/routes.js`、`syllabus.js`：七個入口、33 課清單
  - `skills.html`：第 19 課樣品
- 改了正本要重新複製上來。

## 2026-11-14 更新

- 首頁的學習地圖改成「桌上的捲軸」：點桌上的地圖，捲軸拿起來攤開就是學習地圖（橫卷單軸、茶金絹布）。
- 新增 `crab/rooms/f4/map/`（捲軸程式、地圖外殼、紙面照片 `face-*.webp`）、`mindmap/`（正本 `網站/學習站/心智圖/` 的地圖程式，`規格/` 改名 `spec/`）、根目錄 `roadmap8.js`（課程地圖 v8.5）。
- `?mapmode=s1`／`s2` 看另外兩種打開方式，`?mapmode=off` 回到舊的大地圖。

## 2026-11-14 第二次更新

- 第一堂定版課上線：`lessons/4-4.html`「Skills 入門：呼叫、更新、自己做一個」（正本 `網站/學習站/課程/`；圖片、字型、PDF 在 `lessons/media/4-4/`，PDF 檔名改成英文 `skills-intro.pdf`）。首頁的路徑、程度評估、捲軸地圖裡的課名都連得到它；其餘首版課顯示「即將上線」。
- 新增 `resources/`：資源下載頁（正本 `網站/學習站/資源/`），首頁的「資源下載」入口（桌上的小包裹、索引、簡潔版）接到這裡。
- 首頁資料跟著課程地圖更新（4-4 新課名），`mindmap/data8.js` 一併更新。
- 其他四個入口（實作案例、AI 名詞辭典、AI 新聞、主題提案）還沒有頁面。

## 2026-11-16 更新

- 新增 `picker/`：首版開課選單的線上試看版。勾選要開的課、拖曳排順序，按「套用試看」只存在自己的瀏覽器（別人看不到），首頁、簡潔版、捲軸地圖會照試看的清單顯示，左下角有「試看中」小條可回選單或取消。滿意就按「複製給 Claude」貼給 Claude，改成正式版。正式的改法在 Thomas 電腦的 `網站/學習站/開課選單/`（會改課程地圖正本）。
- 新增根目錄 `first-trial.js`：套用試看清單的小程式，首頁兩版和捲軸地圖都會載入。
- 第二堂課上線：`lessons/5-1.html`「Cowork 入門」（PDF 改名 `cowork-intro.pdf`）。
- 首頁照首版順序推課（原本只照主題順序）；課程地圖 v8.6（新 1-3 方案比較，首版 21 課）。

## 2026-11-21 更新（上線前整理）

- 改由 Thomas 電腦的 `網站/上線/build.py` 自動產生整份網站（只帶訪客用得到的檔、路徑英文、每頁補分享預覽與說明），不再手動複製。
- 新增第三堂課 `lessons/6-1.html`（Connectors 入門）與選修 `lessons/6-E4.html`（Threads 找好店）；舊的 5-1 Cowork 課拿掉。
- 拿掉開課選單 `picker/`、`first-trial.js` 與舊樣品（skills.html、syllabus.js 等）。
- 新增 404.html、robots.txt、sitemap.xml、og.jpg、favicon；這個預覽版設成不讓搜尋引擎收錄（正式站之後在 paradigmai.tw）。
- 資源下載頁有 3 包；課程地圖 v8.7.2、首版 21 課（已開放 3 課）。

## 2026-11-21 更新（書桌佈置）

- 首頁 3D 書桌右下角新增「佈置」：完成課程得代幣（每課 10、60 秒體驗 5），可以兌換 10 件擺飾放到書桌上（串燈、紙星星、風鈴、地球儀、雪花球、仙人掌、蠟燭、招財貓、魚缸、打字機）。
- 新增 `crab/rooms/f4/decor.js`（代幣、佈置模式、兌換過程、擺飾互動）、`decor-view.js`（擺飾架的 3D 預覽）、`decor.css`、`decor/catalog.json`（擺飾資料）、`decor/*.glb`（模型）。
- 代幣和擺飾只存在訪客自己的瀏覽器，不用登入；只在電腦寬螢幕的 3D 書桌出現，手機和簡潔版沒有。
- 課程頁按「完成本課」會升起提示「得到 10 代幣」，可以直接回首頁佈置（`lessons/pdf-chapter.js`、`pdf-lesson.css`）。
- 書桌佈置加了團隊測試用的開發者模式（`crab/rooms/f4/decor.js`）。
