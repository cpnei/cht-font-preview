import { fonts, fontById, type Category } from './fonts';
import samples from './samples.json';

export { samples };
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
