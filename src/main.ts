import './style.css';
import { categories, fonts, fontById, fontFamily, type Category, type FontDefinition } from './fonts';
import { defaults, filterFonts, limitText, restore, samples, storageKey, type Settings } from './state';
import { icon, renderFontCards, weightOptions } from './view';
import { normalizeSearch, orderedFonts, type CatalogSort } from './catalog-order';
import { FontLoader } from './loader';
import {
  maxShareFileSize, maxShareUrlLength, pairingRoles, pairingSpec, pairingUrl, readPairingSpec, readPairingUrl,
  type Pairing, type PairingChoice, type PairingRole,
} from './pairing-share';

const $ = <T extends HTMLElement>(selector: string, root: ParentNode = document) => root.querySelector<T>(selector)!;

let stored: string | null = null;
try { stored = localStorage.getItem(storageKey); } catch { /* Storage is optional. */ }
const initial = restore(stored);
let settings: Settings = initial.settings;
const favorites = initial.favorites;
let previewText = samples[0].text;
let query = '';
let catalogSort: CatalogSort = 'auto';
let category: Category = '全部字型';
let favoritesOnly = false;
let viewMode: 'cards' | 'compare' = 'cards';
const weights = new Map(fonts.map(font => [font.id, font.defaultWeight]));
const localFullApproved = new Set<string>();
let noticeTimer: ReturnType<typeof setTimeout>;
let textTimer: ReturnType<typeof setTimeout>;
let pairingRequestTimer: ReturnType<typeof setTimeout>;
let compareScrollProgress = 0;
let compareScrollFrame = 0;
let pairingActivated = false;
const expectedCompareScroll = new WeakMap<HTMLElement, number>();

const loader = new FontLoader(updateFont);
const input = $<HTMLTextAreaElement>('#preview-input');
function pairingFields(role: PairingRole) {
  return {
    font: $<HTMLSelectElement>(`#pairing-${role}-font`),
    weight: $<HTMLSelectElement>(`#pairing-${role}-weight`),
    text: $<HTMLInputElement | HTMLTextAreaElement>(`#pairing-${role}-text`),
  };
}
const fields = { heading: pairingFields('heading'), body: pairingFields('body') };
const quickJump = $('#quick-jump');
const quickJumpMenu = $<HTMLDetailsElement>('details', quickJump);
input.value = previewText;

function updateQuickJump() {
  quickJump.hidden = window.scrollY < Math.min(window.innerHeight / 2, 320);
  if (quickJump.hidden) quickJumpMenu.open = false;
}

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
    const font = fontById.get((entry.target as HTMLElement).dataset.font!)!;
    requestFont(font, catalogSample());
  }
}, { rootMargin: '150px' });
const pairingObserver = new IntersectionObserver(entries => {
  if (!entries.some(entry => entry.isIntersecting)) return;
  pairingActivated = true;
  pairingObserver.disconnect();
  updatePairingStatus();
  schedulePairingFontRequest();
}, { rootMargin: '150px' });

function renderCatalog(preRendered = false) {
  observer.disconnect();
  const visible = orderedFonts(filterFonts(query, category, favoritesOnly, favorites), catalogSort, query);
  const searching = Boolean(normalizeSearch(query));
  $('#catalog-sort option[value="auto"]').textContent = searching ? '搜尋相關度' : '依分類';
  if (!preRendered) {
    $('#font-grid').innerHTML = renderFontCards(visible, import.meta.env.BASE_URL, {
      grouped: catalogSort === 'auto' && category === '全部字型' && !searching,
      weights,
      favorites,
    });
  }
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
    : `一段文字，${fonts.length} 種表情。`;
  updateComparePreviews(true);
  updateFavoriteUI();
}

function catalogSample() {
  return previewText.trim() ? previewText : '在上方輸入要預覽的文字';
}

function currentPairing(): Pairing {
  const choice = (role: PairingRole) => {
    const { font, weight, text } = fields[role];
    return { font: fontById.get(font.value)!, weight: Number(weight.value), text: text.value };
  };
  return { heading: choice('heading'), body: choice('body') };
}

