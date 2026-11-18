# 字選 Font Select

免費繁體中文字型預覽工具。輸入一段文字，預覽與收藏三十四款可商用開源字型。

**網站：[cpnei.github.io/font-select](https://cpnei.github.io/font-select/)**

## 功能

- 自訂多行文字（最多 500 個 Unicode 字元），提供三組示範文字。
- 調整字級、字距、行高；字重僅提供該字型支援的選項，不合成粗體。
- 搜尋中英文名稱與作者、分類篩選、瀏覽器本機收藏。
- 切換單行比較模式，以同一段預覽文字快速瀏覽篩選中的字型。
- 切換「我的收藏」集中查看喜歡的字型，支援手機版與鍵盤操作。
- 明確顯示字型載入狀態、失敗重試、原作者下載與授權連結。

## 本機開發

需要 Node.js 24 與 npm。

```sh
npm ci
npm run dev
```

開啟終端機顯示的 `/font-select/` 網址。專案採用 Vite、TypeScript 與原生 CSS，沒有後端、資料庫或環境變數需求。

```sh
npm test                # 資料與互動狀態單元測試
npm run build           # 型別、原始資產 SHA-256 驗證與正式建置
npx playwright install chromium
npm run test:e2e        # 桌面與手機瀏覽器測試；外部字型失敗採確定性模擬
npm run test:fonts      # 額外連網驗證三十四款真實字型、動態字元子集與字重
npm run preview         # 預覽 dist 正式建置
```

`test:fonts` 需要存取 `fonts.googleapis.com`、`fonts.gstatic.com` 與 `cdn.jsdelivr.net`。它與 CI 的確定性測試分開，避免外部服務的暫時故障阻擋程式碼檢查。完整 E2E 執行時，此項連網測試預設跳過。

## 字型來源

| 字型 | 作者／來源 | 網頁載入 |
| --- | --- | --- |
| Noto Sans TC | [Google / Adobe](https://github.com/notofonts/noto-cjk) | Google Fonts |
| Noto Serif TC | [Google / Adobe](https://github.com/notofonts/noto-cjk) | Google Fonts |
| Huninn 粉圓 | [justfont](https://github.com/justfont/Huninn) | Google Fonts |
| 昭源環方 | [Tamcy / Chiron Fonts](https://github.com/chiron-fonts/chiron-go-round-tc) | Google Fonts |
| 霞鶩文楷 TC | [LXGW / Aaron Bell](https://github.com/aaronbell/LxgwWenkaiTC) | Google Fonts |
| 芫荽 | [But Ko / ButTaiwan](https://github.com/ButTaiwan/iansui) | Google Fonts |
| 仙人掌古典明體 | [Moonlit Owen 等](https://github.com/MoonlitOwen/CactusSerif) | Google Fonts |
| 昭源黑體 HK | [Tamcy / Chiron Fonts](https://github.com/chiron-fonts/chiron-hei-hk) | Google Fonts |
| 昭源宋體 HK | [Tamcy / Chiron Fonts](https://github.com/chiron-fonts/chiron-sung-hk) | Google Fonts |
| 巧克力古典黑體 | [Moonlit Owen](https://github.com/MoonlitOwen/ChocolateSans) | Google Fonts |
| 霞鶩漫黑 | [LXGW](https://github.com/aaronbell/LxgwMarkerGothic) | Google Fonts |
| 霞鶩文楷等寬 TC | [LXGW](https://github.com/aaronbell/LxgwWenkaiTC) | Google Fonts |
| 思源黑體 HK | [Google / Adobe](https://github.com/notofonts/noto-cjk) | Google Fonts |
| 思源宋體 HK | [Google / Adobe](https://github.com/notofonts/noto-cjk) | Google Fonts |
| 宇文天穹 | [Moonlit Owen](https://github.com/MoonlitOwen/ThenKhung) | Google Fonts |
| WD-XL 滑石體 TC | [NightFurySL2001](https://github.com/NightFurySL2001/WD-XL-font) | Google Fonts |
| 辰宇落雁體 2.0 Thin | [劉韋辰 / 王立宇](https://github.com/Chenyu-otf/chenyuluoyan_thin) | 樣本子集 WOFF2 58 KB；自訂文字 4.8 MB |
| 饅頭黑體 | [mant0u0 / Artakana](https://github.com/mant0u0/MantouSans) | 樣本子集 WOFF2 20 KB；自訂文字 1.3 MB |
| 台北黑體 Taipei Sans TC Beta | [臺北市政府資訊局 / JT Foundry](https://sites.google.com/view/jtfoundry/zh-tw/downloads) | jsDelivr WOFF2 字元子集 |
| 未來熒黑 TC 標準、壓縮、窄、寬、加寬 | [Project Wêlai](https://github.com/welai/glow-sans) | jsDelivr WOFF2 字元子集 |
| 融合像素體 12px 等寬、比例 | [TakWolf 與貢獻者](https://github.com/TakWolf/fusion-pixel-font) | jsDelivr WOFF2 繁中子集 |
| 源起明體 TC | [But Ko / ButTaiwan](https://github.com/ButTaiwan/genyo-font) | jsDelivr WOFF2 字元子集 |
| 源樣明體 TC | [But Ko / ButTaiwan](https://github.com/ButTaiwan/genyo-font) | jsDelivr WOFF2 字元子集 |
| 全字庫正宋體 | [數位發展部 CNS11643 全字庫](https://www.cns11643.gov.tw/) | jsDelivr WOFF2 字元子集 |
| 全字庫正楷體 | [數位發展部 CNS11643 全字庫](https://www.cns11643.gov.tw/) | jsDelivr WOFF2 字元子集 |
| 源樣黑體 TC、源起黑體 TC | [ButTaiwan](https://github.com/ButTaiwan/genyog-font) | Ziano／jsDelivr WOFF2 字元子集 |
| 尙古明體 TC、尙古黑體 TC | [GuiWonder / Shanggu](https://github.com/GuiWonder/Shanggu) | Ziano／jsDelivr WOFF2 字元子集 |

收錄字型都提供 **SIL Open Font License 1.1** 全文；少數字型另附上游的補充授權或來源說明，保存在 `public/licenses/`。免費商用不等於沒有條件：再散布、修改及保留名稱仍須依各字型授權辦理。網站程式碼採 MIT，MIT 不套用於字型檔案。

本地原始 TTF 保存在非公開的 `assets/fonts/`，與授權檔一樣由 `assets.lock.json` 依不可變的上游 commit、大小與 SHA-256 鎖定。瀏覽器使用 FontTools 產生的完整 WOFF2；三組內建樣本與預設搭配文另有小型 WOFF2 子集，涵蓋 ASCII。預覽文字若包含子集以外的字元，會先提示再載入完整 WOFF2。`optimized-fonts.lock.json` 驗證產生的四個 WOFF2。安裝 `requirements-fonts.txt` 後執行 `npm run assets:fonts` 可重建；`npm run assets:restore` 可從鎖定來源還原原始字型與授權檔。

## 載入、隱私與限制

- 字型在卡片接近可視範圍時才請求。Google Fonts 使用 `text=` 傳送去重後的必要字元；字元清單過長時退回 Google 的 unicode-range 分片。其他 CJK 字型使用 jsDelivr 提供的 `unicode-range` CSS，瀏覽器只會下載目前文字命中的 WOFF2 字元片段。
- 兩款本機字型的內建樣本在卡片進入畫面時自動載入小型子集。子集外的文字會顯示完整字型載入按鈕；配對預覽也會先提示，等使用者確認才載入完整 WOFF2。
- 文字變動後延遲 400ms 請求所需字元，合併快速輸入期間的載入；保留中文輸入法組字流程。
- 預覽文字只保存在頁面記憶體，不寫入 LocalStorage，也不傳送至本站。使用 Google Fonts 時，瀏覽器會把目前需要的排序、去重字元放在 `text=` 請求參數交給 Google；原文順序與完整字串不會送出。字元清單過長時改用 unicode-range 分片。使用 jsDelivr 字型時只請求對應的字型 CSS 與 WOFF2 子集，請求網址不包含預覽文字。本機字型不會把預覽文字放進請求。
- LocalStorage 僅記錄收藏與排版設定；若被封鎖，工具仍可使用，但無法保存設定。
- 罕用字、Emoji 與未收錄字元可能使用系統替代字型。載入成功不表示所有字元皆被該字型收錄；首版不做逐字缺字偵測。
- 不提供帳號、跨裝置同步、離線保證、追蹤分析或圖片匯出。

## 新增或更新字型

1. 從作者官方來源確認繁體中文支援、OFL 授權、網頁嵌入與散布條件。
2. 在 `src/fonts.ts` 新增 `FontDefinition`：唯一 ID、中英文名稱、作者、分類、描述、真實支援字重、官方來源／下載連結、授權檔與 loader。Google Fonts 設定 family 和 axis；CJK 網頁字型設定家族、釘選的 CSS URL、字重與字寬。
3. Google Fonts 使用正確的 API 參數；外部 CSS 必須具備 unicode-range 並釘選可重現的套件版本；本地原始字型放入 `assets/fonts/`，產生的 WOFF2 放入 `public/fonts/` 並採按需載入。加入完整原始授權文件，使用固定來源更新 `assets.lock.json` 的位元組數與 SHA-256；再執行 `npm run assets:fonts` 更新 WOFF2 與最佳化資產鎖。
4. 同步首頁精選數量、README 與目錄完整性測試；執行單元、瀏覽器及真實字型測試。

目前目錄收錄三十四款，Google Fonts 繁中／香港目錄、臺灣開源字型專案、CNS11643 全字庫與三個 CJK 字型子集服務都已完成盤點。納入條件是來源可追溯、授權可用於網頁預覽、繁中字形或繁中版本可確認，並能按需載入字元子集。搜尋清單與未納入字型的理由整理在 [`docs/font-catalog-research.md`](docs/font-catalog-research.md)。不要把不允許再散布的字型放進 repository，也不要把不支援的字重當作真實字型提供。

## GitHub Pages 部署

Repository：`cpnei/font-select`，預設分支：`main`。

在 GitHub **Settings → Pages → Build and deployment** 選擇 **GitHub Actions**。`.github/workflows/pages.yml` 會在 PR 檢查測試與建置；推送到 `main` 後，檢查通過才部署 `dist/`。不需要另外設定 token 或 secret。

Vite 的 `base` 是 `/font-select/`。若更換 repository 名稱或自訂網域，須同步修改 `vite.config.ts`、Playwright base URL 與文件連結。本站沒有依賴伺服器的路由，重新整理不需要 SPA fallback。

Vite 建置會從 `src/fonts.ts` 產生包含目錄及授權連結的首頁 HTML，瀏覽器則使用同一份卡片模板更新篩選結果。首頁的 canonical 與 [sitemap.xml](https://cpnei.github.io/font-select/sitemap.xml) 共用 `vite.config.ts` 的正式網址。驗證 Search Console 的網址前置字元資源後，可提交這份 sitemap。

部署後確認首頁、字型、授權連結與手機版正常。需要回復版本時，revert 問題提交並推送至 `main`，由同一套 CI 重新部署。

GitHub Pages 免費公開託管仍有[容量與流量限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)，不視為無上限服務。
