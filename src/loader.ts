import { assetUrl, fontFamily, type FontDefinition } from './fonts';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
type LocalMode = 'preview' | 'full';
type GoogleMode = 'subset' | 'full';

interface Entry {
  charactersByWeight: Map<number, Set<string>>;
  pending?: Promise<void>;
  failedByWeight: Map<number, string>;
  stylesheets?: Set<string>;
  google?: { mode: GoogleMode; characters: Set<string>; links: HTMLLinkElement[] };
  local?: Map<number, { mode: LocalMode; face: FontFace }>;
}

function fontSample(text: string) {
  return text.replace(/[\uD800-\uDFFF]/gu, '\uFFFD').replace(/\s+/gu, ' ').trim();
}

function uniqueCharacters(text: string) {
  return [...new Set(Array.from(text))].sort((left, right) => left.codePointAt(0)! - right.codePointAt(0)!);
}

function stylesheetUrl(font: FontDefinition, weight: number): string {
  if (font.loader.kind !== 'stylesheet') throw new Error('字型樣式表設定錯誤');
  const { stylesheet } = font.loader;
  const url = typeof stylesheet === 'string' ? stylesheet : stylesheet[weight];
  if (!url) throw new Error('找不到指定字重的字型樣式');
  return url;
}

function covers(entry: Entry, font: FontDefinition, characters: string[], weight: number, preferSubset: boolean) {
  if (font.loader.kind === 'local') {
    const local = entry.local?.get(weight);
    return local?.mode === 'full' || (preferSubset && local?.mode === 'preview');
  }
  const confirmed = entry.charactersByWeight.get(weight);
  return confirmed && characters.every(character => confirmed.has(character));
}

function requestKey(characters: string[], weight: number, preferSubset: boolean) {
  return [weight, preferSubset, characters.join('')].join(':');
}

async function loadStylesheet(href: string | undefined, descriptor: string, sample: string, signal: AbortSignal) {
  const link = href ? document.createElement('link') : undefined;
  let rejectStylesheet: ((reason: unknown) => void) | undefined;
  function cancel() {
    link?.remove();
    rejectStylesheet?.(signal.reason);
  }

  signal.addEventListener('abort', cancel, { once: true });
  try {
    if (link && href) {
      link.rel = 'stylesheet';
      link.href = href;
      await new Promise<void>((resolve, reject) => {
        rejectStylesheet = reject;
        link.onload = () => resolve();
        link.onerror = () => reject(new Error('無法取得字型樣式'));
        document.head.append(link);
      });
    }
    signal.throwIfAborted();
    const loaded = await document.fonts.load(descriptor, sample);
    signal.throwIfAborted();
    if (loaded.length === 0) throw new Error('未取得字型');
    return link;
  } catch (error) {
    link?.remove();
    throw error;
  } finally {
    signal.removeEventListener('abort', cancel);
    if (link) {
      link.onload = null;
      link.onerror = null;
    }
  }
}

export class FontLoader {
  private entries = new Map<string, Entry>();
  constructor(private onChange: (id: string) => void) {}

  status(font: FontDefinition, text: string, weight: number, preferSubset: boolean): LoadStatus {
    const entry = this.entries.get(font.id);
    if (!entry) return 'idle';
    const characters = uniqueCharacters(fontSample(text));
    if (covers(entry, font, characters, weight, preferSubset)) return 'ready';
    if (entry.pending) return 'loading';
    return entry.failedByWeight.get(weight) === requestKey(characters, weight, preferSubset) ? 'error' : 'idle';
  }

  hasLoaded(id: string): boolean {
    const entry = this.entries.get(id);
    return Boolean(entry?.local?.size || entry?.charactersByWeight.size);
  }

  isLocalFull(id: string, weight: number): boolean { return this.entries.get(id)?.local?.get(weight)?.mode === 'full'; }

  private async loadFont(font: FontDefinition, entry: Entry, sample: string, characters: string[], weight: number, preferSubset: boolean, signal: AbortSignal) {
    const source = font.loader;
    if (source.kind === 'local') {
      const mode: LocalMode = preferSubset ? 'preview' : 'full';
      const files = source.files[weight];
      const path = mode === 'preview' ? files.preview.path : files.path;
      const face = new FontFace(fontFamily(font), 'url("' + assetUrl(path) + '")', {
        weight: String(weight), style: 'normal', display: 'swap',
      });
      await face.load();
      signal.throwIfAborted();
      document.fonts.add(face);
      entry.local ??= new Map();
      const previous = entry.local.get(weight);
      if (previous) document.fonts.delete(previous.face);
      entry.local.set(weight, { mode, face });
      return;
    }

    const stretch = source.kind === 'stylesheet' && source.stretch ? source.stretch + ' ' : '';
    const descriptor = stretch + weight + ' 36px "' + fontFamily(font) + '"';
    if (source.kind === 'stylesheet') {
      const href = stylesheetUrl(font, weight);
      await loadStylesheet(entry.stylesheets?.has(href) ? undefined : href, descriptor, sample, signal);
      entry.stylesheets ??= new Set();
      entry.stylesheets.add(href);
    } else {
      const current = entry.google;
      const encodedText = encodeURIComponent(characters.join(''));
      const mode: GoogleMode = preferSubset && encodedText.length <= 2000 ? 'subset' : 'full';
      const missing = characters.filter(character => !current?.characters.has(character));
      let href: string | undefined;
      if (current?.mode !== 'full' && (mode === 'full' || missing.length)) {
        const family = encodeURIComponent(source.family).replace(/%20/g, '+');
        const textParameter = mode === 'subset' ? '&text=' + encodeURIComponent(missing.join('')) : '';
        href = 'https://fonts.googleapis.com/css2?family=' + family + source.axis + '&display=swap' + textParameter;
      }

      const link = await loadStylesheet(href, descriptor, sample, signal);
      if (link && mode === 'full') {
        for (const previous of current?.links ?? []) previous.remove();
        entry.google = { mode, characters: new Set(), links: [link] };
        entry.charactersByWeight.clear();
      } else if (link) {
        entry.google = { mode, characters: new Set([...(current?.characters ?? []), ...missing]), links: [...(current?.links ?? []), link] };
      }
    }

    const confirmed = entry.charactersByWeight.get(weight) ?? new Set<string>();
    for (const character of characters) confirmed.add(character);
    entry.charactersByWeight.set(weight, confirmed);
  }

  async load(font: FontDefinition, text: string, weight: number, retry: boolean, preferSubset: boolean): Promise<void> {
    const sample = fontSample(text);
    if (!sample) return;
    let entry = this.entries.get(font.id);
    if (!entry) {
      entry = { charactersByWeight: new Map(), failedByWeight: new Map() };
      this.entries.set(font.id, entry);
    }
    while (entry.pending) await entry.pending;

    const characters = uniqueCharacters(sample);
    const key = requestKey(characters, weight, preferSubset);
    if (covers(entry, font, characters, weight, preferSubset) || (!retry && entry.failedByWeight.get(weight) === key)) return;

    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const timeout = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const error = new Error('載入逾時');
        controller.abort(error);
        reject(error);
      }, 25000);
    });
    entry.pending = Promise.race([this.loadFont(font, entry, sample, characters, weight, preferSubset, controller.signal), timeout])
      .then(() => {
        entry.failedByWeight.delete(weight);
      })
      .catch(() => { entry.failedByWeight.set(weight, key); })
      .finally(() => {
        clearTimeout(timer);
        entry.pending = undefined;
        this.onChange(font.id);
      });
    this.onChange(font.id);
    await entry.pending;
  }
}
