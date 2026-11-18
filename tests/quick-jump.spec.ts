import { expect, test } from '@playwright/test';

test('quick navigation scrolls, closes the menu and focuses the destination without a frame', async ({ page }, info) => {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.goto('./');

  const jump = page.locator('#quick-jump');
  const summary = jump.locator('summary');
  await expect(jump).toBeHidden();

  for (const hash of ['#preview-settings', '#catalog', '#pairing', '#page-top']) {
    await page.evaluate(() => window.scrollTo({ top: 1800, behavior: 'instant' }));
    await expect(jump).toBeVisible();
    const link = jump.locator(`a[href="${hash}"]`);
    if (info.project.use.hasTouch) {
      await summary.tap();
      await link.tap();
    } else {
      await summary.press('Enter');
      await link.press('Enter');
    }

    const destination = page.locator(hash);
    await expect(destination).toBeFocused();
    await expect(destination).toHaveCSS('outline-style', 'none');
    await expect(jump.locator('details')).not.toHaveAttribute('open', '');
    await expect.poll(async () => {
      const top = await destination.evaluate(element => element.getBoundingClientRect().top);
      return top >= -1 && top <= (hash === '#page-top' ? 1 : 30);
    }).toBe(true);
  }
  await expect(jump).toBeHidden();
});
