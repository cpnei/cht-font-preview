import { defineConfig } from 'vite';
import { fonts } from './src/fonts.ts';
import { renderHome } from './src/view.ts';

const base = '/font-select/';
const siteUrl = new URL(base, 'https://cpnei.github.io').href;
const siteName = '字選 Font Select';
const title = '免費繁體中文字型預覽與比較｜字選 Font Select';
const description = `用自己的文字預覽與比較 ${fonts.length} 款可商用的繁體中文開源字型，試搭標題和內文，並查看字型下載與授權資訊。`;

export default defineConfig({
  base,
  define: {
    'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl),
    'import.meta.env.VITE_SITE_TITLE': JSON.stringify(title),
    'import.meta.env.VITE_SITE_DESCRIPTION': JSON.stringify(description),
  },
  plugins: [
    {
      name: 'font-select-html',
      transformIndexHtml: {
        order: 'post',
        handler(html) {
          return {
            html: html.replace('<div id="app"></div>', () => `<div id="app">${renderHome(base)}</div>`),
            tags: [
              {
                tag: 'script',
                attrs: { type: 'application/ld+json' },
                children: JSON.stringify({
                  '@context': 'https://schema.org',
                  '@type': 'WebApplication',
                  name: siteName,
                  url: siteUrl,
                  description,
                  inLanguage: 'zh-Hant-TW',
                  applicationCategory: 'DesignApplication',
                  isAccessibleForFree: true,
                }).replace(/</g, '\\u003c'),
                injectTo: 'head',
              },
            ],
          };
        },
      },
      generateBundle() {
        this.emitFile({
          type: 'asset',
          fileName: 'sitemap.xml',
          source: `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${siteUrl}</loc></url>
</urlset>
`,
        });
      },
    },
  ],
});
