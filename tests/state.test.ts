import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fonts } from '../src/fonts';
import { defaults, filterFonts, limitText, restore } from '../src/state';

describe('font catalog and state', () => {
  it('combines search, category, and favorites', () => {
    expect(filterFonts('Noto', '明體', false, new Set()).map(f => f.id)).toEqual(['noto-serif-tc', 'noto-serif-hk']);
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

  it('includes fifty-seven unique fonts, valid weights, and locked licensed assets', () => {
    expect(fonts).toHaveLength(57);
    expect(new Set(fonts.map(f => f.id)).size).toBe(57);
    const optimizedLock = JSON.parse(readFileSync('optimized-fonts.lock.json', 'utf8'));
    for (const font of fonts) {
      expect(font.weights).toContain(font.defaultWeight);
      expect(font.license).toBe('OFL-1.1');
      expect(readFileSync(`public/${font.licensePath}`, 'utf8')).toMatch(/SIL OPEN FONT LICENSE/i);
      expect(new URL(font.sourceUrl).protocol).toBe('https:');
      expect(new URL(font.downloadUrl).protocol).toBe('https:');
      if (font.loader.kind === 'local') {
        expect(Object.keys(font.loader.files).map(Number)).toEqual(font.weights);
        for (const files of Object.values(font.loader.files)) {
          for (const file of [files, files.preview]) {
            const locked = optimizedLock.assets.find((asset: { path: string }) => asset.path === `public/${file.path}`);
            expect(locked?.bytes).toBe(file.bytes);
          }
          expect(files.preview.bytes).toBeLessThan(files.bytes);
        }
      }
    }
  });
});
