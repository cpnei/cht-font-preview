import './style.css';
import { assetUrl, categories, fonts, fontById, fontFamily, type Category, type FontDefinition } from './fonts';
import { defaults, filterFonts, limitText, restore, samples, storageKey, type Settings } from './state';
import { FontLoader } from './loader';

const icons = {
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  compare: '<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="7" cy="6" r="1.5" fill="currentColor"/><circle cx="17" cy="12" r="1.5" fill="currentColor"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  reset: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M5 16v5h14v-5"/>',
};
const icon = (name: keyof typeof icons) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name]}</svg>`;
const $ = <T extends HTMLElement>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector)!;

let stored: string | null = null;
try { stored = localStorage.getItem(storageKey); } catch { /* Storage is optional. */ }
const initial = restore(stored);
let settings: Settings = initial.settings;
const favorites = initial.favorites;
let previewText = samples[0].text;
let query = '';
let category: Category = '全部字型';
let favoritesOnly = false;
let viewMode: 'cards' | 'compare' = 'cards';
const weights = new Map(fonts.map(font => [font.id, font.defaultWeight]));
const requested = new Set<string>();
let noticeTimer: ReturnType<typeof setTimeout>;
let textTimer: ReturnType<typeof setTimeout>;
let pairingRequestTimer: ReturnType<typeof setTimeout>;
let compareScrollProgress = 0;
let compareScrollFrame = 0;
let pairingActivated = false;
const expectedCompareScroll = new WeakMap<HTMLElement, number>();

$('#app').innerHTML = `
  <a class="skip-link" href="#preview-input">跳至預覽文字</a>
  <header class="site-header wrap">
    <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="字選首頁"><span class="brand-mark">字</span><span class="brand-name">字選<span>FONT SELECT</span></span></a>
    <nav aria-label="主選單"><a class="nav-active" href="#catalog">探索字型</a><a href="#pairing">文字搭配</a><button type="button" data-open-about>關於字選</button><a class="github-link" href="https://github.com/cpnei/cht-font-preview" target="_blank" rel="noopener noreferrer">GitHub ${icon('arrow')}</a></nav>
  </header>
  <main class="wrap">
    <section class="hero" aria-labelledby="hero-title">
      <div><p class="eyebrow"><span></span> 字裡行間，自有風景</p><h1 id="hero-title">好字，讓想法<span>有了樣子。</span><i aria-hidden="true">*</i></h1></div>
      <div class="hero-aside"><p>輸入一段文字，遇見適合它的字型。<br>從日常書寫到靈感提案，<br>在這裡，找到你的下一個好字。</p><div class="hero-meta"><span><b>08</b> 款精選字型</span><span class="meta-dot"></span><span>開源・免費商用</span></div></div>
    </section>
    <section class="editor" aria-label="預覽設定">
      <div class="editor-main"><div class="editor-heading"><label for="preview-input">試著寫點什麼</label><span id="char-count">0 / 500</span></div>
        <textarea id="preview-input" rows="2" spellcheck="false" aria-describedby="input-help char-count preview-privacy-note" placeholder="在這裡輸入，看看文字的不同表情…"></textarea>
        <div class="sample-row"><span id="input-help">或試試</span>${samples.map((sample, i) => `<button type="button" class="sample-button" data-sample="${i}" aria-pressed="${i === 0}">${sample.name}</button>`).join('')}<button id="clear-text" type="button" class="clear-text">清空</button></div>
        <p class="preview-font-note" id="preview-privacy-note">Google 字型會依預覽文字載入所需字元；精簡請求會傳送去重字元清單。</p>
      </div>
      <div class="editor-controls"><div class="controls-heading"><span>排版設定</span><button id="reset-settings" type="button" aria-label="重設排版設定" title="重設排版設定">${icon('reset')}</button></div>
        <label class="range-control" for="font-size"><span>字級 <output id="font-size-value"></output></span><input id="font-size" type="range" min="16" max="72" step="1"></label>
        <div class="small-controls"><label class="range-control" for="letter-spacing"><span>字距 <output id="letter-spacing-value"></output></span><input id="letter-spacing" type="range" min="-1" max="8" step="0.5"></label><label class="range-control" for="line-height"><span>行高 <output id="line-height-value"></output></span><input id="line-height" type="range" min="1.2" max="2.4" step="0.1"></label></div>
      </div>
    </section>
    <section class="catalog" id="catalog" aria-labelledby="catalog-heading">
      <div class="catalog-top"><div class="catalog-title"><h2 id="catalog-heading">找一款，剛剛好的字。<span id="result-count">08 TYPEFACES</span></h2><button class="view-toggle" id="view-toggle" type="button" aria-pressed="false">${icon('compare')}<span>單行比較</span></button></div><div class="search-box">${icon('search')}<input id="search" type="search" aria-label="搜尋字型" placeholder="搜尋字型、設計師…"></div></div>
      <div class="filter-row"><div class="category-list" role="group" aria-label="字型分類">${categories.map((item, i) => `<button class="category-button" type="button" data-category="${item}" aria-pressed="${i === 0}">${item}</button>`).join('')}</div><button class="favorites-filter" id="favorites-filter" type="button" aria-pressed="false">${icon('heart')}<span>我的收藏</span><span id="favorites-count">${favorites.size}</span></button></div>
      <p class="catalog-hint"><span data-view-hint>一段文字，八種表情。</span><span>${icon('heart')} 收藏喜歡的字型，隨時回來看</span></p>
      <div class="font-grid" id="font-grid"></div>
      <div class="compare-list" id="compare-list" hidden></div>
      <div class="empty-state" id="empty-state" hidden><span aria-hidden="true">字</span><h3>還沒遇見這款字</h3><p>換個關鍵字，或放寬篩選條件試試。</p><button type="button" id="reset-filters" class="button-primary">顯示所有字型</button></div>
      <p class="coverage-note">每款字型收錄的字元不同，罕用字、符號或 Emoji 可能由系統字型顯示。</p>
    </section>
    <section class="pairing-section" id="pairing" aria-labelledby="pairing-heading">
      <div class="pairing-section-heading"><div><p class="eyebrow"><span></span> TYPE PAIRING</p><h2 id="pairing-heading">標題與內文，各選一款字型。</h2></div><p>編輯文字、挑選字型，即時查看搭配。</p></div>
      <div class="pairing-layout">
        <div class="pairing-controls">
          <div class="pairing-font-selects">
            <label class="pairing-field" for="pairing-heading-font"><span>標題字型</span><select id="pairing-heading-font" data-pair-font>${fonts.map(font => `<option value="${font.id}" ${font.id === 'noto-serif-tc' ? 'selected' : ''}>${font.name}</option>`).join('')}</select></label>
            <label class="pairing-field" for="pairing-body-font"><span>內文字型</span><select id="pairing-body-font" data-pair-font>${fonts.map(font => `<option value="${font.id}" ${font.id === 'noto-sans-tc' ? 'selected' : ''}>${font.name}</option>`).join('')}</select></label>
          </div>
          <label class="pairing-field" for="pairing-heading-text"><span>標題文字</span><input id="pairing-heading-text" type="text" maxlength="80" value="讓每一段文字，都有自己的樣子。"></label>
          <label class="pairing-field" for="pairing-body-text"><span>段落內文</span><textarea id="pairing-body-text" rows="4" maxlength="400">標題負責吸引目光，內文陪伴閱讀。為它們挑選不同字型，感受筆畫、節奏與性格如何搭配。</textarea></label>
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
    <section class="closing-note"><span aria-hidden="true">字</span><div><h2>好字，值得被看見。</h2><p>感謝每一位字型創作者，讓文字有更多可能。<br>喜歡一款字，也別忘了到作者的頁面走走。</p></div><button type="button" data-open-about>關於字型與授權 ${icon('arrow')}</button></section>
  </main>
  <footer class="site-footer wrap"><span>字選 FONT SELECT <span class="footer-dash">—</span> 給每一個認真選字的人。</span><span>Made for Traditional Chinese. <a href="https://github.com/cpnei/cht-font-preview" target="_blank" rel="noopener noreferrer">開源專案 ${icon('arrow')}</a></span></footer>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title"><div class="dialog-header"><div><p class="eyebrow">ABOUT FONT SELECT</p><h2 id="about-title">讓選字，簡單一點。</h2></div><button type="button" class="icon-button" data-close-dialog aria-label="關閉關於字選">${icon('close')}</button></div><p>字選是一個免費、開源的繁體中文字型預覽工具。我們精選八款適合繁體中文使用的字型，你可以逐張瀏覽介紹、切換單行模式比較，也可以分別替標題和內文選字，查看搭配效果。</p><h3>免費商用，尊重原創</h3><p>收錄字型皆採 SIL Open Font License 1.1。可免費用於個人與商業作品；字型檔案的散布、修改與保留名稱仍須遵守各自授權。每張卡片附有作者來源與完整授權，本站程式碼則採 MIT 授權。</p><h3>關於你的資料</h3><p>收藏與排版設定只保存在這個瀏覽器。本站不會收到或保存預覽文字；使用 Google Fonts 時，精簡請求會將目前所需的去重字元傳給 Google，原文順序不會送出。字元清單太長時則使用一般字元分片載入。另兩款本機字型由本站按需提供。本站沒有帳號、廣告或追蹤分析。</p><h3>每一款字，都有自己的樣子</h3><p>字型的收字與地區字形習慣可能不同。罕用字、Emoji 或不支援的符號可能使用系統替代字型；本站不提供逐字缺字偵測。</p><a class="about-source" href="https://github.com/cpnei/cht-font-preview" target="_blank" rel="noopener noreferrer">查看原始碼與字型來源 ${icon('arrow')}</a></dialog>
  <div id="notice" class="notice" role="status" aria-live="polite"></div>
