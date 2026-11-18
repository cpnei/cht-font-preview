import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fonts } from '../src/fonts';
import { defaults, filterFonts, limitText, restore } from '../src/state';

describe('font catalog and state', () => {
  it('combines search, category, and favorites', () => {
    expect(filterFonts('Noto', '明體', false, new Set()).map(f => f.id)).toEqual(['noto-serif-tc']);
    expect(filterFonts('  JUSTFONT ', '全部字型', true, new Set(['huninn'])).map(f => f.id)).toEqual(['huninn']);
    expect(filterFonts('粉圓', '黑體', false, new Set())).toEqual([]);
    expect(filterFonts('', '全部字型', true, new Set())).toEqual([]);
  });

  it('recovers from corrupt storage and removes stale or malformed favorites', () => {
    expect(restore('{')).toEqual({ favorites: new Set(), settings: defaults });
    expect(restore(JSON.stringify({ favorites: ['huninn', 'deleted', 'huninn', 4], settings: { size: 900, spacing: 2, lineHeight: '2' } }))).toEqual({ favorites: new Set(['huninn']), settings: { ...defaults, spacing: 2 } });
    expect(restore(JSON.stringify({ favorites: ['iansui'], settings: { size: 42, spacing: -1, lineHeight: 2.2 } })).settings).toEqual({ size: 42, spacing: -1, lineHeight: 2.2 });
  });

  it('limits user text by code points without breaking supplementary Han characters', () => {
    const text = limitText('𠮷'.repeat(501));
    expect(Array.from(text)).toHaveLength(500);
    expect(text).toBe('𠮷'.repeat(500));
  });

  it('includes thirty-four unique fonts, valid weights, and original licensed assets', () => {
    expect(fonts).toHaveLength(34);
    expect(new Set(fonts.map(f => f.id)).size).toBe(34);
    const lock = JSON.parse(readFileSync('assets.lock.json', 'utf8'));
    const optimizedLock = JSON.parse(readFileSync('optimized-fonts.lock.json', 'utf8'));
    for (const font of fonts) {
      expect(font.weights).toContain(font.defaultWeight);
      expect(font.license).toBe('OFL-1.1');
      expect(readFileSync(`public/${font.licensePath}`, 'utf8')).toMatch(/SIL OPEN FONT LICENSE/i);
      expect(new URL(font.sourceUrl).protocol).toBe('https:');
      expect(new URL(font.downloadUrl).protocol).toBe('https:');
      if (font.loader.kind === 'local') {
        const originalPath = `assets/fonts/${font.id === 'chenyuluoyan' ? 'ChenYuluoyan-2.0-Thin' : 'MantouSans-Regular'}.ttf`;
        const fullPath = `public/${font.loader.path}`;
        const previewPath = `public/${font.loader.preview.path}`;
        expect(lock.assets.find((asset: { path: string }) => asset.path === originalPath)).toBeDefined();
        expect(optimizedLock.assets.find((asset: { path: string }) => asset.path === fullPath).bytes).toBe(font.loader.bytes);
        expect(optimizedLock.assets.find((asset: { path: string }) => asset.path === previewPath).bytes).toBe(font.loader.preview.bytes);
      }
    }
  });
});
