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
