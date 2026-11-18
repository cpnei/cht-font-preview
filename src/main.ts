import './style.css';
import { assetUrl, categories, fonts, fontById, fontFamily, type Category, type FontDefinition } from './fonts';
import { defaults, filterFonts, limitText, restore, samples, storageKey, type Settings } from './state';
import { FontLoader } from './loader';

const icons = {
  arrow: '<path d="M7 17 17 7M7 7h10v10"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
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
const weights = new Map(fonts.map(font => [font.id, font.defaultWeight]));
const requested = new Set<string>();
let noticeTimer: ReturnType<typeof setTimeout>;
let textTimer: ReturnType<typeof setTimeout>;

$('#app').innerHTML = `
  <a class="skip-link" href="#preview-input">跳至預覽文字</a>
  <header class="site-header wrap">
    <a class="brand" href="${import.meta.env.BASE_URL}" aria-label="字選首頁"><span class="brand-mark">字</span><span class="brand-name">字選<span>FONT SELECT</span></span></a>
    <nav aria-label="主選單"><a class="nav-active" href="#catalog">探索字型</a><button type="button" data-open-about>關於字選</button><a class="github-link" href="https://github.com/cpnei/cht-font-preview" target="_blank" rel="noopener noreferrer">GitHub ${icon('arrow')}</a></nav>
  </header>
  <main class="wrap">
    <section class="hero" aria-labelledby="hero-title">
      <div><p class="eyebrow"><span></span> 字裡行間，自有風景</p><h1 id="hero-title">好字，讓想法<span>有了樣子。</span><i aria-hidden="true">*</i></h1></div>
      <div class="hero-aside"><p>輸入一段文字，遇見適合它的字型。<br>從日常書寫到靈感提案，<br>在這裡，找到你的下一個好字。</p><div class="hero-meta"><span><b>08</b> 款精選字型</span><span class="meta-dot"></span><span>開源・免費商用</span></div></div>
    </section>
    <section class="editor" aria-label="預覽設定">
      <div class="editor-main"><div class="editor-heading"><label for="preview-input">試著寫點什麼</label><span id="char-count">0 / 500</span></div>
        <textarea id="preview-input" rows="2" spellcheck="false" aria-describedby="input-help char-count" placeholder="在這裡輸入，看看文字的不同表情…"></textarea>
        <div class="sample-row"><span id="input-help">或試試</span>${samples.map((sample, i) => `<button type="button" class="sample-button" data-sample="${i}" aria-pressed="${i === 0}">${sample.name}</button>`).join('')}<button id="clear-text" type="button" class="clear-text">清空</button></div>
      </div>
      <div class="editor-controls"><div class="controls-heading"><span>排版設定</span><button id="reset-settings" type="button" aria-label="重設排版設定" title="重設排版設定">${icon('reset')}</button></div>
        <label class="range-control" for="font-size"><span>字級 <output id="font-size-value"></output></span><input id="font-size" type="range" min="16" max="72" step="1"></label>
        <div class="small-controls"><label class="range-control" for="letter-spacing"><span>字距 <output id="letter-spacing-value"></output></span><input id="letter-spacing" type="range" min="-1" max="8" step="0.5"></label><label class="range-control" for="line-height"><span>行高 <output id="line-height-value"></output></span><input id="line-height" type="range" min="1.2" max="2.4" step="0.1"></label></div>
      </div>
    </section>
    <section class="catalog" id="catalog" aria-labelledby="catalog-heading">
      <div class="catalog-top"><h2 id="catalog-heading">找一款，剛剛好的字。<span id="result-count">08 TYPEFACES</span></h2><div class="search-box">${icon('search')}<input id="search" type="search" aria-label="搜尋字型" placeholder="搜尋字型、設計師…"></div></div>
      <div class="filter-row"><div class="category-list" role="group" aria-label="字型分類">${categories.map((item, i) => `<button class="category-button" type="button" data-category="${item}" aria-pressed="${i === 0}">${item}</button>`).join('')}</div><button class="favorites-filter" id="favorites-filter" type="button" aria-pressed="false">${icon('heart')}<span>我的收藏</span><span id="favorites-count">${favorites.size}</span></button></div>
      <p class="catalog-hint"><span>一段文字，八種表情。</span><span>${icon('heart')} 收藏喜歡的字型，隨時回來看</span></p>
      <div class="font-grid" id="font-grid"></div>
      <div class="empty-state" id="empty-state" hidden><span aria-hidden="true">字</span><h3>還沒遇見這款字</h3><p>換個關鍵字，或放寬篩選條件試試。</p><button type="button" id="reset-filters" class="button-primary">顯示所有字型</button></div>
      <p class="coverage-note">每款字型收錄的字元不同，罕用字、符號或 Emoji 可能由系統字型顯示。</p>
    </section>
    <section class="closing-note"><span aria-hidden="true">字</span><div><h2>好字，值得被看見。</h2><p>感謝每一位字型創作者，讓文字有更多可能。<br>喜歡一款字，也別忘了到作者的頁面走走。</p></div><button type="button" data-open-about>關於字型與授權 ${icon('arrow')}</button></section>
  </main>
  <footer class="site-footer wrap"><span>字選 FONT SELECT <span class="footer-dash">—</span> 給每一個認真選字的人。</span><span>Made for Traditional Chinese. <a href="https://github.com/cpnei/cht-font-preview" target="_blank" rel="noopener noreferrer">開源專案 ${icon('arrow')}</a></span></footer>
  <dialog id="about-dialog" class="about-dialog" aria-labelledby="about-title"><div class="dialog-header"><div><p class="eyebrow">ABOUT FONT SELECT</p><h2 id="about-title">讓選字，簡單一點。</h2></div><button type="button" class="icon-button" data-close-dialog aria-label="關閉關於字選">${icon('close')}</button></div><p>字選是一個免費、開源的繁體中文字型預覽工具。我們精選八款適合繁體中文使用的字型，讓你在下載之前，先看看文字的表情。</p><h3>免費商用，尊重原創</h3><p>收錄字型皆採 SIL Open Font License 1.1。可免費用於個人與商業作品；字型檔案的散布、修改與保留名稱仍須遵守各自授權。每張卡片附有作者來源與完整授權，本站程式碼則採 MIT 授權。</p><h3>關於你的資料</h3><p>收藏與排版設定只保存在這個瀏覽器，預覽文字不會存檔，也不會送往伺服器。六款字型由 Google Fonts 載入，瀏覽器會連線至 Google 取得樣式及字型檔；另兩款由本站提供。本站沒有帳號、廣告或追蹤分析。</p><h3>每一款字，都有自己的樣子</h3><p>字型的收字與地區字形習慣可能不同。罕用字、Emoji 或不支援的符號可能使用系統替代字型；本站不提供逐字缺字偵測。</p><a class="about-source" href="https://github.com/cpnei/cht-font-preview" target="_blank" rel="noopener noreferrer">查看原始碼與字型來源 ${icon('arrow')}</a></dialog>
  <div id="notice" class="notice" role="status" aria-live="polite"></div>
`;

const loader = new FontLoader(updateFont);
const input = $<HTMLTextAreaElement>('#preview-input');
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

const observer = new IntersectionObserver(entries => {
  for (const entry of entries) {
    if (!entry.isIntersecting) continue;
    observer.unobserve(entry.target);
    const font = fontById.get((entry.target as HTMLElement).dataset.font!)!;
    if (font.loader.kind === 'google') requestFont(font);
  }
}, { rootMargin: '150px' });

function renderCatalog() {
  observer.disconnect();
  const visible = filterFonts(query, category, favoritesOnly, favorites);
  $('#font-grid').innerHTML = visible.map(font => cardHTML(font)).join('');
  $('#result-count').textContent = `${String(visible.length).padStart(2, '0')} TYPEFACES`;
  $('#empty-state').hidden = visible.length > 0;
  for (const font of visible) updateFont(font.id);
  document.querySelectorAll('#font-grid .font-card').forEach(card => observer.observe(card));
  updateFavoriteUI();
}

function requestFont(font: FontDefinition, retry = false) {
  requested.add(font.id);
  void loader.load(font, previewText, weights.get(font.id)!, retry);
}

function updateFont(id: string) {
  const font = fontById.get(id)!;
  const status = loader.status(id);
  document.querySelectorAll<HTMLElement>(`[data-font="${id}"]`).forEach(card => {
    const preview = $<HTMLParagraphElement>('[data-preview]', card);
    const placeholder = $('[data-placeholder]', card);
    const statusLine = $('[data-status]', card);
    preview.textContent = previewText || '在上方寫點什麼，讓字型說話。';
    preview.style.fontFamily = `"${fontFamily(font)}", serif`;
    preview.style.fontWeight = String(weights.get(id));
    preview.hidden = status !== 'ready';
    placeholder.hidden = status === 'ready';
    card.dataset.status = status;
    if (status === 'idle' && font.loader.kind === 'local') {
      placeholder.innerHTML = `<span class="local-font-symbol" aria-hidden="true">Aa</span><button type="button" class="load-button" data-load="${id}">${icon('download')} 載入預覽</button><span class="load-size">原版字型・${(font.loader.bytes / 1000000).toFixed(1)} MB</span>`;
      statusLine.textContent = '點擊後下載字型，體驗完整筆觸。';
    } else if (status === 'error') {
      placeholder.innerHTML = `<span class="load-failed">字型暫時無法載入</span><button type="button" class="load-button" data-load="${id}">${icon('reset')} 重新載入</button>`;
      statusLine.textContent = '請確認網路連線後重試；仍可前往作者頁面下載。';
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
}

function setPreviewText(value: string) {
  previewText = limitText(value);
  if (input.value !== previewText) input.value = previewText;
  $('#char-count').textContent = `${Array.from(previewText).length} / 500`;
  document.querySelectorAll<HTMLButtonElement>('[data-sample]').forEach(button => button.setAttribute('aria-pressed', String(previewText === samples[Number(button.dataset.sample)].text)));
  for (const font of fonts) updateFont(font.id);
  clearTimeout(textTimer);
  textTimer = setTimeout(() => {
    for (const id of requested) {
      const visible = document.querySelector(`#font-grid [data-font="${id}"]`);
      if (visible) requestFont(fontById.get(id)!);
    }
  }, 250);
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
renderCatalog();
