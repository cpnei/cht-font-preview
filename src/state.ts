import { fonts, fontById, type Category } from './fonts';

export const samples = [
  { name: '日常風景', text: '把日子，寫成喜歡的樣子。\n讓每一個字，都有溫度。' },
  { name: '繁體筆畫', text: '臺灣的風景，藏在巷弄與山海之間。\n繁花、龜鶴、鬱鬱蔥蔥，都是生活。' },
  { name: '標點與英數', text: '「你好！」\n文字，日常。\nAbc 2026\nNT$ 1,280' },
];
export interface Settings { size: number; spacing: number; lineHeight: number }
export const defaults: Settings = { size: 36, spacing: 0, lineHeight: 1.8 };
export const storageKey = 'font-select:v1';
export const limitText = (text: string) => Array.from(text).slice(0, 500).join('');

export function filterFonts(query: string, category: Category, favoritesOnly: boolean, favorites: Set<string>) {
  const term = query.trim().toLocaleLowerCase();
  return fonts.filter(font =>
    (category === '全部字型' || font.category === category) &&
    (!favoritesOnly || favorites.has(font.id)) &&
    `${font.name} ${font.englishName} ${font.author}`.toLocaleLowerCase().includes(term),
  );
}

export function toggleCompare(current: string[], id: string): string[] {
  if (!fontById.has(id)) return current;
  if (current.includes(id)) return current.filter(item => item !== id);
  return current.length < 4 ? [...current, id] : current;
}

export function restore(value: string | null): { favorites: Set<string>; settings: Settings } {
  const fallback = { favorites: new Set<string>(), settings: { ...defaults } };
  try {
    const data = JSON.parse(value || 'null');
    if (!data || typeof data !== 'object') return fallback;
    const valid = (v: unknown, min: number, max: number, def: number) => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max ? v : def;
    return {
      favorites: new Set(Array.isArray(data.favorites) ? data.favorites.filter((id: unknown): id is string => typeof id === 'string' && fontById.has(id)) : []),
      settings: {
        size: valid(data.settings?.size, 16, 72, defaults.size),
        spacing: valid(data.settings?.spacing, -1, 8, defaults.spacing),
        lineHeight: valid(data.settings?.lineHeight, 1.2, 2.4, defaults.lineHeight),
      },
    };
  } catch { return fallback; }
}
