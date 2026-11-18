import { assetUrl, fontFamily, type FontDefinition } from './fonts';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
type LocalMode = 'preview' | 'full';
type GoogleMode = 'subset' | 'full';
interface Entry {
  status: LoadStatus;
  loaded?: boolean;
  promise?: Promise<void>;
  links?: HTMLLinkElement[];
  face?: FontFace;
  googleText?: string;
  googleMode?: GoogleMode;
  localMode?: LocalMode;
}

function compactText(text: string) {
  return text.replace(/\s+/gu, ' ').trim();
}

function uniqueCharacters(text: string) {
  return [...new Set(Array.from(text))]
    .sort((left, right) => left.codePointAt(0)! - right.codePointAt(0)!)
    .join('');
}

function containsCharacters(available: string, requested: string) {
  const set = new Set(Array.from(available));
  return Array.from(requested).every(character => set.has(character));
}

function googleModeFor(sample: string, preferSubset: boolean): GoogleMode {
  return preferSubset && encodeURIComponent(uniqueCharacters(sample)).length <= 2000 ? 'subset' : 'full';
}

export class FontLoader {
  private entries = new Map<string, Entry>();
  constructor(private onChange: (id: string) => void) {}

  status(id: string): LoadStatus { return this.entries.get(id)?.status ?? 'idle'; }
  hasLoaded(id: string): boolean { return this.entries.get(id)?.loaded ?? false; }
  isLocalFull(id: string): boolean { return this.entries.get(id)?.localMode === 'full'; }

  private async initialize(font: FontDefinition, entry: Entry, sample: string, preferSubset: boolean) {
    if (font.loader.kind === 'local') {
      const mode: LocalMode = preferSubset && font.loader.preview ? 'preview' : 'full';
      if (entry.localMode === 'full' || entry.localMode === mode) return;
      const path = mode === 'preview' ? font.loader.preview.path : font.loader.path;
      const face = new FontFace(fontFamily(font), `url("${assetUrl(path)}")`, {
        weight: String(font.defaultWeight), style: 'normal', display: 'swap',
      });
      await face.load();
      document.fonts.add(face);
      if (entry.face) document.fonts.delete(entry.face);
      entry.face = face;
      entry.localMode = mode;
      return;
    }

    const text = uniqueCharacters(sample);
    const mode = googleModeFor(sample, preferSubset);
    if (entry.googleMode === 'full') return;
    const previousText = entry.googleMode === 'subset' ? entry.googleText ?? '' : '';
    const textToRequest = mode === 'subset'
      ? uniqueCharacters(Array.from(text).filter(character => !previousText.includes(character)).join(''))
      : '';
    if (mode === 'subset' && !textToRequest) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    const family = encodeURIComponent(font.loader.family).replace(/%20/g, '+');
    const textParameter = mode === 'subset' ? `&text=${encodeURIComponent(textToRequest)}` : '';
    link.href = `https://fonts.googleapis.com/css2?family=${family}${font.loader.axis}&display=swap${textParameter}`;
    await new Promise<void>((resolve, reject) => {
      link.onload = () => resolve();
      link.onerror = () => reject(new Error('無法取得字型樣式'));
      document.head.append(link);
    }).catch(error => {
      link.remove();
      throw error;
    });
    if (mode === 'subset') {
      entry.links = [...(entry.links ?? []), link];
      entry.googleMode = 'subset';
      entry.googleText = uniqueCharacters(previousText + textToRequest);
    } else {
      for (const previous of entry.links ?? []) previous.remove();
      entry.links = [link];
      entry.googleMode = 'full';
      entry.googleText = undefined;
    }
  }

  async load(font: FontDefinition, text: string, weight: number, retry = false, preferSubset = false): Promise<void> {
    let entry = this.entries.get(font.id);
    if (!entry) { entry = { status: 'idle' }; this.entries.set(font.id, entry); }
    const displayText = compactText(text);
    const sample = `${displayText}\nAa臺灣`;
    const requestedCharacters = uniqueCharacters(sample);
    const descriptor = `${weight} 36px "${fontFamily(font)}"`;

    while (entry.promise) await entry.promise;
    if (entry.status === 'error' && !retry) return;
    const modeIsCovered = font.loader.kind === 'google'
      ? entry.googleMode === 'full' || (googleModeFor(sample, preferSubset) === 'subset'
        && entry.googleMode === 'subset' && Boolean(entry.googleText && containsCharacters(entry.googleText, requestedCharacters)))
      : entry.localMode === 'full' || (preferSubset && entry.localMode === 'preview');
    if (entry.status === 'ready' && modeIsCovered && document.fonts.check(descriptor, sample)) return;

    entry.status = 'loading';
    this.onChange(font.id);
    let timer: ReturnType<typeof setTimeout>;
    const work = async () => {
      await this.initialize(font, entry, sample, preferSubset);
      const loaded = await document.fonts.load(descriptor, sample);
      if (loaded.length === 0) throw new Error('未取得字型');
    };
    entry.promise = Promise.race([
      work(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('載入逾時')), 25000); }),
    ]).then(() => { entry.status = 'ready'; entry.loaded = true; }).catch(() => {
      entry.status = 'error';
    }).finally(() => {
      clearTimeout(timer);
      entry.promise = undefined;
      this.onChange(font.id);
    });
    await entry.promise;
  }
}
