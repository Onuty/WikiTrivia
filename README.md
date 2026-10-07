# 世界史時間線

完全使用繁體中文、可直接在瀏覽器遊玩的世界歷史排序遊戲。以暖紙色、森林綠與簡潔的時間軸呈現 196 個歷史時刻；不需登入、後端或付費 API。

遊戲網址：[世界史時間線](https://onuty.github.io/WikiTrivia/)

## 遊戲玩法

1. 首頁選擇全部、中國、亞洲、歐洲、美洲、戰爭或科技題庫，再開始遊戲。
2. 時間軸先顯示兩個已知年份的事件。閱讀新事件，點選時間軸中的「＋」，再按「確認位置」。確認前可以修改位置。
3. 答對加 100 分；連勝每多一題增加 20 分，例如第二題 120 分、第五題 180 分。答對後自動繼續，也可手動按下一題。
4. 答錯扣一顆心，揭曉年份並在真正位置插入事件。閱讀後按下一題，避免錯過解說。
5. 三顆心用完時結算分數、最高分與本局最長連勝。題庫全部完成也會結算。
6. 相同年份的事件可放在彼此前後，不會因年內先後被判錯；公元前年份使用負數排序，沒有公元零年。

每局洗牌後逐題抽取，局內不重複；自由模式優先避開近期 35 筆記錄。最高分、近期記錄與深色模式設定儲存在本機 localStorage。儲存被封鎖時仍可遊玩，但紀錄不能跨重新整理保留。

「今日挑戰」以裝置所在地的日期產生固定題序，固定使用完整題庫，共十題；相同日期與相同版本的題庫會得到相同題目。此模式可重玩、不提供線上排行榜，成績與自由模式共用最高分。

## 本機執行

使用 Node.js 22.12 以上與 npm：

```sh
npm install
npm run dev
```

開啟終端顯示的網址，加上 `/WikiTrivia/`（通常為 `http://127.0.0.1:5173/WikiTrivia/`）。

```sh
npm run lint
npm test
npm run build
npm run preview
```

正式檔案輸出到 `dist/`。首次執行端對端測試：

```sh
npx playwright install chromium
npm run test:ui
```

Linux CI 使用 `npx playwright install --with-deps chromium`。

## 專案結構

- `src/main.js`：首頁、遊戲狀態、互動、動畫、每日挑戰與分享。
- `src/game.js`：紀年格式、同年判定、抽題、分類與計分的純函式。
- `src/data/events.js`：獨立的 196 題資料。
- `src/style.css`：響應式版面、深色模式、轉場與減少動態效果設定。
- `tests/game.test.js`：資料品質、年代與抽題邏輯測試。
- `tests/browser/game.spec.js`：真實瀏覽器操作、儲存、每日挑戰與六種尺寸的版面測試。
- `.github/workflows/deploy.yml`：檢查、建置及 GitHub Pages 部署。

採 Vite 與原生 JavaScript，沒有應用程式執行期框架依賴。使用系統中文字體，所有插圖以 SVG / CSS 製作，不載入外部字體、追蹤程式或圖片服務。

## 題庫結構與新增事件

資料檔以精簡列儲存，再輸出成標準物件：

```js
// rows 中的順序：id、title、year、description、region、category
['qin', '秦始皇統一中國', -221,
 '秦國滅齊，結束戰國分立，建立中央集權帝國。', '中國', '政治']

// events 匯出的結構
{
  id: 'qin',
  title: '秦始皇統一中國',
  year: -221,
  description: '秦國滅齊，結束戰國分立，建立中央集權帝國。',
  region: '中國',
  category: '政治'
}
```

新增時在 `rows` 中加入一列即可，不需更動 UI。請保持 id 永久唯一、年份為非零整數、文字為繁體中文。說明不可直接寫出答案年份。年份只是約定或推定時，請明確標示「約」及紀年依據。不要把延續數十年的進程冒充單一精確事件，例如工業革命以「瓦特取得改良蒸汽機專利」作為具體題目。

地區包含中國、日本、韓國、東南亞、印度、中東、蒙古、歐洲、非洲、美洲、美國、拉丁美洲、大洋洲、世界。科技篩選同時包含「科技」與「太空」。新增地區或篩選條件時，請同步更新 `filterEvents` 與測試。

推定年代不代表學界毫無歧見。本題庫對古代傳統紀年與約定年代在說明中保留限定語；馬可波羅抵華參考 [Encyclopaedia Iranica](https://www.iranicaonline.org/articles/polo-marco/)，馬利帝國的傳統開國紀年參考 [National Geographic](https://education.nationalgeographic.org/resource/sundiata-keita/)。百科資料適合後續查核，遊戲說明為自行撰寫，未複製文章正文。

## GitHub Pages

`vite.config.js` 已設定 `base: '/WikiTrivia/'`。沒有前端子路由，首頁、遊戲與結果都在同一路徑內切換，因此重新整理 `/WikiTrivia/` 不需 rewrite，也不會因遊戲路由產生 404。

此 repository 已啟用 GitHub Actions Pages 部署。若複製至其他 repository，首次部署在 repository 的 **Settings → Pages → Build and deployment → Source** 選擇 **GitHub Actions**。之後 push 至 `main` 將依序執行：

1. `npm ci`、lint、單元測試、正式 build。
2. Chromium 瀏覽器測試（測試伺服器以正式 build 的 preview 啟動）。
3. 上傳 `dist/` 並發布至 GitHub Pages。

Pull request 只執行建置與檢查，不部署。也可由 Actions 手動執行。帳戶或 repository 必須允許 GitHub Actions 與 Pages，程式中的 workflow 無法替代 repository 的管理權限。

## 操作與動態效果

- 桌面水平滑動時間軸，手機垂直排列；插入區支援點擊、觸控、Tab 與 Enter / 空白鍵。
- 確認答案後鎖定輸入，防止重複計分；舊卡片平移讓位，新卡片移入正確位置。
- 正確與錯誤同時以文字、符號與顏色呈現，並以 live region 宣告結果。
- 對話框使用原生 dialog 管理焦點；減少動態效果偏好會停用大幅移動。
- 提供深色模式與成績分享。瀏覽器不支援原生分享時改用剪貼簿，剪貼簿不可用時顯示可複製文字。

## 驗證範圍

單元測試涵蓋公元前、跨紀元、同年位置、首尾插入、完整題庫排序、零年禁用與固定種子抽題。瀏覽器測試涵蓋 1920×1080、1440×900、1366×768、768×1024、390×844、375×667，以及三次答錯結算、連勝加分、最高分保存、十題每日挑戰、鍵盤、儲存不可用與小螢幕結算面板。

自動化使用 Chromium 模擬尺寸；未宣稱已在實體 iPhone / iPad 或所有 Safari 版本完成測試。遊戲中途重新整理會回到首頁，本局不會恢復。未加入選配音效。


