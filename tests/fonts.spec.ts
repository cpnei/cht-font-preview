import { expect, test } from '@playwright/test';

test('all eight actual fonts load, change weights and render new text', async ({ page }) => {
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
  await page.locator('#preview-input').fill('臺灣的風景，「字」裡行間。\nDesign 2026 / NT$ 1,280');
  await page.waitForTimeout(400);
  for (const card of await page.locator('#font-grid .font-card').all()) {
    await expect(card).toHaveAttribute('data-status', 'ready', { timeout: 35000 });
  }
  await page.locator('[data-weight="noto-sans-tc"]').selectOption('700');
  await expect(page.locator('[data-font="noto-sans-tc"]')).toHaveAttribute('data-status', 'ready', { timeout: 35000 });
  const loadedFamilies = await page.evaluate(() => Array.from(document.fonts).filter(font => font.status === 'loaded').map(font => font.family.replaceAll('"', '')));
  for (const family of ['Noto Sans TC', 'Noto Serif TC', 'Huninn', 'Chiron GoRound TC', 'LXGW WenKai TC', 'Iansui', 'preview-chenyuluoyan', 'preview-mantou-sans']) {
    expect(loadedFamilies).toContain(family);
  }
  expect(requests.some(url => url.includes('text='))).toBe(true);
  expect(errors).toEqual([]);
});
