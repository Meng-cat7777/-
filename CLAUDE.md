# Aira 艾拉｜喵選拾光 網站交接說明

這份說明給之後在這個程式庫工作的 Claude 看。使用者是網站主人 Meng（品牌 Aira 艾拉，IG @meng.cat_47777），不是工程師：回覆用繁體中文、口語、說清楚改了什麼，不要講技術細節，除非她問。

## 這個網站是什麼

能量手串與單顆水晶的商品介紹頁，用 GitHub Pages 對外公開：
https://meng-cat7777.github.io/-/

整個網站只有一個檔案 `index.html`：樣式、程式和商品資料都在裡面，不需要建置工具。推到 `main` 分支後，GitHub Pages 會在 1 到 2 分鐘內自動上線（偶爾要等快取最多約 10 分鐘）。

## 整體架構（三個地方）

1. **後台（在 Claude 上，私人頁面）**：Meng 在這裡編輯手串、單顆水晶、價格、照片和自行設計設定，資料存在後台頁面自己的資料庫。後台網址不寫在這裡，因為這個程式庫是公開的；需要時請 Meng 提供，或用 Artifact 工具的 list 找標題為「喵選拾光 後台」的頁面。
2. **Claude 上的商品頁（公開）**：https://claude.ai/artifact/WafdaxT1gNrdjeHq1pbyQv 。後台儲存後，Claude 的排程工作「喵選拾光 後台同步到商品頁」會自動把最新內容寫進這一頁。
3. **這個 GitHub 網站**：和 Claude 商品頁長得一樣，但**不會自動同步**（排程工作沒有 GitHub 權限）。內容更新要照下面「從後台更新網站內容」手動做。

正式對外分享的網址是 GitHub 網站。外觀修改只需要改這裡；不需要同步改 Claude 商品頁，除非 Meng 要求。

## 最重要的規則

- **不要手改商品資料。** `index.html` 裡 `<!--SHOP-DATA-START-->` 到 `<!--SHOP-DATA-END-->` 之間的 JSON 是從後台產生的，手改會在下次更新時被蓋掉。內容（手串、水晶說明、價格、照片）一律請 Meng 到後台改。
- 改外觀時保留資料區塊和兩個標記註解，不要刪掉或移動到 `<script>` 之後。
- 改完先在瀏覽器實際看過手機寬度（約 390px）和電腦寬度，再推上去。
- 推上 `main` 後，用 WebFetch 讀 `https://meng-cat7777.github.io/-/index.html` 確認新內容上線（加不同的網址結尾可避開快取）。

## 從後台更新網站內容

當 Meng 說「從後台更新網站內容」或「後台改好了，更新網站」：

1. 向 Meng 要後台網址（或用 Artifact list 找「喵選拾光 後台」）。
2. 用 ArtifactData 的 `list` 讀後台的三個集合 `bracelets`、`stones`、`settings`（query.limit 1000，out_dir 指到暫存資料夾，例如 `WORK/src`）。
3. 照片：後台資料裡每個非空的 `image` 是一個照片編號。若 `img/` 資料夾裡還沒有 `img/<編號>.*`，用 Artifact 的 `read`（url 為後台，path 為照片編號，out_dir 為 `img`）下載進來。
4. 列出目前的照片檔：`ls img 2>/dev/null | sed 's#^#img/#' > WORK/published.txt`
5. 產生網站：`python3 tools/build_shop.py WORK/src WORK/published.txt index.html index.html`
   它會更新資料區塊，並列出還缺的照片（`missing_photos`）；有缺就回到第 3 步。
6. 看過網頁沒問題後 commit 並推到 `main`。

如果這個對話沒有 ArtifactData／Artifact 工具，讀不到後台，就直接告訴 Meng，請她回到建立網站的那段 Claude 對話更新。

## 設計與文字慣例

- 風格：霧粉色價目表風，襯線字 Noto Serif TC，雙線外框，金色細線，深梅色主按鈕。
- 系列套色：A 玫瑰紅、B 霧藍、C 薰衣草紫；單顆水晶依脈輪套色（`ACC` 物件）。
- 手機（600px 以下）：**每一排按鈕都不能超過一行**，放不下就改成左右滑動或縮短文字；手串卡片一排兩張；詳細說明全螢幕開啟。
- 「你現在處在什麼頻率？」測驗框和下方「A 系列」標題條的外框要等寬。
- 頁首左邊「Aira 艾拉」、右邊「@meng.cat_47777」；頁尾置中「Aira 艾拉｜自我探索 x 能量調頻」。
- 頻率測驗連結：https://script.google.com/macros/s/AKfycbyFHSzOXvf2lEkSgn1k6FW2gGfrAxdp4OIkBAjdzeij4qiEoF3eGuqn_CkdeRHK8r_K9g/exec
- 文案語氣溫柔療癒，不說教、不太商業化；避免使用破折號（—）。
- 「自行設計」按鈕由後台設定開關（`settings.enabled`），單顆價格也在後台填。

## 檔案

- `index.html`：網站本體（手串與水晶商品頁）。
- `services/`：服務項目頁（牌卡占卜、靈數命盤、脈輪檢測價目與預約須知），網址 https://meng-cat7777.github.io/-/services/ 。這一頁的內容直接寫在 `services/index.html` 裡，不經過後台，可以直接修改；圖片放在同一個資料夾。
- `tools/build_shop.py`：把後台資料寫進 `index.html` 的工具。
- `img/`：商品照片（還沒有照片時這個資料夾不存在）。
- `.nojekyll`：讓 GitHub Pages 直接提供檔案。
