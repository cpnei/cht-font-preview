# 繁體中文字型來源盤點

更新日期：2026-11-21

## 盤點範圍與納入原則

沒有單一的免費字型全集。本次交叉檢視 Google Fonts 的繁體中文與香港中文子集、Fontsource 繁中目錄、臺灣字型作者與政府字型來源、CJK 字型網頁子集登錄，以及可追溯至原始字型專案的開源字型套件。收錄需要符合四項條件：

1. 字型原作者或官方來源可確認。
2. 授權全文明確，允許網頁使用及對外提供字型預覽。
3. 有臺灣／香港繁中字形版本，或官方說明明確提供繁體中文支援。
4. 能在使用者預覽時按需載入字元，避免第一次開頁就下載整套大型 CJK 字型。

目前目錄四十九款。首批三十四款涵蓋 Google Fonts 繁中／香港目錄、CJK 字型子集套件、本機預覽檔和 Ziano 的傳承字形服務。第二批新增下列八款。

## 第三批新增

| 字型 | 網站字重與來源 |
| --- | --- |
| IBM Plex Sans TC | 400、700。[IBM 1.1.1](https://github.com/IBM/plex/releases/tag/@ibm%2Fplex-sans-tc@1.1.1) 的官方 WOFF2 字元分片。 |
| 大波浪圓體 TC | 400。[v2.143 的 CJK TC WOFF2](https://github.com/max32002/pop-gothic)，部分字保留日式筆形。 |
| 白鷺楷 | 500。[作者上傳的橫排 TTF](https://github.com/huthief/BailuKai/releases/tag/20261012)。 |
| 清松手寫體 9 號 | 400。[原作者的文青款 TTF](https://github.com/jasonhandwriting/JasonHandwriting)。 |
| 何某手寫體 | 400。[v1.046 的官方 WOFF2](https://github.com/max32002/nanifont)。 |
| 獅尾三角黑體 TC | 400。[v2.129 的 CJK TC WOFF2](https://github.com/max32002/swei-3t-sans)。 |
| 源石黑體月 TW | 400。[v2.100 的 TW OTF](https://github.com/ButTaiwan/genseki-font/releases/tag/v2.100)。 |

七款都採 OFL 1.1；IBM 使用官方字元分片，其餘六款使用本站 WOFF2 樣張子集，需要子集外的字元時會提示完整字型大小。上述收錄字重皆涵蓋三組內建樣張與文字搭配的預設文案。

## 第二批新增

| 字型 | 網站字重與來源 |
| --- | --- |
| LINE Seed TW | Thin 250、Regular 400、Bold 700、ExtraBold 800。取自 [LINE 官方套件](https://seed.line.me/index_tw.html) 1.4.00。 |
| 台灣圓體 TaiwanPearl | Regular 400。[作者專案](https://github.com/max32002/TaiwanPearl) 的官方 WOFF2。 |
| 豆腐烏 | 20.05 Regular 400。[再會豆腐字](https://tauhu.tw/ji-hing/) 提供的 WOFF2。23.11 Bold 僅收錄部分臺語字元，作為增補字型使用。 |
| 源流明體月 TW | Regular 400、Bold 700。取自 [ButTaiwan v2.100 TW 套件](https://github.com/ButTaiwan/genryu-font/releases/tag/v2.100)。 |
| 清松手寫體 1、2、4、5 號 | 各一種字重，對應圓潤、秀氣、POP 及行楷。[作者專案](https://github.com/jasonhandwriting/JasonHandwriting) 的 TTF。 |

本批都依作者發布的 OFL 1.1 收錄。LINE Seed TW、台灣圓體和豆腐烏的完整 WOFF2 採原檔；源流明體月和清松手寫體的完整 WOFF2 是本站轉換版。每個字重的精簡樣張使用獨立內部名稱，來源、授權與完整檔大小可從網站查閱。原始下載的雜湊記在 [來源鎖定檔](../assets/web-font-sources.json)。

## 本次新增

### Google Fonts

下列十款均可用 Google Fonts 的繁中或香港繁中子集按需載入；授權全文保存於 `public/licenses/`。

| 字型 | 類型 | 官方來源 |
| --- | --- | --- |
| 仙人掌古典明體 Cactus Classical Serif | 明體 | [Moonlit Owen](https://github.com/MoonlitOwen/CactusSerif) |
| 昭源黑體 HK Chiron Hei HK | 香港黑體 | [Chiron Fonts](https://github.com/chiron-fonts/chiron-hei-hk) |
| 昭源宋體 HK Chiron Sung HK | 香港明體 | [Chiron Fonts](https://github.com/chiron-fonts/chiron-sung-hk) |
| 巧克力古典黑體 Chocolate Classical Sans | 展示黑體 | [Moonlit Owen](https://github.com/MoonlitOwen/ChocolateSans) |
| 霞鶩漫黑 LXGW Marker Gothic | 手寫展示字 | [LXGW / Aaron Bell](https://github.com/aaronbell/LxgwMarkerGothic) |
| 霞鶩文楷等寬 TC LXGW WenKai Mono TC | 等寬楷體 | [LXGW / Aaron Bell](https://github.com/aaronbell/LxgwWenkaiTC) |
| 思源黑體 HK Noto Sans HK | 香港黑體 | [Noto CJK](https://github.com/notofonts/noto-cjk) |
| 思源宋體 HK Noto Serif HK | 香港明體 | [Noto CJK](https://github.com/notofonts/noto-cjk) |
| 宇文天穹 UoqMunThenKhung | 手寫明體 | [Moonlit Owen](https://github.com/MoonlitOwen/ThenKhung) |
| WD-XL 滑石體 TC | 展示黑體 | [NightFurySL2001](https://github.com/NightFurySL2001/WD-XL-font) |

### 可依字元分片的繁中網頁字型

這些套件把上游字型分割為 WOFF2，並用 `unicode-range` 讓瀏覽器只下載預覽文字命中的分片。頁面固定套件版本；卡片與下載連結仍指向原作者／上游。

| 字型 | 收錄樣式 | 上游與授權 |
| --- | --- | --- |
| 台北黑體 Taipei Sans TC Beta | Light、Regular、Bold | [JT Foundry 官方下載說明](https://sites.google.com/view/jtfoundry/zh-tw/downloads)，SIL OFL 1.1；[分片套件與來源鎖](https://github.com/vp-tw/cjk-web-fonts/tree/main/packages/taipei-sans-tc) |
| 未來熒黑 Wêlai Glow Sans TC | 標準、壓縮、窄、寬、加寬；每種九字重 | [Project Wêlai](https://github.com/welai/glow-sans)，SIL OFL 1.1；分片版本固定在上游 v0.93 |
| Fusion Pixel Font | 12px 等寬、12px 比例 | [TakWolf 與貢獻者](https://github.com/TakWolf/fusion-pixel-font)，繁中來源、OFL 與組成字型授權全文一併收錄 |
| 源起明體 GenKi Mincho TC | 七字重 | [ButTaiwan](https://github.com/ButTaiwan/genyo-font)，SIL OFL 1.1 |
| 源樣明體 GenYo Mincho TC | 七字重 | [ButTaiwan](https://github.com/ButTaiwan/genyo-font)，SIL OFL 1.1 |
| 全字庫正宋體 TW-Sung | Regular；含擴充漢字 | [數位發展部 CNS11643 全字庫](https://www.cns11643.gov.tw/)，本次使用的網頁套件採 SIL OFL 1.1 |
| 全字庫正楷體 TW-Kai | Regular；含擴充漢字 | [數位發展部 CNS11643 全字庫](https://www.cns11643.gov.tw/)，本次使用的網頁套件採 SIL OFL 1.1 |

### 傳承字形網頁字型

Ziano 將原作者字型切成 `unicode-range` WOFF2 分片，以固定 npm 版本透過 jsDelivr 載入。標示 TC 的款式採傳統印刷字形方向；「傳承字形」不等同臺灣或香港現行標準字形，目錄會明確標示，供使用者自行比較。

| 字型 | 字重 | 原作者／授權 |
| --- | --- | --- |
| 源樣黑體 TC GenYo Gothic TC | 250、300、350、400、500、700、900 | [ButTaiwan](https://github.com/ButTaiwan/genyog-font)，OFL 1.1 |
| 源起黑體 TC Genki Gothic TC | 250、300、400、500、700、900 | [ButTaiwan](https://github.com/ButTaiwan/genyog-font)，OFL 1.1 |
| 尙古明體 TC Shanggu Serif TC | 可變字重 250–900 | [GuiWonder](https://github.com/GuiWonder/Shanggu)，OFL 1.1 |
| 尙古黑體 TC Shanggu Sans TC | 可變字重 250–900 | [GuiWonder](https://github.com/GuiWonder/Shanggu)，OFL 1.1 |

Google Fonts API 傳送排序、去重後的當前字元子集；CJK 套件則由瀏覽器根據 `unicode-range` 請求分片，網址不帶文字參數。字型 CSS 與子集由 Google Fonts 或 jsDelivr 提供，相關請求的 IP 與一般連線資訊會由對應 CDN 收到。

## 查過但這次沒有納入

| 字型／來源 | 暫不納入的原因 |
| --- | --- |
| Bpmf Huninn、Bpmf Iansui、Bpmf Zihi Kai Std | 主要差異在注音／變體序列呈現，不適合一般預覽文字比較。 |
| ChillDINGothic | 有 OFL 網頁分片套件，但上游說明未確認臺灣或香港繁中字形標準，先不放入以繁中為主的目錄。 |
| WenJin Mincho、Zhuque Fangsong、Black Sugar Plum Candy | 字型包可取得，但來源說明分別標示中國字形習慣、預發布階段或日文字形取向；目前不把它們當作臺灣／香港繁中字型推薦。 |
| ChillDINGothic | 有 OFL 與繁中文字元分片，但上游沒有確認臺灣或香港字形標準，先不標示為繁中地區字型。 |
| Swei 獅尾系列、ButTaiwan 源泉圓體／源雲明體 | 可列入後續擴充，需為各款確認字形版本、字重與網頁載入方案。 |

未納入表示這次網站尚未收錄，並非評價字型品質或判定其授權不可用。若之後為完整字型建立小型預覽子集與按需完整載入，可以把這些候選再加入，而不必把大型原檔放入頁面初始下載。

## 版本與授權維護

- Google Fonts 的授權文字及本機字型原檔由 `assets.lock.json` 固定 URL、大小與 SHA-256。
- 外部 CSS 釘選 npm 版本；外部授權文件也固定版本並由同一鎖檔驗證。
- Ziano 以固定版本 npm 套件分發源自 ButTaiwan 與 GuiWonder 的傳承字形子集；卡片來源與下載仍指向字型原作者。
- Fusion Pixel 的授權頁合併該繁中樣式所使用的上游字型授權全文。
- 全字庫來源允許使用政府資料開放授權或 OFL；本次採用的 `@free-fonts` 字型包按 OFL 1.1 散布，並保留來源標示。
- 新增字型前再次檢查目前上游版本、字形地區、授權文字、字重、網頁 CSS 與 WOFF2 分片是否仍可取得。
