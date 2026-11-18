import { expect, test } from '@playwright/test';
import samples from '../src/samples.json' with { type: 'json' };

test('all thirty-four actual fonts load, change weights and render new text', async ({ page }) => {
  test.skip(!process.env.FONT_SMOKE, 'Run npm run test:fonts for real network verification.');
  test.setTimeout(180000);
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  const requests: string[] = [];
  page.on('request', request => requests.push(request.url()));
  await page.goto('./');
  expect(requests.filter(url => url.endsWith('.ttf'))).toHaveLength(0);
  for (const card of await page.locator('#font-grid .font-card').all()) {
    await card.scrollIntoViewIfNeeded();
    const load = card.getByRole('button', { name: '載入預覽', exact: true });
    if (await load.isVisible()) await load.click();
    await expect(card).toHaveAttribute('data-status', 'ready', { timeout: 35000 });
    await expect(card.locator('.font-preview')).toBeVisible();
  }
  const newSubset = page.waitForRequest(request => {
    const url = new URL(request.url());
    return url.hostname === 'fonts.googleapis.com' &&
      url.searchParams.get('family')?.startsWith('Noto Sans TC:') === true &&
      url.searchParams.get('text')?.includes('~') === true;
  });
  await page.locator('#preview-input').fill(samples[2].text + ' ~');
  for (const card of await page.locator('#font-grid .font-card').all()) {
    await card.scrollIntoViewIfNeeded();
    await expect(card).toHaveAttribute('data-status', 'ready', { timeout: 35000 });
  }
  await newSubset;
  const notoSansCard = page.locator('#font-grid [data-font="noto-sans-tc"]');
  await notoSansCard.locator('[data-weight]').selectOption('700');
  await expect(notoSansCard).toHaveAttribute('data-status', 'ready', { timeout: 35000 });
  await expect(notoSansCard.locator('.font-preview')).toHaveCSS('font-weight', '700');
  const loadedFamilies = await page.evaluate(() => Array.from(document.fonts).filter(font => font.status === 'loaded').map(font => font.family.replaceAll('"', '')));
  for (const family of ['Noto Sans TC', 'Noto Serif TC', 'Huninn', 'Chiron GoRound TC', 'LXGW WenKai TC', 'Iansui', 'Font Select Inkline', 'Font Select Broadstroke', 'Cactus Classical Serif', 'Chiron Hei HK', 'Chiron Sung HK', 'Chocolate Classical Sans', 'LXGW Marker Gothic', 'LXGW WenKai Mono TC', 'Noto Sans HK', 'Noto Serif HK', 'UoqMunThenKhung', 'WDXL Lubrifont TC', 'Taipei Sans TC', 'Glow Sans TC', 'Fusion Pixel 12px Monospaced Traditional Chinese', 'Fusion Pixel 12px Proportional Traditional Chinese', 'GenKiMin2TC', 'GenYoMin2TC', 'TW-Sung', 'TW-Kai', 'GenYo Gothic TC', 'Genki Gothic TC', 'Shanggu Serif TC', 'Shanggu Sans TC']) {
    expect(loadedFamilies).toContain(family);
  }
  expect(errors).toEqual([]);
});