`;

const loader = new FontLoader(updateFont);
const input = $<HTMLTextAreaElement>('#preview-input');
const pairingHeadingFont = $<HTMLSelectElement>('#pairing-heading-font');
const pairingBodyFont = $<HTMLSelectElement>('#pairing-body-font');
const pairingHeadingText = $<HTMLInputElement>('#pairing-heading-text');
const pairingBodyText = $<HTMLTextAreaElement>('#pairing-body-text');
const localSubsetCharacters = new Set([
  ...samples.flatMap(sample => Array.from(sample.text)),
  ...Array.from({ length: 0x7F - 0x20 }, (_, index) => String.fromCodePoint(0x20 + index)),
  ...Array.from('Aa臺灣'),
]);
input.value = previewText;

function notify(message: string) {
  clearTimeout(noticeTimer);
  $('#notice').textContent = message;
  $('#notice').classList.add('visible');
  noticeTimer = setTimeout(() => $('#notice').classList.remove('visible'), 3500);
}

function persist() {
  try { localStorage.setItem(storageKey, JSON.stringify({ favorites: [...favorites], settings })); }
  catch { notify('瀏覽器無法儲存設定，本次仍可正常使用。'); }
}

function weightOptions(font: FontDefinition) {
  const names: Record<number, string> = {100: '極細', 200: '特細', 300: '細體', 400: '標準', 500: '中黑', 600: '半粗', 700: '粗體', 800: '特粗', 900: '極粗'};
  return font.weights.map(weight => `<option value="${weight}" ${weights.get(font.id) === weight ? 'selected' : ''}>${names[weight]} ${weight}</option>`).join('');
}

function cardHTML(font: FontDefinition) {
  return `<article class="font-card" data-font="${font.id}" aria-label="${font.name}">
    <div class="card-top"><span class="font-category"><i class="category-dot category-${categories.indexOf(font.category)}"></i>${font.category}</span><button class="icon-button favorite-button" type="button" data-favorite="${font.id}" aria-label="收藏 ${font.name}" aria-pressed="${favorites.has(font.id)}">${icon('heart')}</button></div>
    <div class="font-heading"><h3>${font.name}</h3><span>${font.englishName}</span></div>
    <div class="preview-area"><p class="font-preview" data-preview></p><div class="font-placeholder" data-placeholder></div></div>
    <div class="font-status" data-status aria-live="polite"></div>
    <div class="card-description"><p>${font.description}</p><label class="weight-label"><span class="sr-only">${font.name} 字重</span><select data-weight="${font.id}" ${font.weights.length === 1 ? 'disabled' : ''}>${weightOptions(font)}</select></label></div>
    <div class="card-details"><a href="${font.sourceUrl}" target="_blank" rel="noopener noreferrer">${font.author} ${icon('arrow')}</a><a class="license-badge" href="${assetUrl(font.licensePath)}" target="_blank" rel="noopener noreferrer" aria-label="${font.name} OFL 授權">OFL・可商用</a></div>
    <div class="card-footer"><a href="${font.downloadUrl}" target="_blank" rel="noopener noreferrer">前往下載 ${icon('arrow')}</a></div>
  </article>`;
}

function compareRowHTML(font: FontDefinition) {
  return `<article class="compare-row" data-font="${font.id}" aria-label="${font.name}">
    <div class="compare-row-heading"><span class="font-category"><i class="category-dot category-${categories.indexOf(font.category)}"></i>${font.category}</span><h3>${font.name}</h3><span class="compare-english">${font.englishName}</span></div>
    <p class="compare-preview" data-compare-preview tabindex="0" aria-label="${font.name} 字型預覽；水平捲動會同步至所有字型"></p>
    <div class="compare-row-actions"><button class="icon-button favorite-button" type="button" data-favorite="${font.id}" aria-label="收藏 ${font.name}" aria-pressed="${favorites.has(font.id)}">${icon('heart')}</button><span data-compare-load></span><a class="icon-button compare-download" href="${font.downloadUrl}" target="_blank" rel="noopener noreferrer" aria-label="前往下載 ${font.name}">${icon('download')}</a></div>
  </article>`;
}

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    observer.unobserve(entry.target);
    const font = fontById.get((entry.target as HTMLElement).dataset.font!)!;
    if (font.loader.kind === 'google') requestFont(font);
  }
}, { rootMargin: '150px' });
const pairingObserver = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  pairingActivated = true;
  pairingObserver.disconnect();
  updatePairingStatus();
  schedulePairingFontRequest();
}, { rootMargin: '150px' });

function renderCatalog() {
  observer.disconnect();
  const visible = filterFonts(query, category, favoritesOnly, favorites);
  $('#font-grid').innerHTML = visible.map(font => cardHTML(font)).join('');
  $('#compare-list').innerHTML = visible.map(font => compareRowHTML(font)).join('');
  $('#font-grid').hidden = viewMode !== 'cards';
  $('#compare-list').hidden = viewMode !== 'compare';
  $('#result-count').textContent = `${String(visible.length).padStart(2, '0')} TYPEFACES`;
  $('#empty-state').hidden = visible.length > 0;
  for (const font of visible) updateFont(font.id);
  document.querySelectorAll<HTMLElement>(viewMode === 'cards' ? '#font-grid .font-card' : '#compare-list .compare-row').forEach(row => observer.observe(row));
  $('#view-toggle').setAttribute('aria-pressed', String(viewMode === 'compare'));
  $('#view-toggle span').textContent = viewMode === 'compare' ? '卡片檢視' : '單行比較';
  $('#view-toggle').setAttribute('aria-label', viewMode === 'compare' ? '切換至卡片檢視' : '切換至單行比較');
  $('[data-view-hint]').textContent = viewMode === 'compare'
    ? '滑動任一樣張，全部同步'
    : '一段文字，八種表情。';
  updateComparePreviews(true);
  updateFavoriteUI();
}

function requestFont(font: FontDefinition, retry = false, sample = previewText) {
  requested.add(font.id);
  const pairingUsesFont = pairingActivated && (pairingHeadingFont.value === font.id || pairingBodyFont.value === font.id);
  const globalText = sample || '在上方寫點什麼，讓字型說話。在上方輸入要預覽的文字';
  const requestText = pairingUsesFont ? `${globalText}\n${pairingHeadingText.value}\n${pairingBodyText.value}` : globalText;
  const preferSubset = font.loader.kind === 'google' || (font.loader.kind === 'local' && localSubsetCovers(requestText));
  void loader.load(font, requestText, weights.get(font.id)!, retry, preferSubset);
}

function selectedPairFonts() {
  return [...new Set([pairingHeadingFont.value, pairingBodyFont.value])].map(id => fontById.get(id)!);
}

function updatePairingPreview() {
  const headingFont = fontById.get(pairingHeadingFont.value)!;
  const bodyFont = fontById.get(pairingBodyFont.value)!;
  const heading = $<HTMLHeadingElement>('#pairing-preview-heading');
  const body = $<HTMLParagraphElement>('#pairing-preview-body');
  heading.textContent = pairingHeadingText.value;
  heading.style.fontFamily = `"${fontFamily(headingFont)}", serif`;
  heading.style.fontWeight = String(weights.get(headingFont.id));
  body.textContent = pairingBodyText.value;
  body.style.fontFamily = `"${fontFamily(bodyFont)}", serif`;
  body.style.fontWeight = String(weights.get(bodyFont.id));
}

function updatePairingStatus() {
  const status = $<HTMLParagraphElement>('#pairing-status');
  const selected = selectedPairFonts();
  const errors = selected.filter(font => loader.status(font.id) === 'error');
  if (errors.length) {
    status.replaceChildren(document.createTextNode(`${errors.map(font => font.name).join('、')} 載入失敗。`));
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'pairing-retry';
    retry.dataset.pairRetry = 'true';
    retry.textContent = '重新載入';
    status.append(' ', retry);
    return;
  }
  const loading = selected.find(font => loader.status(font.id) === 'loading');
  if (loading) {
    const size = loading.loader.kind === 'local' ? `（${(loading.loader.bytes / 1000000).toFixed(1)} MB）` : '';
    status.textContent = `正在載入 ${loading.name}${size}…`;
    return;
  }
  if (!pairingActivated) {
    status.textContent = '預覽會隨文字即時更新；字型在選用時按需載入。';
    return;
  }
  const idleLocal = selected.find(font => font.loader.kind === 'local' && loader.status(font.id) === 'idle');
  if (idleLocal?.loader.kind === 'local') {
    status.textContent = `首次預覽會載入原始字型（${(idleLocal.loader.bytes / 1000000).toFixed(1)} MB）。`;
    return;
  }
  const idle = selected.find(font => loader.status(font.id) === 'idle');
  if (idle) {
    status.textContent = `準備載入 ${idle.name}…`;
    return;
  }
  status.textContent = `標題：${fontById.get(pairingHeadingFont.value)!.name} · 內文：${fontById.get(pairingBodyFont.value)!.name}`;
}

function requestPairingFonts(retry = false) {
  if (!pairingActivated) return;
  for (const font of selectedPairFonts()) requestFont(font, retry, previewText);
}

function schedulePairingFontRequest(retry = false) {
  clearTimeout(pairingRequestTimer);
  pairingRequestTimer = setTimeout(() => requestPairingFonts(retry), retry ? 0 : 400);
}

function localSubsetCovers(text: string) {
  const normalized = text.replace(/\s+/gu, ' ').trim();
  return normalized.length > 0 && Array.from(`${normalized}Aa臺灣`).every(character => localSubsetCharacters.has(character));
}

function fontCanUsePreviewSubset(font: FontDefinition, sample = previewText) {
  if (font.loader.kind !== 'local') return false;
  const pairingUsesFont = pairingActivated && (pairingHeadingFont.value === font.id || pairingBodyFont.value === font.id);
  const globalText = sample || '在上方寫點什麼，讓字型說話。在上方輸入要預覽的文字';
  return localSubsetCovers(pairingUsesFont ? `${globalText}\n${pairingHeadingText.value}\n${pairingBodyText.value}` : globalText);
}

function updateFont(id: string) {
  const font = fontById.get(id)!;
  const status = loader.status(id);
  const hasLoaded = loader.hasLoaded(id);
  document.querySelectorAll<HTMLElement>(`[data-font="${id}"]`).forEach(card => {
    const comparePreview = card.querySelector<HTMLElement>('[data-compare-preview]');
    if (comparePreview) {
      comparePreview.style.fontFamily = `"${fontFamily(font)}", serif`;
      comparePreview.style.fontWeight = String(weights.get(id));
      comparePreview.title = previewText.replace(/\s+/gu, ' ').trim();
      card.dataset.status = status;
      const load = card.querySelector<HTMLElement>('[data-compare-load]')!;
      if (status === 'idle' && font.loader.kind === 'local') {
        load.innerHTML = `<button class="compare-load-button" type="button" data-load="${id}" aria-label="載入${font.name}預覽">載入</button>`;
      } else if (status === 'error') {
        load.innerHTML = `<button class="compare-load-button" type="button" data-load="${id}" aria-label="重新載入${font.name}預覽">重試</button>`;
      } else if (status === 'loading') {
        load.innerHTML = '<span class="compare-loading" aria-label="字型載入中">···</span>';
      } else {
        load.replaceChildren();
      }
      if (status === 'ready') applyCompareScrollProgress();
      return;
    }
    const preview = $<HTMLParagraphElement>('[data-preview]', card);
    const placeholder = $('[data-placeholder]', card);
    const statusLine = $('[data-status]', card);
    preview.textContent = previewText || '在上方寫點什麼，讓字型說話。';
    preview.style.fontFamily = `"${fontFamily(font)}", serif`;
    preview.style.fontWeight = String(weights.get(id));
    preview.hidden = status !== 'ready' && !hasLoaded;
    placeholder.hidden = status === 'ready' || hasLoaded;
    card.dataset.status = status;
    if (status === 'idle' && font.loader.kind === 'local') {
      const useSubset = fontCanUsePreviewSubset(font);
      const size = useSubset ? `${(font.loader.preview.bytes / 1000).toFixed(0)} KB` : `${(font.loader.bytes / 1000000).toFixed(1)} MB`;
      placeholder.innerHTML = `<span class="local-font-symbol" aria-hidden="true">Aa</span><button type="button" class="load-button" data-load="${id}">${icon('download')} 載入預覽</button><span class="load-size">${useSubset ? '預設樣張' : '完整字型'}・${size}</span>`;
      statusLine.textContent = useSubset ? '預設樣本文字使用精簡字型；自訂文字會載入完整字型。' : '點擊後載入完整字型，體驗完整字形。';
    } else if (status === 'error' && hasLoaded) {
      placeholder.replaceChildren();
      statusLine.innerHTML = `部分字元暫時無法載入，仍可使用其他預覽。<button type="button" class="load-button" data-load="${id}">${icon('reset')} 重試</button>`;
    } else if (status === 'error') {
      placeholder.innerHTML = `<span class="load-failed">字型暫時無法載入</span><button type="button" class="load-button" data-load="${id}">${icon('reset')} 重新載入</button>`;
      statusLine.textContent = '請確認網路連線後重試；仍可前往作者頁面下載。';
    } else if (status === 'loading' && hasLoaded) {
      placeholder.replaceChildren();
      statusLine.textContent = '正在載入這段文字需要的字元…';
    } else if (status === 'idle') {
      placeholder.innerHTML = '<span class="loading-lines" aria-hidden="true"><i></i><i></i></span><span class="load-size">捲動至此處後載入字型</span>';
      statusLine.textContent = '待載入';
    } else if (status !== 'ready') {
      placeholder.innerHTML = '<span class="loading-lines" aria-hidden="true"><i></i><i></i></span><span class="load-size">字型載入中…</span>';
      statusLine.textContent = '正在準備字型樣張';
    } else {
      placeholder.replaceChildren();
      statusLine.innerHTML = '<span class="ready-dot"></span> 字型已載入';
    }
    $<HTMLSelectElement>('[data-weight]', card).value = String(weights.get(id));
  });
  if (pairingHeadingFont.value === id || pairingBodyFont.value === id) updatePairingPreview();
  updatePairingStatus();
}

function applyCompareScrollProgress() {
  document.querySelectorAll<HTMLElement>('#compare-list [data-compare-preview]').forEach(preview => {
    const maxScroll = Math.max(0, preview.scrollWidth - preview.clientWidth);
    const nextScroll = Math.round(maxScroll * compareScrollProgress);
    if (Math.abs(preview.scrollLeft - nextScroll) < 1) return;
    expectedCompareScroll.set(preview, nextScroll);
    preview.scrollLeft = nextScroll;
  });
}

function syncCompareScroll(source: HTMLElement) {
  const maxScroll = Math.max(0, source.scrollWidth - source.clientWidth);
  compareScrollProgress = maxScroll ? Math.min(1, Math.max(0, source.scrollLeft / maxScroll)) : 0;
  applyCompareScrollProgress();
}

function updateComparePreviews(resetScroll = false) {
  const previews = document.querySelectorAll<HTMLElement>('#compare-list [data-compare-preview]');
  if (!previews.length) return;
  const text = previewText.replace(/\s+/gu, ' ').trim();
  const sample = text || '在上方輸入要預覽的文字';
  for (const preview of previews) {
    if (preview.textContent !== sample) preview.textContent = sample;
    preview.title = text;
  }
  if (resetScroll) compareScrollProgress = 0;
  applyCompareScrollProgress();
}

function syncTypography() {
  document.documentElement.style.setProperty('--preview-size', `${settings.size}px`);
  document.documentElement.style.setProperty('--preview-spacing', `${settings.spacing}px`);
  document.documentElement.style.setProperty('--preview-line-height', String(settings.lineHeight));
  for (const [id, key, suffix] of [['font-size', 'size', 'px'], ['letter-spacing', 'spacing', 'px'], ['line-height', 'lineHeight', '']] as const) {
    const slider = $<HTMLInputElement>(`#${id}`);
    slider.value = String(settings[key]);
    slider.style.setProperty('--range-fill', `${(Number(slider.value) - Number(slider.min)) / (Number(slider.max) - Number(slider.min)) * 100}%`);
    $(`#${id}-value`).textContent = `${settings[key]}${suffix}`;
  }
  updateComparePreviews();
}

