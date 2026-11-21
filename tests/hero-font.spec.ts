import { expect, test, type Page, type Request } from '@playwright/test';
import candidates from '../src/hero-fonts.json' with { type: 'json' };
import headline from '../src/site-headline.json' with { type: 'json' };
import { fonts, fontById } from '../src/fonts';
import audit from '../assets/hero-fonts.lock.json' with { type: 'json' };

async function isolateHeadline(page: Page, initial = 0) {
  await page.route('https://fonts.googleapis.com/**', route => route.abort());
  await page.route('https://cdn.jsdelivr.net/**', route => route.abort());
  await page.addInitScript(({ initial, count }) => {
    Math.random = () => (Number(sessionStorage.getItem('test-hero-index') ?? initial) + 0.5) / count;
  }, { initial, count: candidates.length });
}

test('headline audit accounts for every font in the catalog', () => {
  expect(audit.audit.map(entry => entry.id)).toEqual(fonts.map(font => font.id));
  expect(candidates.map(candidate => candidate.id)).toEqual(
    audit.audit.filter(entry => !('excluded' in entry)).map(entry => entry.id),
  );
  expect(candidates.length).toBeGreaterThan(4);
});

async function verifyLayout(page: Page) {
  const layout = await page.locator('#hero-title').evaluate(title => {
    const box = title.getBoundingClientRect();
    const style = getComputedStyle(title);
    const innerEnd = box.right - parseFloat(style.paddingInlineEnd);
    const lineHeight = parseFloat(style.lineHeight);
    const canvas = document.createElement('canvas').getContext('2d')!;
    canvas.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const lines = [...title.querySelectorAll(':scope > span')].map(span => {
      const range = document.createRange();
      range.selectNodeContents(span);
      const rects = [...range.getClientRects()].map(rect => ({ x: rect.left, right: rect.right }));
      const metrics = canvas.measureText(span.textContent!);
      const leading = lineHeight - metrics.fontBoundingBoxAscent - metrics.fontBoundingBoxDescent;
      const baseline = span.getBoundingClientRect().top + leading / 2 + metrics.fontBoundingBoxAscent;
      return { rects, inkTop: baseline - metrics.actualBoundingBoxAscent,
        inkBottom: baseline + metrics.actualBoundingBoxDescent };
    });
    return { lines, left: box.left, innerEnd,
      viewport: document.documentElement.clientWidth, scrollWidth: document.documentElement.scrollWidth };
  });
  const [lead, end] = layout.lines;
  expect([lead.rects.length, end.rects.length]).toEqual([1, 1]);
  for (const line of [lead.rects[0], end.rects[0]]) {
    expect(line.x).toBeGreaterThanOrEqual(layout.left - 1);
    expect(line.right).toBeLessThanOrEqual(layout.innerEnd + 1);
  }
  expect(lead.inkBottom).toBeLessThanOrEqual(end.inkTop + 1);
  expect(layout.scrollWidth).toBeLessThanOrEqual(layout.viewport + 1);
}

test('every headline candidate actually loads and fits the two lines', async ({ page, isMobile }) => {
  test.setTimeout(180_000);
  const portrait = isMobile ? { width: 320, height: 780 } : { width: 1280, height: 900 };
  await page.setViewportSize(portrait);
  await isolateHeadline(page);
  const requested: string[] = [];
  page.on('request', request => {
    const path = new URL(request.url()).pathname;
    if (path.includes('/hero-fonts/')) requested.push(path);
  });
  await page.goto('./', { waitUntil: 'domcontentloaded' });
  const heading = page.locator('#hero-title');
  await expect(heading.locator(':scope > span')).toHaveText([headline.lead, headline.end]);

  for (const [index, candidate] of candidates.entries()) {
    await test.step(candidate.id, async () => {
      if (index > 0) {
        await page.setViewportSize(portrait);
        await page.evaluate(value => sessionStorage.setItem('test-hero-index', String(value)), index);
        requested.length = 0;
        await page.reload({ waitUntil: 'domcontentloaded' });
      }
      await expect(heading).toHaveAttribute('data-hero-font', candidate.id);
      await expect(heading).toHaveCSS('font-weight', String(candidate.weight));
      const family = candidate.family ?? fontById.get(candidate.id)!.loader.family;
      expect(await heading.evaluate(node => getComputedStyle(node).fontFamily)).toContain(family);
      expect(requested.map(path => path.split('/').at(-1)).sort()).toEqual(
        (candidate.faces ?? []).map(face => face.path.split('/').at(-1)).sort(),
      );
      await verifyLayout(page);
      if (isMobile) {
        await page.setViewportSize({ width: 844, height: 390 });
        await verifyLayout(page);
        await expect(heading).toHaveAttribute('data-hero-font', candidate.id);
      }
    });
  }
});

for (const failure of ['network error', 'budget exceeded']) {
  test(`headline retains its default font after ${failure}`, async ({ page }) => {
    await isolateHeadline(page, candidates.findIndex(candidate => candidate.faces?.length));
    await page.route('**/hero-fonts/*.woff2', async route => {
      if (failure === 'network error') return route.abort();
      await new Promise(resolve => setTimeout(resolve, 1400));
      await route.continue();
    });
    const matches = (result: Request) => result.url().includes('/hero-fonts/');
    const request = failure === 'network error'
      ? page.waitForEvent('requestfailed', matches)
      : page.waitForEvent('requestfinished', matches);
    await page.goto('./');
    await request;
    if (failure === 'budget exceeded') {
      await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
    }
    const heading = page.locator('#hero-title');
    await expect(heading).not.toHaveAttribute('data-hero-font');
    await expect(heading).toHaveCSS('font-family', /Taipei Sans TC/);
    await expect(heading.locator(':scope > span')).toHaveText([headline.lead, headline.end]);
  });
}

test('headline is present without JavaScript', async ({ browser, baseURL }) => {
  const page = await browser.newPage({ javaScriptEnabled: false, baseURL });
  try {
    await page.goto('./');
    await expect(page.locator('#hero-title > span')).toHaveText([headline.lead, headline.end]);
    await expect(page.locator('#hero-title')).toHaveCSS('font-family', /Taipei Sans TC/);
  } finally {
    await page.close();
  }
});
