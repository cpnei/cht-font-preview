import { categories, fonts, type FontDefinition } from './fonts.ts';
import pairingSample from './pairing-sample.json' with { type: 'json' };
import samples from './samples.json' with { type: 'json' };

const icons = {
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  compare: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="7" cy="6" r="1.5" fill="currentColor"/><circle cx="17" cy="12" r="1.5" fill="currentColor"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/>',
};
export const icon = (name: keyof typeof icons) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
function weightOptions(font: FontDefinition, selectedWeight: number) {
  const names: Record<number, string> = {100: '極細', 200: '特細', 250: '特細', 300: '細體', 350: '中細', 400: '標準', 500: '中黑', 600: '半粗', 700: '粗體', 800: '特粗', 900: '極粗'};
  return font.weights.map(weight => `<option value="${weight}" ${selectedWeight === weight ? 'selected' : ''}>${names[weight] ?? '字重'} ${weight}</option>`).join('');
}

export function fontCard(font: FontDefinition, base: string, selectedWeight = font.defaultWeight, favorite = false) {
  return `<article class="font-card" data-font="${font.id}" aria-label="${font.name}">
    <div class="card-top"><span class="font-category"><i class="category-dot category-${categories.indexOf(font.category)}"></i>${font.category}</span><button class="icon-button favorite-button" type="button" data-favorite="${font.id}" aria-label="收藏 ${font.name}" aria-pressed="${favorite}">${icon('heart')}</button></div>
    <div class="font-heading"><h3>${font.name}</h3><span>${font.englishName}</span></div>
    <div class="preview-area"><p class="font-preview" data-preview></p><div class="font-placeholder" data-placeholder></div></div>
    <div class="font-status" data-status aria-live="polite"></div>
    <div class="card-description"><p>${font.description}</p><label class="weight-label"><span class="sr-only">${font.name} 字重</span><select data-weight="${font.id}" ${font.weights.length === 1 ? 'disabled' : ''}>${weightOptions(font, selectedWeight)}</select></label></div>
    <div class="card-details"><a href="${font.sourceUrl}" target="_blank" rel="noopener noreferrer">${font.author} ${icon('arrow')}</a><a class="license-badge" href="${base}${font.licensePath}" target="_blank" rel="noopener noreferrer" aria-label="${font.name} OFL 授權">OFL・可商用</a></div>
    <div class="card-footer"><a href="${font.downloadUrl}" target="_blank" rel="noopener noreferrer">前往下載 ${icon('arrow')}</a></div>
  </article>`;
}