function setPreviewText(value: string) {
  previewText = limitText(value);
  if (input.value !== previewText) input.value = previewText;
  $('#char-count').textContent = `${Array.from(previewText).length} / 500`;
  document.querySelectorAll<HTMLButtonElement>('[data-sample]').forEach(button => button.setAttribute('aria-pressed', String(previewText === samples[Number(button.dataset.sample)].text)));
  for (const font of fonts) updateFont(font.id);
  updateComparePreviews();
  clearTimeout(textTimer);
  textTimer = setTimeout(() => {
    for (const id of requested) {
      const visible = document.querySelector(`#font-grid [data-font="${id}"]`);
      if (visible) requestFont(fontById.get(id)!);
    }
  }, 400);
}

function updateFavoriteUI() {
  $('#favorites-count').textContent = String(favorites.size);
  $('#favorites-filter').setAttribute('aria-pressed', String(favoritesOnly));
  document.querySelectorAll<HTMLButtonElement>('[data-favorite]').forEach(button => {
    const id = button.dataset.favorite!;
    button.setAttribute('aria-pressed', String(favorites.has(id)));
    button.setAttribute('aria-label', `${favorites.has(id) ? '取消收藏' : '收藏'} ${fontById.get(id)!.name}`);
  });
}

document.addEventListener('click', event => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('button');
  if (!button) return;
  if (button.dataset.favorite) {
    const id = button.dataset.favorite;
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    persist();
    if (favoritesOnly) renderCatalog(); else updateFavoriteUI();
  } else if (button.dataset.load) {
    requestFont(fontById.get(button.dataset.load)!, true);
  } else if (button.dataset.pairRetry) {
    schedulePairingFontRequest(true);
  } else if (button.id === 'view-toggle') {
    viewMode = viewMode === 'cards' ? 'compare' : 'cards';
    renderCatalog();
  } else if (button.dataset.category) {
    category = button.dataset.category as Category;
    document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    renderCatalog();
  } else if (button.dataset.sample !== undefined) {
    setPreviewText(samples[Number(button.dataset.sample)].text);
  } else if (button.hasAttribute('data-close-dialog')) {
    button.closest('dialog')?.close();
  } else if (button.hasAttribute('data-open-about')) {
    $<HTMLDialogElement>('#about-dialog').showModal();
  }
});

