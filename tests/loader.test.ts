import { afterEach, expect, it, vi } from 'vitest';
import { fontById } from '../src/fonts';
import { FontLoader } from '../src/loader';

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

it('does not replace the ready full face when a timed-out preview finishes', async () => {
  vi.useFakeTimers();
  const installed = new Set();
  let finishPreview!: () => void;
  class FakeFace {
    constructor(_family: string, readonly source: string) {}
    load(): Promise<FakeFace> {
      if (!this.source.includes('.preview.woff2')) return Promise.resolve(this);
      return new Promise(resolve => { finishPreview = () => resolve(this); });
    }
  }
  vi.stubGlobal('FontFace', FakeFace);
  vi.stubGlobal('document', { fonts: installed });

  const font = fontById.get('mantou-sans')!;
  const loader = new FontLoader(() => {});
  const initial = loader.load(font, 'Preview', 400, false, true);
  await vi.advanceTimersByTimeAsync(25000);
  await initial;
  expect(loader.status(font, 'Preview', 400, true)).toBe('error');

  await loader.load(font, '完整預覽', 400, true, false);
  const [full] = installed;
  expect(full).toBeInstanceOf(FakeFace);
  finishPreview();
  await vi.advanceTimersByTimeAsync(0);

  expect([...installed]).toEqual([full]);
  expect(loader.isLocalFull(font.id)).toBe(true);
  expect(loader.status(font, '完整預覽', 400, false)).toBe('ready');
});
