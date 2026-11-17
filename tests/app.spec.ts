import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  // Deterministic UI tests deliberately fail external fonts; real loading is tested separately.
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.goto('./');
});

test('search, categories and empty-state recovery', async ({ page }) => {
  await expect(page.locator('#font-grid .font-card')).toHaveCount(8);
  await page.getByRole('searchbox', { name: '搜尋字型' }).fill('noto');
  await expect(page.locator('#font-grid .font-card')).toHaveCount(2);
  await page.getByRole('button', { name: '明體', exact: true }).click();
  await expect(page.locator('#font-grid .font-card')).toHaveCount(1);
  await page.getByRole('searchbox').fill('不存在');
  await expect(page.getByText('還沒遇見這款字')).toBeVisible();
  await page.getByRole('button', { name: '顯示所有字型' }).click();
  await expect(page.locator('#font-grid .font-card')).toHaveCount(8);
});

test('preview, settings, unicode limit and literal HTML', async ({ page }) => {
  const input = page.getByRole('textbox', { name: '試著寫點什麼' });
  await input.fill('臺灣，風景。\n<img src=x onerror=alert(1)>');
  await expect(page.locator('.font-preview').first()).toHaveText('臺灣，風景。\n<img src=x onerror=alert(1)>');
  await expect(page.locator('.font-preview img')).toHaveCount(0);
  await input.fill('𠮷'.repeat(501));
  await expect(input).toHaveValue('𠮷'.repeat(500));
  await expect(page.locator('#char-count')).toHaveText('500 / 500');
  await page.locator('#font-size').fill('48');
  await expect(page.locator('#font-size-value')).toHaveText('48px');
  await page.reload();
  await expect(page.locator('#font-size')).toHaveValue('48');
  await expect(input).not.toHaveValue('𠮷'.repeat(500));
  await page.getByRole('button', { name: '重設排版設定' }).click();
  await expect(page.locator('#font-size')).toHaveValue('36');
});

test('favorites survive reload and filter correctly', async ({ page }) => {
  await page.getByRole('button', { name: '收藏 Noto Sans TC', exact: true }).click();
  await page.reload();
  await expect(page.getByRole('button', { name: '取消收藏 Noto Sans TC', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#favorites-filter').click();
  await expect(page.locator('#font-grid .font-card')).toHaveCount(1);
  await page.getByRole('button', { name: '取消收藏 Noto Sans TC', exact: true }).click();
  await expect(page.locator('#empty-state')).toBeVisible();
});

test('comparison is limited to four and restores focus on Escape', async ({ page }) => {
  for (const id of ['noto-sans-tc', 'noto-serif-tc', 'huninn', 'chiron-goround-tc', 'iansui']) {
    await page.locator(`#font-grid [data-compare="${id}"]`).click();
  }
  await expect(page.locator('#compare-count')).toHaveText('4 / 4');
  await expect(page.locator('#notice')).toContainText('最多比較四款');
  await page.locator('#open-compare').click();
  await expect(page.getByRole('dialog', { name: '好字，放在一起看。' })).toBeVisible();
  await expect(page.locator('#compare-grid .font-card')).toHaveCount(4);
  await page.keyboard.press('Escape');
  await expect(page.locator('#compare-dialog')).not.toBeVisible();
  await expect(page.locator('#open-compare')).toBeFocused();
  await page.getByRole('button', { name: '移除比較 粉圓' }).click();
  await expect(page.locator('#compare-count')).toHaveText('3 / 4');
  await page.locator('#clear-compare').click();
  await expect(page.locator('#compare-bar')).not.toBeVisible();
});

test('large fonts wait for consent and failed downloads can be retried', async ({ page }) => {
  let downloads = 0;
  await page.route('**/fonts/*.ttf', route => { downloads++; return route.abort(); });
  await page.getByRole('button', { name: '標題字', exact: true }).click();
  const card = page.locator('[data-font="mantou-sans"]');
  await expect(card.getByRole('button', { name: '載入預覽', exact: true })).toBeVisible();
  expect(downloads).toBe(0);
  await card.getByRole('button', { name: '載入預覽', exact: true }).click();
  await expect(card.getByText('字型暫時無法載入')).toBeVisible();
  await expect(card.locator('.font-preview')).not.toBeVisible();
  expect(downloads).toBe(1);
  await page.unroute('**/fonts/*.ttf');
  await card.getByRole('button', { name: '重新載入' }).click();
  await expect(card.locator('.font-preview')).toBeVisible({ timeout: 15000 });
  await expect(card.locator('.font-status')).toHaveText('字型已載入');
});

test('keyboard navigation, about dialog and viewport fit', async ({ page }) => {
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: '跳至預覽文字' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('#preview-input')).toBeFocused();
  await page.getByRole('button', { name: '關於字選', exact: true }).click();
  await expect(page.getByRole('dialog', { name: '讓選字，簡單一點。' })).toBeVisible();
  await page.getByRole('button', { name: '關閉關於字選' }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test('disabled storage does not prevent normal preview', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
  });
  await page.reload();
  await page.getByRole('button', { name: '收藏 Noto Sans TC', exact: true }).click();
  await expect(page.locator('#notice')).toContainText('本次仍可正常使用');
  await page.getByRole('textbox', { name: '試著寫點什麼' }).fill('仍可預覽');
  await expect(page.locator('.font-preview').first()).toHaveText('仍可預覽');
});