function pairingSamples() {
  const samples = new Map<string, PairingChoice>();
  for (const choice of Object.values(currentPairing())) {
    if (!choice.text.trim()) continue;
    const key = approvalKey(choice.font, choice.weight);
    const previous = samples.get(key);
    samples.set(key, { ...choice, text: previous ? previous.text + '\n' + choice.text : choice.text });
  }
  return samples;
}

function prefersSubset(font: FontDefinition, text: string, weight = weights.get(font.id)!) {
  const files = currentLocalFiles(font, weight);
  if (!files) return true;
  const normalized = text.replace(/\s+/gu, ' ').trim();
  return Array.from(normalized).every(character => files.preview.characters.includes(character));
}

function currentLocalFiles(font: FontDefinition, weight = weights.get(font.id)!) {
  return font.loader.kind === 'local' ? font.loader.files[weight] : undefined;
}

function approvalKey(font: FontDefinition, weight: number) {
  return `${font.id}:${weight}`;
}

function fontStatus(font: FontDefinition, text: string, weight = weights.get(font.id)!) {
  return loader.status(font, text, weight, prefersSubset(font, text, weight));
}

function requestFont(font: FontDefinition, text: string, retry = false, weight = weights.get(font.id)!) {
  if (requiresFullFont(font, text, weight)) return;
  void loader.load(font, text, weight, retry, prefersSubset(font, text, weight));
}

function requestFontExplicitly(font: FontDefinition, text: string, weight = weights.get(font.id)!) {
  if (requiresFullFont(font, text, weight)) localFullApproved.add(approvalKey(font, weight));
  requestFont(font, text, true, weight);
}

function setPreviewFont(element: HTMLElement, font: FontDefinition, weight = weights.get(font.id)!) {
  element.style.fontFamily = `"${fontFamily(font)}", serif`;
  element.style.fontWeight = String(weight);
  element.style.fontStretch = font.loader.kind === 'stylesheet' ? font.loader.stretch ?? 'normal' : 'normal';
}

function setPairingWeightOptions(role: PairingRole, font: FontDefinition, weight = font.defaultWeight) {
  const control = fields[role].weight;
  control.innerHTML = weightOptions(font, weight);
  control.closest('label')!.hidden = font.weights.length < 2;
}

function updatePairingPreview() {
  const pairing = currentPairing();
  for (const role of pairingRoles) {
    const { font, weight, text } = pairing[role];
    const element = $(`#pairing-preview-${role}`);
    element.textContent = text;
    setPreviewFont(element, font, weight);
  }
}

function updatePairing() {
  updatePairingPreview();
  updatePairingStatus();
  schedulePairingFontRequest();
}

function applyPairing(pairing: Pairing) {
  for (const role of pairingRoles) {
    const { font, weight, text } = pairing[role];
    fields[role].font.value = font.id;
    setPairingWeightOptions(role, font, weight);
    fields[role].text.value = text;
  }
  updatePairing();
}

function updatePairingStatus() {
  const status = $<HTMLParagraphElement>('#pairing-status');
  if (!pairingActivated) {
    status.textContent = '預覽會隨文字即時更新；字型在選用時按需載入。';
    return;
  }
  const selected = Array.from(pairingSamples().values(), choice => ({ ...choice, status: fontStatus(choice.font, choice.text, choice.weight) }));
  const errors = selected.filter(item => item.status === 'error');
  if (errors.length) {
    status.replaceChildren(document.createTextNode(`${errors.map(({ font }) => font.name).join('、')} 載入失敗。`));
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'pairing-retry';
    retry.dataset.pairRetry = 'true';
    retry.textContent = '重新載入';
    status.append(' ', retry);
    return;
  }
  const loading = selected.find(item => item.status === 'loading');
  if (loading) {
    const { font, text, weight } = loading;
    const files = currentLocalFiles(font, weight);
    const size = files
      ? `（${prefersSubset(font, text, weight) ? `${(files.preview.bytes / 1000).toFixed(0)} KB` : `${(files.bytes / 1000000).toFixed(1)} MB`}）`
      : '';
    status.textContent = `正在載入 ${font.name}${size}…`;
    return;
  }
  const needsFull = selected.filter(({ font, text, weight }) => requiresFullFont(font, text, weight));
  if (needsFull.length) {
    status.replaceChildren(document.createTextNode('這段搭配文字需要完整字型：'));
    for (const { font, weight } of needsFull) {
      const files = currentLocalFiles(font, weight)!;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'pairing-load-button';
      button.dataset.pairLoad = approvalKey(font, weight);
      button.textContent = `載入${font.name}完整字型（${weight}）・${(files.bytes / 1000000).toFixed(1)} MB`;
      status.append(' ', button);
    }
    return;
  }
  const idle = selected.find(item => item.status === 'idle');
  if (idle) {
    status.textContent = `準備載入 ${idle.font.name}…`;
    return;
  }
  status.textContent = `標題：${fontById.get(fields.heading.font.value)!.name} · 內文：${fontById.get(fields.body.font.value)!.name}`;
}

