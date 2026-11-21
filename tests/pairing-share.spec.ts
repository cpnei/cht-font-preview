import { expect, test, type Page } from '@playwright/test';
import heroFonts from '../src/hero-fonts.json' with { type: 'json' };

async function openPairing(page: Page) {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  const loaded = [400, 700].map(weight => page.waitForResponse(response =>
    response.ok() && new URL(response.url()).pathname.endsWith(`/line-seed-tw-${weight}.preview.woff2`),
  ));
  await page.goto('./');
  await page.getByRole('searchbox').fill('no matching fonts');
  for (const role of ['heading', 'body']) {
    await page.locator(`#pairing-${role}-font`).selectOption('line-seed-tw');
  }
  await page.locator('#pairing-heading-weight').selectOption('700');
  await expect(page.locator('#pairing-status')).toHaveText('標題：LINE Seed TW · 內文：LINE Seed TW');
  await Promise.all(loaded);
}

test('shares both weights and restores text only when selected', async ({ page }) => {
  const heroIndex = heroFonts.findIndex(font => font.id === 'line-seed-tw');
  await page.addInitScript(random => {
    if (random >= 0) Math.random = () => random;
    Object.defineProperty(navigator, 'clipboard', { value: {
      writeText: (value: string) => Promise.reject(new Error(value)),
    } });
  }, (heroIndex + 0.5) / heroFonts.length);
  await openPairing(page);
  await page.locator('#pairing-heading-text').fill('未發布標題 😀');
  await page.locator('#pairing-body-text').fill('私有的文案\n第二行 & #');
  await page.getByRole('button', { name: '分享搭配' }).click();
  const manualCopy = page.locator('#pairing-share-manual textarea');

  await page.getByRole('button', { name: '複製套用規格' }).click();
  await expect(manualCopy).toBeVisible();
  const json = JSON.parse(await manualCopy.inputValue());
  expect(json).toMatchObject({
    version: 1,
    heading: { fontId: 'line-seed-tw', fontFamily: 'LINE Seed TW_OTF', fontWeight: 700 },
    body: { fontId: 'line-seed-tw', fontWeight: 400 },
  });
  expect(json.heading).not.toHaveProperty('text');
  expect(json.body).not.toHaveProperty('text');
  expect(json.heading.webFont.woff2Url).toContain('line-seed-tw-700.woff2');

  await page.getByRole('button', { name: '複製預覽連結' }).click();
  await expect(manualCopy).toHaveValue(/headingWeight=700/);
  const privateUrl = new URL(await manualCopy.inputValue());
  expect(privateUrl.search).toBe('');
  expect(privateUrl.hash).not.toContain('Text=');

  await page.getByRole('checkbox', { name: '附上我的標題與內文' }).check();
  await page.getByRole('button', { name: '複製預覽連結' }).click();
  await expect(manualCopy).toHaveValue(/bodyText=/);
  await page.goto(await manualCopy.inputValue());
  await expect(page.locator('#pairing-heading-text')).toHaveValue('未發布標題 😀');
  await expect(page.locator('#pairing-body-text')).toHaveValue('私有的文案\n第二行 & #');
  await expect(page.locator('#pairing-preview-heading')).toHaveCSS('font-weight', '700');
  await expect(page.locator('#pairing-preview-body')).toHaveCSS('font-weight', '400');
  await expect(page.getByRole('dialog', { name: '分享搭配' })).toBeHidden();
  await expect(page.locator('#pairing')).toBeInViewport();
  await page.reload();
  await expect(page.locator('#pairing-preview-heading')).toHaveText('未發布標題 😀');

  await page.goto(privateUrl.href);
  await expect(page.locator('#pairing-heading-text')).toHaveValue('讓每一段文字，都有自己的樣子。');
});

test('exports and imports long copy as JSON and rejects an unsupported weight', async ({ page }) => {
  await openPairing(page);
  const text = '繁'.repeat(400);
  await page.locator('#pairing-body-text').fill(text);
  await page.getByRole('button', { name: '分享搭配' }).click();
  await page.getByRole('checkbox', { name: '附上我的標題與內文' }).check();
  await expect(page.getByRole('button', { name: '複製預覽連結' })).toBeDisabled();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '下載 JSON' }).click();
  const download = await downloadPromise;

  await page.goto('./');
  await page.getByRole('button', { name: '分享搭配' }).click();
  const file = page.locator('#pairing-import-file');
  await file.setInputFiles({
    name: 'invalid.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify({
      version: 1, heading: { fontId: 'line-seed-tw', fontWeight: 123 }, body: { fontId: 'line-seed-tw', fontWeight: 400 },
    })),
  });
  await expect(page.locator('#pairing-share-feedback')).toContainText('無法匯入');
  await expect(page.locator('#pairing-heading-font')).toHaveValue('noto-serif-tc');
  await file.setInputFiles((await download.path())!);
  await expect(page.getByRole('dialog', { name: '分享搭配' })).toBeHidden();
  await expect(page.locator('#pairing-heading-weight')).toHaveValue('700');
  await expect(page.locator('#pairing-body-text')).toHaveValue(text);
});

test('pairing examples retain the copy and can be shared after editing', async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.goto('./#pairing');
  const heading = page.locator('#pairing-heading-text');
  const body = page.locator('#pairing-body-text');
  await heading.fill('在城市裡，慢慢走');
  await body.fill('從保留老招牌的巷口出發。\n週六 10:30 集合。');

  const entry = page.getByText('試用搭配範例', { exact: true });
  for (const [name, headingFont, headingWeight, bodyFont] of [
    ['品牌與文化網站', 'noto-serif-tc', '600', 'noto-sans-tc'],
    ['書刊與長文', 'noto-sans-tc', '700', 'noto-serif-tc'],
    ['產品介面', 'noto-sans-tc', '700', 'noto-sans-tc'],
  ]) {
    await entry.click();
    const example = page.getByRole('button', { name: new RegExp(name) });
    await example.click();
    await expect(entry).toBeFocused();
    await expect(example).toBeHidden();
    await expect(page.locator('#pairing-heading-font')).toHaveValue(headingFont);
    await expect(page.locator('#pairing-body-font')).toHaveValue(bodyFont);
    await expect(page.locator('#pairing-preview-heading')).toHaveCSS('font-weight', headingWeight);
    await expect(page.locator('#pairing-preview-body')).toHaveCSS('font-weight', '400');
  }
  await expect(heading).toHaveValue('在城市裡，慢慢走');
  await expect(body).toHaveValue('從保留老招牌的巷口出發。\n週六 10:30 集合。');

  await page.locator('#pairing-heading-weight').selectOption('800');
  await entry.click();
  await expect(page.locator('#pairing-examples button[aria-pressed="true"]')).toHaveCount(0);
  await page.getByRole('button', { name: '分享搭配' }).click();
  await expect(page.locator('#pairing-share-summary')).toContainText('Noto Sans TC · 800');
  await expect(page.locator('#pairing-share-summary')).toContainText('Noto Sans TC · 400');
});