export function renderHome(base: string) {
  return `
  <a class="skip-link" href="#preview-input">跳至預覽文字</a>
  <header class="site-header wrap">
    <a class="brand" href="${base}" aria-label="字選首頁"><span class="brand-mark">字</span><span class="brand-name">字選<span>FONT SELECT</span></span></a>
    <nav aria-label="主選單"><a class="nav-active" href="#catalog">探索字型</a><a href="#pairing">文字搭配</a><button type="button" data-open-about>關於字選</button><a class="github-link" href="https://github.com/cpnei/font-select" target="_blank" rel="noopener noreferrer">GitHub ${icon('arrow')}</a></nav>
  </header>
  <main class="wrap">
    <section class="hero" aria-labelledby="hero-title">
      <div><p class="eyebrow"><span></span> 字裡行間，自有風景</p><h1 id="hero-title">免費繁體中文<span>字型預覽</span><i aria-hidden="true">*</i></h1></div>
      <div class="hero-aside"><p>用自己的文字比較黑體、明體、圓體與手寫字型。<br>也能分別替標題和段落選字，預覽搭配效果。</p><div class="hero-meta"><span><b>${String(fonts.length).padStart(2, '0')}</b> 款精選字型</span><span class="meta-dot"></span><span>開源・免費商用</span></div></div>
    </section>
    <section class="editor" aria-label="預覽設定">
      <div class="editor-main"><div class="editor-heading"><label for="preview-input">試著寫點什麼</label><span id="char-count">${Array.from(samples[0].text).length} / 500</span></div>
        <textarea id="preview-input" rows="2" spellcheck="false" aria-describedby="input-help char-count preview-privacy-note" placeholder="在這裡輸入，看看文字的不同表情…"></textarea>
        <div class="sample-row"><span id="input-help">或試試</span>${samples.map((sample, i) => `<button type="button" class="sample-button" data-sample="${i}" aria-pressed="${i === 0}">${sample.name}</button>`).join('')}<button id="clear-text" type="button" class="clear-text">清空</button></div>
        <p class="preview-font-note" id="preview-privacy-note">字型會在需要時載入預覽字元；Google Fonts 會收到去重字元清單。</p>
      </div>
      <div class="editor-controls"><div class="controls-heading"><span>排版設定</span><button id="reset-settings" type="button" aria-label="重設排版設定" title="重設排版設定">${icon('reset')}</button></div>
        <label class="range-control" for="font-size"><span>字級 <output id="font-size-value"></output></span><input id="font-size" type="range" min="16" max="72" step="1"></label>
        <div class="small-controls"><label class="range-control" for="letter-spacing"><span>字距 <output id="letter-spacing-value"></output></span><input id="letter-spacing" type="range" min="-1" max="8" step="0.5"></label><label class="range-control" for="line-height"><span>行高 <output id="line-height-value"></output></span><input id="line-height" type="range" min="1.2" max="2.4" step="0.1"></label></div>
      </div>
    </section>
    <section class="catalog" id="catalog" aria-labelledby="catalog-heading">
      <div class="catalog-top"><div class="catalog-title"><h2 id="catalog-heading">找一款，剛剛好的字。<span id="result-count">${String(fonts.length).padStart(2, '0')} TYPEFACES</span></h2><button class="view-toggle" id="view-toggle" type="button" aria-pressed="false">${icon('compare')}<span>單行比較</span></button></div><div class="search-box">${icon('search')}<input id="search" type="search" aria-label="搜尋字型" placeholder="搜尋字型、設計師…"></div></div>
      <div class="filter-row"><div class="category-list" role="group" aria-label="字型分類">${categories.map((item, i) => `<button class="category-button" type="button" data-category="${item}" aria-pressed="${i === 0}">${item}</button>`).join('')}</div><button class="favorites-filter" id="favorites-filter" type="button" aria-pressed="false">${icon('heart')}<span>我的收藏</span><span id="favorites-count">0</span></button></div>
      <p class="catalog-hint"><span data-view-hint>一段文字，${fonts.length} 種表情。</span><span>${icon('heart')} 收藏喜歡的字型，隨時回來看</span></p>
      <div class="font-grid" id="font-grid">${fonts.map(font => fontCard(font, base)).join('')}</div>
      <div class="compare-list" id="compare-list" hidden></div>
      <div class="empty-state" id="empty-state" hidden><span aria-hidden="true">字</span><h3>還沒遇見這款字</h3><p>換個關鍵字，或放寬篩選條件試試。</p><button type="button" id="reset-filters" class="button-primary">顯示所有字型</button></div>
      <noscript><p class="coverage-note">開啟 JavaScript 即可試打文字、比較與收藏字型。你仍可瀏覽字型資料、授權與下載連結。</p></noscript>
      <p class="coverage-note">每款字型收錄的字元不同，罕用字、符號或 Emoji 可能由系統字型顯示。</p>
    </section>
    <section class="pairing-section" id="pairing" aria-labelledby="pairing-heading">
      <div class="pairing-section-heading"><div><p class="eyebrow"><span></span> TYPE PAIRING</p><h2 id="pairing-heading">標題與內文，各選一款字型。</h2></div><p>編輯文字、挑選字型，即時查看搭配。</p></div>
      <noscript><p class="coverage-note">開啟 JavaScript 即可預覽字型搭配。</p></noscript>
      <div class="pairing-layout">
        <div class="pairing-controls">
          <div class="pairing-font-selects">
            <label class="pairing-field" for="pairing-heading-font"><span>標題字型</span><select id="pairing-heading-font" data-pair-font>${fonts.map(font => `<option value="${font.id}" ${font.id === 'noto-serif-tc' ? 'selected' : ''}>${font.name}</option>`).join('')}</select></label>
            <label class="pairing-field" for="pairing-body-font"><span>內文字型</span><select id="pairing-body-font" data-pair-font>${fonts.map(font => `<option value="${font.id}" ${font.id === 'noto-sans-tc' ? 'selected' : ''}>${font.name}</option>`).join('')}</select></label>
          </div>
          <label class="pairing-field" for="pairing-heading-text"><span>標題文字</span><input id="pairing-heading-text" type="text" maxlength="80" value="${pairingSample.heading}"></label>
          <label class="pairing-field" for="pairing-body-text"><span>段落內文</span><textarea id="pairing-body-text" rows="4" maxlength="400">${pairingSample.body}</textarea></label>
          <p class="pairing-status" id="pairing-status" role="status" aria-live="polite"></p>
        </div>
        <div class="pairing-canvas" id="pairing-canvas">
          <span class="pairing-canvas-label">即時排版預覽</span>
          <article class="pairing-specimen" aria-label="標題與內文字型搭配預覽">
            <h3 id="pairing-preview-heading"></h3>
            <p id="pairing-preview-body"></p>
          </article>
          <span class="pairing-canvas-footer">標題與內文可使用不同字型</span>
        </div>
      </div>
    </section>
    <section class="font-guide" aria-labelledby="font-guide-heading">
      <h2 id="font-guide-heading">繁體中文字型常見問題</h2>
      <h3>這些免費字型可以商用嗎？</h3>
      <p>可以。本目錄收錄的字型採 SIL Open Font License 1.1，可用於海報、網站與其他商業作品。修改或重新散布字型檔案時，請查看各款字型附上的授權及補充說明。<a href="https://openfontlicense.org/ofl-faq/">SIL 開放字型授權常見問題</a></p>
      <h3>標題和內文怎麼搭配字型？</h3>
      <p>可以先試明體標題搭配黑體內文，例如 Noto Serif TC 配 Noto Sans TC。把實際的標題和段落貼到<a href="#pairing">文字搭配工具</a>，再檢查筆畫粗細及不同字級下的可讀性。</p>
      <h3>哪裡可以下載原始字型？</h3>
      <p><a href="#catalog">字型目錄</a>的每張卡片都列有作者或專案來源，以及下載和授權連結。選擇「前往下載」可到該專案提供的頁面取得字型。</p>
    </section>
    <section class="closing-note"><span aria-hidden="true">字</span><div><h2>好字，值得被看見。</h2><p>感謝每一位字型創作者，讓文字有更多可能。<br>喜歡一款字，也別忘了到作者的頁面走走。</p></div><button type="button" data-open-about>關於字型與授權 ${icon('arrow')}</button></section>
  </main>
  <footer class="site-footer wrap"><span>字選 FONT SELECT <span class="footer-dash">—</span> 給每一個認真選字的人。</span><span>Made for Traditional Chinese. <a href="https://github.com/cpnei/font-select" target="_blank" rel="noopener noreferrer">開源專案 ${icon('arrow')}</a></span></footer>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title"><div class="dialog-header"><div><p class="eyebrow">ABOUT FONT SELECT</p><h2 id="about-title">讓選字，簡單一點。</h2></div><button type="button" class="icon-button" data-close-dialog aria-label="關閉關於字選">${icon('close')}</button></div><p>字選是一個免費、開源的繁體中文字型預覽工具，收錄 ${fonts.length} 款臺灣與香港繁體字形。你可以逐張瀏覽介紹、切換單行模式比較，也可以分別替標題和內文選字，查看搭配效果。</p><h3>免費商用，尊重原創</h3><p>收錄字型均提供 SIL Open Font License 1.1 全文；少數字型另附上游的補充授權或來源說明。可免費用於個人與商業作品；字型檔案的散布、修改與保留名稱仍須遵守各自授權。本站程式碼採 MIT 授權。</p><h3>關於你的資料</h3><p>收藏與排版設定只保存在這個瀏覽器。本站不會收到或保存預覽文字；使用 Google Fonts 時，精簡請求會將目前所需的去重字元傳給 Google，原文順序不會送出。其他網頁字型透過 jsDelivr 的字元範圍 CSS 按需載入，請求網址不含預覽文字。另兩款本機字型由本站按需提供。本站沒有帳號、廣告或追蹤分析。</p><h3>每一款字，都有自己的樣子</h3><p>字型的收字與地區字形習慣可能不同。罕用字、Emoji 或不支援的符號可能使用系統替代字型；本站不提供逐字缺字偵測。</p><a class="about-source" href="https://github.com/cpnei/font-select" target="_blank" rel="noopener noreferrer">查看原始碼與字型來源 ${icon('arrow')}</a></dialog>
  <div id="notice" class="notice" role="status" aria-live="polite"></div>
`;
}
