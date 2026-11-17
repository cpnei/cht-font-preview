import { assetUrl, fontFamily, type FontDefinition } from './fonts';

export type LoadStatus = 'idle' | 'loading' | 'ready' | 'error';
interface Entry { status: LoadStatus; promise?: Promise<void>; link?: HTMLLinkElement; face?: FontFace; initialized?: boolean }

export class FontLoader {
  private entries = new Map<string, Entry>();
  constructor(private onChange: (id: string) => void) {}

  status(id: string): LoadStatus { return this.entries.get(id)?.status ?? 'idle'; }

  private async initialize(font: FontDefinition, entry: Entry) {
    if (entry.initialized) return;
    if (font.loader.kind === 'local') {
      const face = new FontFace(fontFamily(font), `url("${assetUrl(font.loader.path)}")`, { weight: String(font.defaultWeight), style: 'normal', display: 'swap' });
      entry.face = face;
      await face.load();
      document.fonts.add(face);
    } else {
      entry.link?.remove();
      const link = document.createElement('link');
      entry.link = link;
      link.rel = 'stylesheet';
      const family = encodeURIComponent(font.loader.family).replace(/%20/g, '+');
      link.href = `https://fonts.googleapis.com/css2?family=${family}${font.loader.axis}&display=swap`;
      await new Promise<void>((resolve, reject) => {
        link.onload = () => resolve();
        link.onerror = () => reject(new Error('無法取得字型樣式'));
        document.head.append(link);
      });
    }
    entry.initialized = true;
  }

  async load(font: FontDefinition, text: string, weight: number, retry = false): Promise<void> {
    let entry = this.entries.get(font.id);
    if (!entry) { entry = { status: 'idle' }; this.entries.set(font.id, entry); }
    if (entry.status === 'error' && !retry) return;
    if (entry.promise) {
      await entry.promise;
      if (entry.status === 'error') return;
    }
    const sample = `${text}\nAa臺灣`;
    const descriptor = `${weight} 36px "${fontFamily(font)}"`;
    // check() alone returns true for undeclared families. Only use it after a real load.
    if (entry.status === 'ready' && document.fonts.check(descriptor, sample)) return;
    entry.status = 'loading';
    this.onChange(font.id);
    let timer: ReturnType<typeof setTimeout>;
    const work = async () => {
      await this.initialize(font, entry);
      const loaded = await document.fonts.load(descriptor, sample);
      if (loaded.length === 0) throw new Error('未取得字型');
    };
    entry.promise = Promise.race([
      work(),
      new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('載入逾時')), 25000); }),
    ]).then(() => { entry.status = 'ready'; }).catch(() => {
      entry.status = 'error';
      if (!entry.initialized) { entry.link?.remove(); entry.link = undefined; }
    }).finally(() => {
      clearTimeout(timer);
      entry.promise = undefined;
      this.onChange(font.id);
    });
    await entry.promise;
  }
}
