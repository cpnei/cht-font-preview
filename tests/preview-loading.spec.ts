import { expect, test, type Page } from '@playwright/test';

const family = 'Cactus Classical Serif';
const cardId = 'cactus-classical-serif';

function isFixtureRequest(rawUrl: string) {
  const url = new URL(rawUrl);
  return url.hostname === 'fonts.googleapis.com' && url.searchParams.get('family') === family;
}

async function interceptFonts(page: Page) {
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.route('https://fonts.googleapis.com/**', async route => {
    if (!isFixtureRequest(route.request().url())) return route.abort();
    const text = new URL(route.request().url()).searchParams.get('text')!;
    const ranges = [...text].map(character => 'U+' + character.codePointAt(0)!.toString(16)).join(', ');
    const fontUrl = new URL('fonts/Font-Select-Broadstroke.preview.woff2', page.url()).href;
    await route.fulfill({
      contentType: 'text/css',
      body: '@font-face { font-family: "' + family + '"; font-weight: 400; src: url("' + fontUrl +
        '") format("woff2"); unicode-range: ' + ranges + '; }',
    });
  });
  await page.goto('./');
}

test('a visited card loads newly typed characters on reentry', async ({ page }) => {
  await interceptFonts(page);
  const card = page.locator('#font-grid [data-font="' + cardId + '"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('data-status', 'ready');

  const newSubset = page.waitForRequest(request =>
    isFixtureRequest(request.url()) && new URL(request.url()).searchParams.get('text') === '~');
  const editor = page.locator('#preview-input');
  await editor.scrollIntoViewIfNeeded();
  await editor.fill('~');
  await expect(card).toHaveAttribute('data-status', 'idle');
  await expect(card.locator('[data-status]')).toHaveText('等待更新字型');

  await card.scrollIntoViewIfNeeded();
  await newSubset;
  await expect(card).toHaveAttribute('data-status', 'ready');
  await expect(card.locator('.font-preview')).toBeVisible();
  await expect(card.locator('.font-preview')).toHaveText('~');
});

test('a Google heading requests only its own pairing text', async ({ page }) => {
  await interceptFonts(page);
  await page.getByRole('searchbox').fill('no matching font');
  await page.locator('#pairing-body-font').selectOption('mantou-sans');
  await page.locator('#pairing-body-text').fill('~BODY');
  await page.locator('#pairing-heading-text').fill('HEAD');

  const headingSubset = page.waitForRequest(request => isFixtureRequest(request.url()));
  await page.locator('#pairing-heading-font').selectOption(cardId);
  const request = await headingSubset;
  expect(new URL(request.url()).searchParams.get('text')).toBe('ADEH');
  await expect(page.locator('#pairing-status')).toHaveText('標題：仙人掌古典明體 · 內文：饅頭黑體');
});

test('bundled fonts use the selected weight and ask before loading its full file', async ({ page }) => {
  await interceptFonts(page);
  const requested: string[] = [];
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (path.includes('/fonts/line-seed-tw-')) requested.push(path.split('/').at(-1)!);
  });

  await page.getByRole('searchbox').fill('LINE Seed TW');
  const card = page.locator('#font-grid [data-font="line-seed-tw"]');
  await card.scrollIntoViewIfNeeded();
  await expect(card).toHaveAttribute('data-status', 'ready');
  expect(requested).toContain('line-seed-tw-400.preview.woff2');

  const weight = card.locator('[data-weight]');
  await weight.selectOption('700');
  await expect(card).toHaveAttribute('data-status', 'ready');
  await expect(card.locator('.font-preview')).toHaveCSS('font-weight', '700');
  expect(requested).toContain('line-seed-tw-700.preview.woff2');

  await page.locator('#preview-input').fill('誠');
  const loadFull = card.getByRole('button', { name: /載入完整字型/ });
  await expect(loadFull).toBeVisible();
  expect(requested.every(name => name.endsWith('.preview.woff2'))).toBe(true);
  await loadFull.click();
  await expect(card).toHaveAttribute('data-status', 'ready');
  expect(requested).toContain('line-seed-tw-700.woff2');

  await weight.selectOption('250');
  await expect(loadFull).toBeVisible();
  expect(requested).not.toContain('line-seed-tw-250.woff2');
  await weight.selectOption('700');
  await expect(card).toHaveAttribute('data-status', 'ready');

  await page.locator('#view-toggle').click();
  const compare = page.locator('#compare-list [data-font="line-seed-tw"]');
  await expect(compare).toHaveAttribute('data-status', 'ready');
  await expect(compare.locator('[data-compare-preview]')).toHaveText('誠');

  await page.locator('#pairing-heading-font').selectOption('line-seed-tw');
  await page.locator('#pairing-body-font').selectOption('jason-handwriting-5');
  await expect(page.locator('#pairing-preview-heading')).toHaveCSS('font-weight', '400');
  await page.locator('#pairing-heading-weight').selectOption('700');
  await expect(page.locator('#pairing-status')).toHaveText('標題：LINE Seed TW · 內文：清松手寫體 5 號');
  await expect(page.locator('#pairing-preview-heading')).toHaveCSS('font-weight', '700');
});