window.addEventListener('resize', () => updateComparePreviews());
$('#compare-list').addEventListener('scroll', event => {
  const source = event.target;
  if (!(source instanceof HTMLElement) || !source.matches('[data-compare-preview]')) return;
  const expected = expectedCompareScroll.get(source);
  if (expected !== undefined) {
    expectedCompareScroll.delete(source);
    if (Math.abs(source.scrollLeft - expected) < 1) return;
  }
  if (compareScrollFrame) cancelAnimationFrame(compareScrollFrame);
  compareScrollFrame = requestAnimationFrame(() => {
    compareScrollFrame = 0;
    syncCompareScroll(source);
  });
}, { capture: true, passive: true });

document.addEventListener('change', event => {
  const select = event.target as HTMLSelectElement;
  if (!select.dataset.weight) return;
  const id = select.dataset.weight;
  weights.set(id, Number(select.value));
  updateFont(id);
  requestFont(fontById.get(id)!);
});

input.addEventListener('input', event => { if (!(event as InputEvent).isComposing) setPreviewText(input.value); });
input.addEventListener('compositionend', () => setPreviewText(input.value));
$('#clear-text').addEventListener('click', () => { setPreviewText(''); input.focus(); });
for (const field of [pairingHeadingText, pairingBodyText]) {
  field.addEventListener('input', () => {
    updatePairingPreview();
    schedulePairingFontRequest();
  });
}
for (const select of [pairingHeadingFont, pairingBodyFont]) {
  select.addEventListener('change', () => {
    pairingActivated = true;
    pairingObserver.disconnect();
    updatePairingPreview();
    updatePairingStatus();
    schedulePairingFontRequest();
  });
}
$('#search').addEventListener('input', event => { query = (event.target as HTMLInputElement).value; renderCatalog(); });
$('#favorites-filter').addEventListener('click', () => { favoritesOnly = !favoritesOnly; renderCatalog(); });
$('#reset-filters').addEventListener('click', () => {
  query = ''; category = '全部字型'; favoritesOnly = false;
  $<HTMLInputElement>('#search').value = '';
  document.querySelectorAll<HTMLButtonElement>('[data-category]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.category === category)));
  renderCatalog();
});
for (const [id, key] of [['font-size', 'size'], ['letter-spacing', 'spacing'], ['line-height', 'lineHeight']] as const) {
  $(`#${id}`).addEventListener('input', event => { settings[key] = Number((event.target as HTMLInputElement).value); syncTypography(); persist(); });
}
$('#reset-settings').addEventListener('click', () => { settings = { ...defaults }; syncTypography(); persist(); });
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
}));

syncTypography();
setPreviewText(previewText);
updatePairingPreview();
updatePairingStatus();
pairingObserver.observe($('#pairing'));
renderCatalog();
