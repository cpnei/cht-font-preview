# 字選 Font Select

免費繁體中文字型預覽工具。輸入一段文字，預覽、收藏與比較八款可商用開源字型。

**網站：[cpnei.github.io/cht-font-preview](https://cpnei.github.io/cht-font-preview/)**

## 功能

- 自訂多行文字（最多 500 個 Unicode 字元），提供三組示範文字。
- 調整字級、字距、行高；字重僅提供該字型支援的選項，不合成粗體。
- 搜尋中英文名稱與作者、分類篩選、瀏覽器本機收藏。
- 同時比較最多四款字型，支援手機版與鍵盤操作。
- 明確顯示字型載入狀態、失敗重試、原作者下載與授權連結。

## 本機開發

需要 Node.js 24 與 npm。

```sh
npm ci
npm run dev
```

開啟終端機顯示的 `/cht-font-preview/` 網址。專案採用 Vite、TypeScript 與原生 CSS，沒有後端、資料庫或環境變數需求。

```sh
npm test                # 資料與互動狀態單元測試
npm run build           # 型別、原始資產 SHA-256 驗證與正式建置
npx playwright install chromium
npm run test:e2e        # 桌面與手機瀏覽器測試；外部字型失敗採確定性模擬
npm run test:fonts      # 額外連網驗證八款真實字型，包含新文字與字重
npm run preview         # 預覽 dist 正式建置
```

`test:fonts` 需要存取 `fonts.googleapis.com` 與 `fonts.gstatic.com`。它與 CI 的確定性測試分開，避免外部服務的暫時故障阻擋程式碼檢查。完整 E2E 執行時，此項連網測試預設跳過。

## 字型來源

| 字型 | 作者／來源 | 網頁載入 |
| --- | --- | --- |
| Noto Sans TC | [Google / Adobe](https://github.com/notofonts/noto-cjk) | Google Fonts |
| Noto Serif TC | [Google / Adobe](https://github.com/notofonts/noto-cjk) | Google Fonts |
| Huninn 粉圓 | [justfont](https://github.com/justfont/Huninn) | Google Fonts |
| 昭源環方 | [Tamcy / Chiron Fonts](https://github.com/chiron-fonts/chiron-go-round-tc) | Google Fonts |
| 霞鶩文楷 TC | [LXGW / Aaron Bell](https://github.com/aaronbell/LxgwWenkaiTC) | Google Fonts |
| 芫荽 | [But Ko / ButTaiwan](https://github.com/ButTaiwan/iansui) | Google Fonts |
| 辰宇落雁體 2.0 Thin | [劉韋辰 / 王立宇](https://github.com/Chenyu-otf/chenyuluoyan_thin) | 原版 TTF，約 9.5 MB |
| 饅頭黑體 | [mant0u0 / Artakana](https://github.com/mant0u0/MantouSans) | 原版 TTF，約 2.7 MB |

全部字型採 **SIL Open Font License 1.1**，完整版權與授權保存在 `public/licenses/`。免費商用不等於沒有條件：再散布、修改及保留名稱仍須依各字型授權辦理。網站程式碼採 MIT，MIT 不套用於字型檔案。

本地字型未經裁切、轉檔或改名；`assets.lock.json` 記錄不可變的上游 commit URL、檔案大小及 SHA-256。Google Fonts 的實際網頁字型由服務管理，授權文件則保留來源版本。可用 `npm run assets:restore` 從鎖定的來源還原所有字型與授權檔，下載內容不符雜湊時會中止。

## 載入、隱私與限制

- Google Fonts 在卡片接近可視範圍或加入比較時才請求，使用服務回傳的字元分片。
- 兩款較大的本地字型必須點擊「載入預覽」或加入比較才下載，不在首頁預載。
- 文字變動後延遲 250ms 檢查新增字元，避免輸入時大量重複處理；保留中文輸入法組字流程。
- 預覽文字僅存在頁面記憶體，不寫入 LocalStorage，不透過 `text=` 或其他 API 上傳。Google 字型請求會連線至 Google，並下載文字所需的字型分片。
- LocalStorage 僅記錄收藏與排版設定；若被封鎖，工具仍可使用，但無法保存設定。
- 罕用字、Emoji 與未收錄字元可能使用系統替代字型。載入成功不表示所有字元皆被該字型收錄；首版不做逐字缺字偵測。
- 不提供帳號、跨裝置同步、離線保證、追蹤分析或圖片匯出。

## 新增或更新字型

1. 從作者官方來源確認繁體中文支援、OFL 授權、網頁嵌入與散布條件。
2. 在 `src/fonts.ts` 新增 `FontDefinition`：唯一 ID、中英文名稱、作者、分類、描述、真實支援字重、官方來源／下載連結、授權檔與 loader。
3. Google Fonts 使用正確 family 與字重 API 參數；本地字型放入 `public/fonts/` 並採點擊載入。加入完整原始授權文件，使用固定 commit URL 更新 `assets.lock.json` 的位元組數與 SHA-256。
4. 同步首頁精選數量、README 與目錄完整性測試；執行單元、瀏覽器及真實字型測試。

目前目錄數量固定為八款，新增字型時需一併更新頁面文案。不要把不允許再散布的字型放進 repository，也不要把不支援的字重當作真實字型提供。

## GitHub Pages 部署

Repository：`cpnei/cht-font-preview`，預設分支：`main`。

在 GitHub **Settings → Pages → Build and deployment** 選擇 **GitHub Actions**。`.github/workflows/pages.yml` 會在 PR 檢查測試與建置；推送到 `main` 後，檢查通過才部署 `dist/`。不需要另外設定 token 或 secret。

Vite 的 `base` 是 `/cht-font-preview/`。若更換 repository 名稱或自訂網域，須同步修改 `vite.config.ts`、Playwright base URL 與文件連結。本站沒有依賴伺服器的路由，重新整理不需要 SPA fallback。

部署後確認首頁、字型、授權連結與手機版正常。需要回復版本時，revert 問題提交並推送至 `main`，由同一套 CI 重新部署。

GitHub Pages 免費公開託管仍有[容量與流量限制](https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits)，不視為無上限服務。