function requestPairingFonts(retry = false) {
  if (!pairingActivated) return;
  for (const { font, text, weight } of pairingSamples().values()) requestFont(font, text, retry, weight);
}

function schedulePairingFontRequest(retry = false) {
  clearTimeout(pairingRequestTimer);
  pairingRequestTimer = setTimeout(() => requestPairingFonts(retry), retry ? 0 : 400);
}

function requiresFullFont(font: FontDefinition, text: string, weight = weights.get(font.id)!) {
  return font.loader.kind === 'local'
    && !prefersSubset(font, text, weight)
    && !loader.isLocalFull(font.id, weight)
    && !localFullApproved.has(approvalKey(font, weight));
}

function fontRowNearViewport(id: string) {
  const catalog = $(viewMode === 'cards' ? '#font-grid' : '#compare-list');
  if (catalog.hidden) return false;
  const row = catalog.querySelector<HTMLElement>(`[data-font="${id}"]`);
  if (!row) return false;
  const bounds = row.getBoundingClientRect();
  return bounds.bottom >= -150 && bounds.top <= window.innerHeight + 150;
}

function updateFont(id: string) {
  const font = fontById.get(id)!;
  const text = catalogSample();
  const status = fontStatus(font, text);
  const hasLoaded = loader.hasLoaded(id);
  const needsFull = requiresFullFont(font, text);
  const files = currentLocalFiles(font);
  document.querySelectorAll<HTMLElement>(`[data-font="${id}"]`).forEach(card => {
    const comparePreview = card.querySelector<HTMLElement>('[data-compare-preview]');
    if (comparePreview) {
      setPreviewFont(comparePreview, font);
      comparePreview.title = previewText.replace(/\s+/gu, ' ').trim();
      card.dataset.status = status;
      const load = card.querySelector<HTMLElement>('[data-compare-load]')!;
      if (needsFull) {
        load.innerHTML = `<button class="compare-load-button" type="button" data-load="${id}" aria-label="載入${font.name}完整字型" title="目前文字需要完整字型">完整字型</button>`;
      } else if (status === 'idle' && font.loader.kind === 'local') {
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
    if (preview.textContent !== text) preview.textContent = text;
    setPreviewFont(preview, font);
    preview.hidden = status !== 'ready' && !hasLoaded;
    placeholder.hidden = status === 'ready' || hasLoaded;
    card.dataset.status = status;
    if (files && (needsFull || (status === 'idle' && !hasLoaded && prefersSubset(font, text)))) {
      const useSubset = !needsFull;
      const size = useSubset ? `${(files.preview.bytes / 1000).toFixed(0)} KB` : `${(files.bytes / 1000000).toFixed(1)} MB`;
      if (hasLoaded) {
        placeholder.replaceChildren();
        statusLine.innerHTML = `這段文字含有子集未收錄的字元。<button type="button" class="load-button" data-load="${id}">${icon('download')} 載入完整字型・${size}</button>`;
      } else {
        placeholder.innerHTML = `<span class="local-font-symbol" aria-hidden="true">Aa</span><button type="button" class="load-button" data-load="${id}">${icon('download')} ${useSubset ? '載入預覽' : '載入完整字型'}</button><span class="load-size">${useSubset ? '精簡字型' : '完整字型'}・${size}</span>`;
        statusLine.textContent = useSubset ? '進入畫面時自動載入精簡字型；其他字元可按需載入完整字型。' : '這段文字需要完整字型；點擊後才會下載。';
      }
    } else if (status === 'error' && hasLoaded) {
      placeholder.replaceChildren();
      statusLine.innerHTML = `部分字元暫時無法載入，仍可使用其他預覽。<button type="button" class="load-button" data-load="${id}">${icon('reset')} 重試</button>`;
    } else if (status === 'error') {
      placeholder.innerHTML = `<span class="load-failed">字型暫時無法載入</span><button type="button" class="load-button" data-load="${id}">${icon('reset')} 重新載入</button>`;
      statusLine.textContent = '請確認網路連線後重試；仍可前往作者頁面下載。';
    } else if (status === 'loading' && hasLoaded) {
      placeholder.replaceChildren();
      statusLine.textContent = '正在更新預覽字型…';
    } else if (status === 'idle' && hasLoaded) {
      placeholder.replaceChildren();
      statusLine.textContent = '等待更新字型';
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
  if (fields.heading.font.value === id || fields.body.font.value === id) {
    updatePairingPreview();
    updatePairingStatus();
  }
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
  const sample = catalogSample().replace(/\s+/gu, ' ').trim();
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
    for (const font of fonts) {
      if (fontRowNearViewport(font.id)) requestFont(font, catalogSample());
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
    requestFontExplicitly(fontById.get(button.dataset.load)!, catalogSample());
  } else if (button.dataset.pairLoad) {
    const sample = pairingSamples().get(button.dataset.pairLoad);
    if (sample) requestFontExplicitly(sample.font, sample.text, sample.weight);
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
window.addEventListener('scroll', updateQuickJump, { passive: true });
window.addEventListener('resize', updateQuickJump);
window.addEventListener('pageshow', updateQuickJump);
quickJump.addEventListener('keydown', event => {
  if (event.key !== 'Escape' || !quickJumpMenu.open) return;
  $('summary', quickJumpMenu).focus();
  quickJumpMenu.open = false;
});
quickJump.addEventListener('click', event => {
  const target = event.target;
  if (!(target instanceof Element) || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const link = target.closest<HTMLAnchorElement>('a[href^="#"]');
  if (!link) return;
  const destination = document.getElementById(link.hash.slice(1));
  if (!destination) return;

  event.preventDefault();
  if (window.location.hash !== link.hash) history.pushState(null, '', link.hash);
  destination.focus({ preventScroll: true });
  // Scrolling through the catalog would load intervening cards and move the destination.
  destination.scrollIntoView({ block: 'start', behavior: 'instant' });
  quickJumpMenu.open = false;
});
document.addEventListener('click', event => {
  if (event.target instanceof Node && !quickJump.contains(event.target)) quickJumpMenu.open = false;
});
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
  const font = fontById.get(id)!;
  requestFont(font, catalogSample());
});

input.addEventListener('input', event => { if (!(event as InputEvent).isComposing) setPreviewText(input.value); });
input.addEventListener('compositionend', () => setPreviewText(input.value));
$('#clear-text').addEventListener('click', () => { setPreviewText(''); input.focus(); });
for (const role of pairingRoles) {
  const { font, text, weight } = fields[role];
  setPairingWeightOptions(role, fontById.get(font.value)!);
  text.addEventListener('input', event => { if (!(event as InputEvent).isComposing) updatePairing(); });
  text.addEventListener('compositionend', updatePairing);
  font.addEventListener('change', () => {
    pairingActivated = true;
    pairingObserver.disconnect();
    setPairingWeightOptions(role, fontById.get(font.value)!);
    updatePairing();
  });
  weight.addEventListener('change', updatePairing);
}
const shareDialog = $<HTMLDialogElement>('#pairing-share-dialog');
const shareText = $<HTMLInputElement>('#pairing-share-text');
const shareFeedback = $('#pairing-share-feedback');
const shareManual = $('#pairing-share-manual');
const shareManualText = $<HTMLTextAreaElement>('textarea', shareManual);
const importFile = $<HTMLInputElement>('#pairing-import-file');

function updateShareOptions() {
  const tooLong = pairingUrl(currentPairing(), shareText.checked).length > maxShareUrlLength;
  $<HTMLButtonElement>('#pairing-copy-url').disabled = tooLong;
  $('#pairing-share-limit').hidden = !tooLong;
  shareManual.hidden = true;
  shareManualText.value = '';
  shareFeedback.textContent = '';
}

$('#pairing-share-open').addEventListener('click', () => {
  const summary = $('#pairing-share-summary');
  summary.replaceChildren();
  const pairing = currentPairing();
  for (const role of pairingRoles) {
    const { font, weight } = pairing[role];
    const row = document.createElement('div');
    const label = document.createElement('dt');
    label.textContent = role === 'heading' ? '標題' : '內文';
    const details = document.createElement('dd');
    details.textContent = `${font.name} · ${weight}`;
    const links = document.createElement('span');
    for (const [name, url] of [['官方下載', font.downloadUrl], ['授權', import.meta.env.BASE_URL + font.licensePath]]) {
      const link = document.createElement('a');
      link.textContent = name;
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      links.append(link);
    }
    details.append(links);
    row.append(label, details);
    summary.append(row);
  }
  shareText.checked = false;
  updateShareOptions();
  shareDialog.showModal();
});

shareText.addEventListener('change', updateShareOptions);

async function copyShare(value: string, message: string) {
  updateShareOptions();
  try {
    await navigator.clipboard.writeText(value);
    shareFeedback.textContent = message;
  } catch {
    if (!shareDialog.open) return;
    shareManual.hidden = false;
    shareManualText.value = value;
    shareManualText.focus();
    shareManualText.select();
  }
}

$('#pairing-copy-url').addEventListener('click', () => {
  void copyShare(pairingUrl(currentPairing(), shareText.checked), '已複製預覽連結。');
});
$('#pairing-copy-spec').addEventListener('click', () => {
  void copyShare(pairingSpec(currentPairing(), shareText.checked), '已複製 JSON 套用規格。');
});
$('#pairing-download-spec').addEventListener('click', () => {
  const blob = new Blob([pairingSpec(currentPairing(), shareText.checked)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'font-select-pairing.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});
$('#pairing-import-spec').addEventListener('click', () => importFile.click());
importFile.addEventListener('change', async () => {
  const file = importFile.files?.[0];
  importFile.value = '';
  if (!file) return;
  try {
    if (file.size > maxShareFileSize) throw new Error();
    const pairing = readPairingSpec(JSON.parse(await file.text()));
    applyPairing(pairing);
    if (location.hash.startsWith('#pairing?')) history.replaceState(null, '', '#pairing');
    shareDialog.close();
    notify('已匯入文字搭配。');
  } catch {
    shareFeedback.textContent = '無法匯入這份搭配。請確認 JSON 格式、版本與字型設定。';
  }
});

function openSharedPairing() {
  try {
    const pairing = readPairingUrl(location.hash);
    if (!pairing) return;
    if (shareDialog.open) shareDialog.close();
    applyPairing(pairing);
  } catch {
    notify('無法讀取分享連結。請確認網址是否完整。');
  }
  const section = $('#pairing');
  section.focus({ preventScroll: true });
  section.scrollIntoView({ block: 'start', behavior: 'instant' });
}
window.addEventListener('hashchange', openSharedPairing);

$('#search').addEventListener('input', event => { query = (event.target as HTMLInputElement).value; renderCatalog(); });
const sortControl = $<HTMLSelectElement>('#catalog-sort');
sortControl.value = catalogSort;
sortControl.addEventListener('change', () => {
  catalogSort = sortControl.value as CatalogSort;
  renderCatalog();
});
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
updateQuickJump();
updatePairingPreview();
updatePairingStatus();
pairingObserver.observe($('#pairing'));
renderCatalog(true);
openSharedPairing();
const siteHeadingText = Array.from(document.querySelectorAll<HTMLElement>('h1, h2, h3:not(#pairing-preview-heading), .brand-name'))
  .map(heading => heading.textContent ?? '')
  .join('\n');
requestFont(fontById.get('taipei-sans-tc')!, siteHeadingText);
