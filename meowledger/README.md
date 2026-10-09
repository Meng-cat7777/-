# 喵帳本

貓咪主題的記帳網站，手機優先、桌面也能用。純靜態網頁（HTML、CSS、JavaScript），不需要建置工具。

- 網址（GitHub Pages）：`/meowledger/`
- 沒有填 Firebase 設定時是「試玩模式」：資料只存在這台裝置，可以先看畫面與流程。

## 技術架構與理由

| 層 | 選擇 | 理由 |
|---|---|---|
| 前端 | 原生 JavaScript（ES modules）+ 單一 CSS | 沒有建置步驟，直接放 GitHub Pages；畫面小而固定，不需要框架 |
| 登入 | Firebase Authentication（Google 登入） | 免自己處理密碼，第一次登入就等於註冊 |
| 資料庫 | Cloud Firestore | 即時同步（家人、朋友記帳立刻看到）、手機離線可用、免費額度足夠朋友使用 |
| 後端 | 無（Firestore 安全規則 `firestore.rules`） | 「只能存取自己的資料與所屬家庭、群組」直接由資料庫規則保證，不用養伺服器 |
| 試玩模式 | localStorage | 沒設定 Firebase 也能體驗；介面與資料層（`store.js`）相同 |

檔案：`index.html`、`style.css`、`app.js`（畫面）、`logic.js`（計算：分帳最少轉帳、排程展開、統計）、`store.js`（資料層）、`icons.js`（貓咪頭像與圖示）、`firebase-config.js`、`firestore.rules`。

## 資料表結構

邏輯上的關聯如下（Firestore 以集合實作）。

| 資料表 | 欄位 | 說明 |
|---|---|---|
| 使用者 `users/{uid}` | name, avatar(毛色), budget, customCats[] | 個人設定；文件 id 就是登入帳號的 uid |
| 群組 `groups/{id}` | type(`family`/`trip`), name, ownerId, inviteCode, budget, memberIds[], members{uid: {name, avatar, guest?}} | 家庭與朋友分帳共用同一張表；`members` 同時是「成員表」，沒有帳號的朋友用 `g_` 開頭的代號 |
| 邀請碼 `invites/{code}` | groupId | 只能用邀請碼讀取，不能列出 |
| 帳目 `entries/{id}` | scopeId, kind(`personal`/`family`/`split`/`settle`), type, amount, category, date, account, note, createdBy, catId?, supplyId?, scheduleKey? | `scopeId` 是 uid（個人）或群組 id；家庭帳不會出現在個人帳 |
| 分攤（`kind=split` 的欄位） | payerId, splits{成員: 金額} | 一筆分帳記一次，付款人與每人份額都在裡面 |
| 還款（`kind=settle`） | from, to, amount | 按「已還」時記下，餘額自動更新 |
| 排程 `schedules/{id}` | scopeId, title, amount, type, repeat(`none`/`monthly`), date, day, startDate, category | 每月固定項目由 `day` 展開；按「記帳」會產生帶 `scheduleKey` 的帳目 |
| 貓咪 `cats/{id}` | scopeId, name, fur | 屬於個人或家庭 |
| 貓用品 `supplies/{id}` | scopeId, catId, name, price, buyDate, days | 儲存時同時產生一筆「毛孩」帳目（`supplyId` 連結），只記一次 |

規則重點：每個資料文件都有 `scopeId`，`firestore.rules` 只允許「scopeId 等於自己」或「自己在該群組的 memberIds 內」的人讀寫。

## 啟用 Google 登入與雲端同步

1. 到 Firebase 主控台建立專案，加入「網頁應用程式」，複製設定值。
2. Authentication > 登入方式：啟用 Google。Authentication > 設定 > 已授權網域：加入 `meng-cat7777.github.io`。
3. Firestore Database：建立資料庫，到「規則」貼上 `firestore.rules` 的內容並發布。
4. 把設定值貼進 `firebase-config.js`（參考檔內的註解），推到 GitHub 即可。

## 計算方式備忘

- 剩餘 = 本月收入 − 支出；預算進度 = 支出 ÷ 預算。
- 分帳最少轉帳：把成員切成最多組「組內加總為 0」，每組 k 人只要 k−1 次轉帳（16 人以內為精確解）。
- 貓用品：已用天數 = 今天 − 買入日；月平均 = 價格 ÷ 可用天數 × 30；剩 16 天以內進度條變深色，並在預計用完那天出現在行事曆。
