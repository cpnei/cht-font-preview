import localAssets from './local-font-assets.json' with { type: 'json' };

export const categories = ['全部字型', '黑體', '明體', '圓體', '手寫・楷體', '標題字', '等寬'] as const;
export type Category = typeof categories[number];

interface LocalFontFiles {
  path: string;
  bytes: number;
  preview: { path: string; bytes: number; characters: string };
}

export interface FontDefinition {
  id: string;
  name: string;
  englishName: string;
  author: string;
  category: Exclude<Category, '全部字型'>;
  addedAt: string;
  description: string;
  weights: number[];
  defaultWeight: number;
  sourceUrl: string;
  downloadUrl: string;
  license: 'OFL-1.1';
  licensePath: string;
  loader:
    | { kind: 'google'; family: string; axis: string }
    | { kind: 'stylesheet'; family: string; stylesheet: string | Record<number, string>; stretch?: string }
    | { kind: 'local'; family: string; originalFamily: string; files: Record<number, LocalFontFiles> };
}

function localFont(id: keyof typeof localAssets, originalFamily: string) {
  const { family, files } = localAssets[id];
  return { weights: Object.keys(files).map(Number), loader: { kind: 'local' as const, family, originalFamily, files } };
}

type CatalogEntry = Omit<FontDefinition, 'addedAt'>;

const launchFonts: CatalogEntry[] = [
  {
    id: 'noto-sans-tc', name: 'Noto Sans TC', englishName: '思源黑體・Google 版本', author: 'Google / Adobe', category: '黑體',
    description: '俐落而安定，讓每一段日常清楚可讀。', weights: [100,200,300,400,500,600,700,800,900], defaultWeight: 400,
    sourceUrl: 'https://github.com/notofonts/noto-cjk', downloadUrl: 'https://fonts.google.com/specimen/Noto+Sans+TC',
    license: 'OFL-1.1', licensePath: 'licenses/noto-sans-tc.txt', loader: { kind: 'google', family: 'Noto Sans TC', axis: ':wght@100..900' },
  },
  {
    id: 'noto-serif-tc', name: 'Noto Serif TC', englishName: '思源宋體・Google 版本', author: 'Google / Adobe', category: '明體',
    description: '一筆一畫之間，留住文字的優雅與份量。', weights: [200,300,400,500,600,700,800,900], defaultWeight: 400,
    sourceUrl: 'https://github.com/notofonts/noto-cjk', downloadUrl: 'https://fonts.google.com/specimen/Noto+Serif+TC',
    license: 'OFL-1.1', licensePath: 'licenses/noto-serif-tc.txt', loader: { kind: 'google', family: 'Noto Serif TC', axis: ':wght@200..900' },
  },
  {
    id: 'huninn', name: '粉圓', englishName: 'Huninn', author: 'justfont', category: '圓體',
    description: '圓圓的字，裝得下生活裡的小小溫柔。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/justfont/Huninn', downloadUrl: 'https://github.com/justfont/Huninn/releases',
    license: 'OFL-1.1', licensePath: 'licenses/huninn.txt', loader: { kind: 'google', family: 'Huninn', axis: '' },
  },
  {
    id: 'chiron-goround-tc', name: '昭源環方', englishName: 'Chiron GoRound TC', author: 'Tamcy / Chiron Fonts', category: '圓體',
    description: '方中帶圓，在理性與親切之間剛剛好。', weights: [200,300,400,500,600,700,800,900], defaultWeight: 400,
    sourceUrl: 'https://github.com/chiron-fonts/chiron-go-round-tc', downloadUrl: 'https://github.com/chiron-fonts/chiron-go-round-tc/releases',
    license: 'OFL-1.1', licensePath: 'licenses/chiron-goround-tc.txt', loader: { kind: 'google', family: 'Chiron GoRound TC', axis: ':wght@200..900' },
  },
  {
    id: 'lxgw-wenkai-tc', name: '霞鶩文楷 TC', englishName: 'LXGW WenKai TC', author: 'LXGW / Aaron Bell', category: '手寫・楷體',
    description: '像一封認真寫下的信，自然，也耐讀。', weights: [300,400,700], defaultWeight: 400,
    sourceUrl: 'https://github.com/aaronbell/LxgwWenkaiTC', downloadUrl: 'https://github.com/aaronbell/LxgwWenkaiTC/releases',
    license: 'OFL-1.1', licensePath: 'licenses/lxgw-wenkai-tc.txt', loader: { kind: 'google', family: 'LXGW WenKai TC', axis: ':wght@300;400;700' },
  },
  {
    id: 'iansui', name: '芫荽', englishName: 'Iansui', author: 'But Ko / ButTaiwan', category: '手寫・楷體',
    description: '熟悉的臺灣筆形，寫出輕盈的手寫感。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/ButTaiwan/iansui', downloadUrl: 'https://github.com/ButTaiwan/iansui/releases',
    license: 'OFL-1.1', licensePath: 'licenses/iansui.txt', loader: { kind: 'google', family: 'Iansui', axis: '' },
  },
  {
    id: 'chenyuluoyan', name: '辰宇落雁體', englishName: 'ChenYuluoyan 2.0 Thin', author: '劉韋辰 / 王立宇', category: '手寫・楷體',
    description: '細細的筆觸，收藏青春裡的每一句呢喃。', defaultWeight: 100,
    sourceUrl: 'https://github.com/Chenyu-otf/chenyuluoyan_thin', downloadUrl: 'https://github.com/Chenyu-otf/chenyuluoyan_thin#下載',
    license: 'OFL-1.1', licensePath: 'licenses/chenyuluoyan.txt', ...localFont('chenyuluoyan', 'ChenYuluoyan 2.0'),
  },
  {
    id: 'mantou-sans', name: '饅頭黑體', englishName: 'Mantou Sans', author: 'mant0u0 / Artakana', category: '標題字',
    description: '飽滿、有力，讓想說的話成為目光焦點。', defaultWeight: 400,
    sourceUrl: 'https://github.com/mant0u0/MantouSans', downloadUrl: 'https://github.com/mant0u0/MantouSans#下載與安裝',
    license: 'OFL-1.1', licensePath: 'licenses/mantou-sans.txt', ...localFont('mantou-sans', 'Mantou Sans'),
  },
];

const firstExpansion: CatalogEntry[] = [
  {
    id: 'cactus-classical-serif', name: '仙人掌古典明體', englishName: 'Cactus Classical Serif', author: 'Henry Chan / Tian Haidong / Moonlit Owen', category: '明體',
    description: '古典明體骨架帶著鮮明個性，適合標題與短段落。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/MoonlitOwen/CactusSerif', downloadUrl: 'https://fonts.google.com/specimen/Cactus+Classical+Serif',
    license: 'OFL-1.1', licensePath: 'licenses/cactus-classical-serif.txt', loader: { kind: 'google', family: 'Cactus Classical Serif', axis: '' },
  },
  {
    id: 'chiron-hei-hk', name: '昭源黑體 HK', englishName: 'Chiron Hei HK', author: 'Tamcy / Chiron Fonts', category: '黑體',
    description: '香港字形標準的現代黑體，筆畫俐落清晰。', weights: [200,300,400,500,600,700,800,900], defaultWeight: 400,
    sourceUrl: 'https://github.com/chiron-fonts/chiron-hei-hk', downloadUrl: 'https://fonts.google.com/specimen/Chiron+Hei+HK',
    license: 'OFL-1.1', licensePath: 'licenses/chiron-hei-hk.txt', loader: { kind: 'google', family: 'Chiron Hei HK', axis: ':wght@200..900' },
  },
  {
    id: 'chiron-sung-hk', name: '昭源宋體 HK', englishName: 'Chiron Sung HK', author: 'Tamcy / Chiron Fonts', category: '明體',
    description: '香港字形標準的宋體，細節分明，閱讀節奏沉穩。', weights: [200,300,400,500,600,700,800,900], defaultWeight: 400,
    sourceUrl: 'https://github.com/chiron-fonts/chiron-sung-hk', downloadUrl: 'https://fonts.google.com/specimen/Chiron+Sung+HK',
    license: 'OFL-1.1', licensePath: 'licenses/chiron-sung-hk.txt', loader: { kind: 'google', family: 'Chiron Sung HK', axis: ':wght@200..900' },
  },
  {
    id: 'chocolate-classical-sans', name: '巧克力古典黑體', englishName: 'Chocolate Classical Sans', author: 'Moonlit Owen', category: '標題字',
    description: '古典裝飾感揉進黑體，讓短標題更有記憶點。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/MoonlitOwen/ChocolateSans', downloadUrl: 'https://fonts.google.com/specimen/Chocolate+Classical+Sans',
    license: 'OFL-1.1', licensePath: 'licenses/chocolate-classical-sans.txt', loader: { kind: 'google', family: 'Chocolate Classical Sans', axis: '' },
  },
  {
    id: 'lxgw-marker-gothic', name: '霞鶩漫黑', englishName: 'LXGW Marker Gothic', author: 'LXGW', category: '手寫・楷體',
    description: '像麥克筆寫下的手感，適合短句與醒目標題。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/aaronbell/LxgwMarkerGothic', downloadUrl: 'https://fonts.google.com/specimen/LXGW+Marker+Gothic',
    license: 'OFL-1.1', licensePath: 'licenses/lxgw-marker-gothic.txt', loader: { kind: 'google', family: 'LXGW Marker Gothic', axis: '' },
  },
  {
    id: 'lxgw-wenkai-mono-tc', name: '霞鶩文楷等寬 TC', englishName: 'LXGW WenKai Mono TC', author: 'LXGW', category: '等寬',
    description: '文楷筆意搭配等寬節奏，適合程式與逐欄比較。', weights: [300,400,700], defaultWeight: 400,
    sourceUrl: 'https://github.com/aaronbell/LxgwWenkaiTC', downloadUrl: 'https://fonts.google.com/specimen/LXGW+WenKai+Mono+TC',
    license: 'OFL-1.1', licensePath: 'licenses/lxgw-wenkai-mono-tc.txt', loader: { kind: 'google', family: 'LXGW WenKai Mono TC', axis: ':wght@300;400;700' },
  },
  {
    id: 'noto-sans-hk', name: '思源黑體 HK', englishName: 'Noto Sans HK', author: 'Google / Adobe', category: '黑體',
    description: '香港地區字形版本的思源黑體，提供清楚俐落的閱讀感。', weights: [100,200,300,400,500,600,700,800,900], defaultWeight: 400,
    sourceUrl: 'https://github.com/notofonts/noto-cjk', downloadUrl: 'https://fonts.google.com/specimen/Noto+Sans+HK',
    license: 'OFL-1.1', licensePath: 'licenses/noto-sans-hk.txt', loader: { kind: 'google', family: 'Noto Sans HK', axis: ':wght@100..900' },
  },
  {
    id: 'noto-serif-hk', name: '思源宋體 HK', englishName: 'Noto Serif HK', author: 'Google / Adobe', category: '明體',
    description: '香港地區字形版本的思源宋體，筆畫對比適合長文與標題。', weights: [200,300,400,500,600,700,800,900], defaultWeight: 400,
    sourceUrl: 'https://github.com/notofonts/noto-cjk', downloadUrl: 'https://fonts.google.com/specimen/Noto+Serif+HK',
    license: 'OFL-1.1', licensePath: 'licenses/noto-serif-hk.txt', loader: { kind: 'google', family: 'Noto Serif HK', axis: ':wght@200..900' },
  },
  {
    id: 'uoqmunthenkhung', name: '宇文天穹', englishName: 'UoqMunThenKhung', author: 'Moonlit Owen', category: '手寫・楷體',
    description: '筆意流動、明暗分明，為標題添一點書卷氣。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/MoonlitOwen/ThenKhung', downloadUrl: 'https://fonts.google.com/specimen/UoqMunThenKhung',
    license: 'OFL-1.1', licensePath: 'licenses/uoqmunthenkhung.txt', loader: { kind: 'google', family: 'UoqMunThenKhung', axis: '' },
  },
  {
    id: 'wdxl-lubrifont-tc', name: 'WD-XL 滑石體 TC', englishName: 'WDXL Lubrifont TC', author: 'NightFurySL2001', category: '標題字',
    description: '帶復古招牌氣息的展示字，適合短標與大字排版。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/NightFurySL2001/WD-XL-font', downloadUrl: 'https://fonts.google.com/specimen/WDXL+Lubrifont+TC',
    license: 'OFL-1.1', licensePath: 'licenses/wdxl-lubrifont-tc.txt', loader: { kind: 'google', family: 'WDXL Lubrifont TC', axis: '' },
  },
  {
    id: 'taipei-sans-tc', name: '台北黑體', englishName: 'Taipei Sans TC Beta', author: '臺北市政府資訊局 / JT Foundry', category: '黑體',
    description: '從熟悉的思源黑體出發，字面寬鬆，帶有活字印刷的沉著感。', weights: [300, 400, 700], defaultWeight: 400,
    sourceUrl: 'https://sites.google.com/view/jtfoundry/zh-tw/downloads', downloadUrl: 'https://sites.google.com/view/jtfoundry/zh-tw/downloads',
    license: 'OFL-1.1', licensePath: 'licenses/taipei-sans-tc.txt',
    loader: { kind: 'stylesheet', family: 'Taipei Sans TC', stylesheet: {
      300: 'https://cdn.jsdelivr.net/npm/@vp-tw/cjk-web-fonts-taipei-sans-tc@0.0.1/dist/Light/Taipei-Sans-TC.css',
      400: 'https://cdn.jsdelivr.net/npm/@vp-tw/cjk-web-fonts-taipei-sans-tc@0.0.1/dist/Regular/Taipei-Sans-TC.css',
      700: 'https://cdn.jsdelivr.net/npm/@vp-tw/cjk-web-fonts-taipei-sans-tc@0.0.1/dist/Bold/Taipei-Sans-TC.css',
    } },
  },
  {
    id: 'welai-glow-sans-tc-normal', name: '未來熒黑 TC・標準', englishName: 'Wêlai Glow Sans TC Normal', author: 'Project Wêlai', category: '黑體',
    description: '以筆畫變化打造較放鬆的字面，標準字寬，適合介面與正文。', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/welai/glow-sans', downloadUrl: 'https://github.com/welai/glow-sans/releases',
    license: 'OFL-1.1', licensePath: 'licenses/welai-glow-sans-tc.txt',
    loader: { kind: 'stylesheet', family: 'Glow Sans TC', stretch: 'normal', stylesheet: glowSansStylesheets('normal') },
  },
  {
    id: 'welai-glow-sans-tc-compressed', name: '未來熒黑 TC・壓縮', englishName: 'Wêlai Glow Sans TC Compressed', author: 'Project Wêlai', category: '黑體',
    description: '壓縮字寬，適合密集資訊與窄欄標題。', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/welai/glow-sans', downloadUrl: 'https://github.com/welai/glow-sans/releases',
    license: 'OFL-1.1', licensePath: 'licenses/welai-glow-sans-tc.txt',
    loader: { kind: 'stylesheet', family: 'Glow Sans TC', stretch: 'extra-condensed', stylesheet: glowSansStylesheets('compressed') },
  },
  {
    id: 'welai-glow-sans-tc-condensed', name: '未來熒黑 TC・窄', englishName: 'Wêlai Glow Sans TC Condensed', author: 'Project Wêlai', category: '黑體',
    description: '比標準字面更窄，保留清楚的筆畫節奏。', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/welai/glow-sans', downloadUrl: 'https://github.com/welai/glow-sans/releases',
    license: 'OFL-1.1', licensePath: 'licenses/welai-glow-sans-tc.txt',
    loader: { kind: 'stylesheet', family: 'Glow Sans TC', stretch: 'condensed', stylesheet: glowSansStylesheets('condensed') },
  },
  {
    id: 'welai-glow-sans-tc-extended', name: '未來熒黑 TC・寬', englishName: 'Wêlai Glow Sans TC Extended', author: 'Project Wêlai', category: '黑體',
    description: '加寬字面，讓標題與短句更舒展。', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/welai/glow-sans', downloadUrl: 'https://github.com/welai/glow-sans/releases',
    license: 'OFL-1.1', licensePath: 'licenses/welai-glow-sans-tc.txt',
    loader: { kind: 'stylesheet', family: 'Glow Sans TC', stretch: 'expanded', stylesheet: glowSansStylesheets('extended') },
  },
  {
    id: 'welai-glow-sans-tc-wide', name: '未來熒黑 TC・加寬', englishName: 'Wêlai Glow Sans TC Wide', author: 'Project Wêlai', category: '黑體',
    description: '大幅加寬字面，適合展示字與短標。', weights: [100, 200, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/welai/glow-sans', downloadUrl: 'https://github.com/welai/glow-sans/releases',
    license: 'OFL-1.1', licensePath: 'licenses/welai-glow-sans-tc.txt',
    loader: { kind: 'stylesheet', family: 'Glow Sans TC', stretch: 'extra-expanded', stylesheet: glowSansStylesheets('wide') },
  },
  {
    id: 'fusion-pixel-12-mono', name: '融合像素體 12px 等寬', englishName: 'Fusion Pixel 12px Monospaced', author: 'TakWolf 與貢獻者', category: '等寬',
    description: '以臺灣繁中字形繪製的像素字，適合遊戲介面與復古風格。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/TakWolf/fusion-pixel-font', downloadUrl: 'https://github.com/TakWolf/fusion-pixel-font/releases',
    license: 'OFL-1.1', licensePath: 'licenses/fusion-pixel.txt',
    loader: { kind: 'stylesheet', family: 'Fusion Pixel 12px Monospaced Traditional Chinese', stylesheet: 'https://cdn.jsdelivr.net/npm/@vp-tw/cjk-web-fonts-fusion-pixel-font@0.0.1/dist/12px/monospaced/zh_hant/Fusion-Pixel-12px-Monospaced-Traditional-Chinese.css' },
  },
  {
    id: 'fusion-pixel-12-proportional', name: '融合像素體 12px 比例', englishName: 'Fusion Pixel 12px Proportional', author: 'TakWolf 與貢獻者', category: '標題字',
    description: '保留像素筆觸，標點與拉丁字母採比例寬度。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/TakWolf/fusion-pixel-font', downloadUrl: 'https://github.com/TakWolf/fusion-pixel-font/releases',
    license: 'OFL-1.1', licensePath: 'licenses/fusion-pixel.txt',
    loader: { kind: 'stylesheet', family: 'Fusion Pixel 12px Proportional Traditional Chinese', stylesheet: 'https://cdn.jsdelivr.net/npm/@vp-tw/cjk-web-fonts-fusion-pixel-font@0.0.1/dist/12px/proportional/zh_hant/Fusion-Pixel-12px-Proportional-Traditional-Chinese.css' },
  },
  {
    id: 'genki-mincho-tc', name: '源起明體 TC', englishName: 'GenKi Mincho TC', author: 'But Ko / ButTaiwan', category: '明體',
    description: '在明體筆畫交接處作斷筆處理，呈現新式活字的留白。', weights: [200, 300, 400, 500, 600, 700, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/ButTaiwan/genyo-font', downloadUrl: 'https://github.com/ButTaiwan/genyo-font/releases',
    license: 'OFL-1.1', licensePath: 'licenses/genyo-font-ofl.txt',
    loader: { kind: 'stylesheet', family: 'GenKiMin2TC', stylesheet: 'https://cdn.jsdelivr.net/npm/@free-fonts/genki-mincho@1.0.1/genki-mincho.css' },
  },
  {
    id: 'genyo-mincho-tc', name: '源樣明體 TC', englishName: 'GenYo Mincho TC', author: 'But Ko / ButTaiwan', category: '明體',
    description: '沿用傳統活字筆意，轉折俐落，適合文章與編輯排版。', weights: [200, 300, 400, 500, 600, 700, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/ButTaiwan/genyo-font', downloadUrl: 'https://github.com/ButTaiwan/genyo-font/releases',
    license: 'OFL-1.1', licensePath: 'licenses/genyo-font-ofl.txt',
    loader: { kind: 'stylesheet', family: 'GenYoMin2TC', stylesheet: 'https://cdn.jsdelivr.net/npm/@free-fonts/genyo-mincho@1.0.1/genyo-mincho.css' },
  },
  {
    id: 'tw-sung', name: '全字庫正宋體', englishName: 'TW-Sung', author: '數位發展部 CNS11643 全字庫', category: '明體',
    description: '臺灣 CNS11643 標準字形與完整字庫，收錄罕用字及擴充漢字。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://www.cns11643.gov.tw/', downloadUrl: 'https://data.gov.tw/dataset/5961',
    license: 'OFL-1.1', licensePath: 'licenses/tw-sung.txt',
    loader: { kind: 'stylesheet', family: 'TW-Sung', stylesheet: 'https://cdn.jsdelivr.net/npm/@free-fonts/tw-sung@1.0.0/tw-sung.css' },
  },
  {
    id: 'tw-kai', name: '全字庫正楷體', englishName: 'TW-Kai', author: '數位發展部 CNS11643 全字庫', category: '手寫・楷體',
    description: '以臺灣標準字形繪製的正楷字庫，也能預覽不少罕見漢字。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://www.cns11643.gov.tw/', downloadUrl: 'https://data.gov.tw/dataset/5961',
    license: 'OFL-1.1', licensePath: 'licenses/tw-kai.txt',
    loader: { kind: 'stylesheet', family: 'TW-Kai', stylesheet: 'https://cdn.jsdelivr.net/npm/@free-fonts/tw-kai@1.0.0/tw-kai.css' },
  },
  {
    id: 'genyo-gothic-tc', name: '源樣黑體 TC', englishName: 'GenYo Gothic TC', author: 'But Ko / ButTaiwan', category: '黑體',
    description: '延續傳統印刷字形的黑體版本，骨架清楚、筆畫端正。', weights: [250, 300, 350, 400, 500, 700, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/ButTaiwan/genyog-font', downloadUrl: 'https://github.com/ButTaiwan/genyog-font/releases',
    license: 'OFL-1.1', licensePath: 'licenses/genyog-font-ofl.txt',
    loader: { kind: 'stylesheet', family: 'GenYo Gothic TC', stylesheet: hanziProWeightStylesheets('genyo-gothic-tc', [250, 300, 350, 400, 500, 700, 900]) },
  },
  {
    id: 'genki-gothic-tc', name: '源起黑體 TC', englishName: 'Genki Gothic TC', author: 'But Ko / ButTaiwan', category: '黑體',
    description: '黑體筆畫帶有斷筆留白，為熟悉的結構添上活字感。', weights: [250, 300, 400, 500, 700, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/ButTaiwan/genyog-font', downloadUrl: 'https://github.com/ButTaiwan/genyog-font/releases',
    license: 'OFL-1.1', licensePath: 'licenses/genyog-font-ofl.txt',
    loader: { kind: 'stylesheet', family: 'Genki Gothic TC', stylesheet: hanziProWeightStylesheets('genki-gothic-tc', [250, 300, 400, 500, 700, 900]) },
  },
  {
    id: 'shanggu-serif-tc', name: '尙古明體 TC', englishName: 'Shanggu Serif TC', author: 'GuiWonder / Shanggu', category: '明體',
    description: '基於思源明體的傳承字形設計，呈現古典印刷字形差異。', weights: [250, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/GuiWonder/Shanggu', downloadUrl: 'https://github.com/GuiWonder/Shanggu/releases',
    license: 'OFL-1.1', licensePath: 'licenses/shanggu-tc.txt',
    loader: { kind: 'stylesheet', family: 'Shanggu Serif TC', stylesheet: 'https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-serif-tc@0.1.0/swap.css' },
  },
  {
    id: 'shanggu-sans-tc', name: '尙古黑體 TC', englishName: 'Shanggu Sans TC', author: 'GuiWonder / Shanggu', category: '黑體',
    description: '傳承字形黑體，字形骨架沉穩，標點採繁體中文版本。', weights: [250, 300, 400, 500, 600, 700, 800, 900], defaultWeight: 400,
    sourceUrl: 'https://github.com/GuiWonder/Shanggu', downloadUrl: 'https://github.com/GuiWonder/Shanggu/releases',
    license: 'OFL-1.1', licensePath: 'licenses/shanggu-tc.txt',
    loader: { kind: 'stylesheet', family: 'Shanggu Sans TC', stylesheet: 'https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-shanggu-sans-tc@0.1.0/swap.css' },
  },
];

const secondExpansion: CatalogEntry[] = [
  {
    id: 'line-seed-tw', name: 'LINE Seed TW', englishName: 'LINE Seed 繁體中文版', author: 'LY Corporation／華康字型', category: '黑體',
    description: '柔和的圓角與均衡的中英比例，適合介面與混排。', defaultWeight: 400,
    sourceUrl: 'https://seed.line.me/index_tw.html', downloadUrl: 'https://seed.line.me/src/images/fonts/LINE_Seed_TW.zip',
    license: 'OFL-1.1', licensePath: 'licenses/line-seed-tw.txt', ...localFont('line-seed-tw', 'LINE Seed TW_OTF'),
  },
  {
    id: 'taiwanpearl', name: '台灣圓體', englishName: 'TaiwanPearl', author: 'Max／姚春宇', category: '圓體',
    description: '柔和圓角保留「辶、糸、草」等臺灣習慣筆形。', defaultWeight: 400,
    sourceUrl: 'https://github.com/max32002/TaiwanPearl', downloadUrl: 'https://github.com/max32002/TaiwanPearl#下載字型',
    license: 'OFL-1.1', licensePath: 'licenses/taiwanpearl.txt', ...localFont('taiwanpearl', 'TaiwanPearl'),
  },
  {
    id: 'tauhu-oo', name: '豆腐烏', englishName: 'Tauhu Oo 20.05', author: '莊炳元／再會豆腐字', category: '黑體',
    description: '支援臺語等本土語言的漢字與羅馬字，適合混合排版。', defaultWeight: 400,
    sourceUrl: 'https://tauhu.tw/ji-hing/', downloadUrl: 'https://github.com/tauhu-tw/tauhu-oo',
    license: 'OFL-1.1', licensePath: 'licenses/tauhu-oo.txt', ...localFont('tauhu-oo', 'Tauhu Oo 20.05'),
  },
  {
    id: 'genryu-mincho-tw', name: '源流明體月 TW', englishName: 'GenRyu Mincho TW', author: 'But Ko／ButTaiwan', category: '明體',
    description: '臺灣通俗字形搭配俐落襯線，筆畫起收帶出印刷節奏。', defaultWeight: 400,
    sourceUrl: 'https://github.com/ButTaiwan/genryu-font', downloadUrl: 'https://github.com/ButTaiwan/genryu-font/releases/tag/v2.100',
    license: 'OFL-1.1', licensePath: 'licenses/genryu-mincho-tw.txt', ...localFont('genryu-mincho-tw', 'GenRyuMin2 TW'),
  },
  ...([
    [1, '圓潤', '線條圓潤，像一張隨手寫下的便條。'],
    [2, '秀氣', '筆畫秀氣，適合輕盈的故事標題和短句。'],
    [4, 'POP', '接近手繪 POP 招牌的節奏，適合醒目短標題。'],
    [5, '行楷', '行楷的筆意與手寫節奏，適合落款和書信。'],
  ] as const).map(([number, style, description]): CatalogEntry => ({
    id: `jason-handwriting-${number}`, name: `清松手寫體 ${number} 號`, englishName: `${style}・Jason Handwriting ${number}`,
    author: '游清松', category: '手寫・楷體', description, defaultWeight: 400,
    sourceUrl: 'https://github.com/jasonhandwriting/JasonHandwriting',
    downloadUrl: `https://github.com/jasonhandwriting/JasonHandwriting/blob/e488583c07077850aa4a2a6280baa20374cccde2/JasonHandwriting${number}.ttf`,
    license: 'OFL-1.1', licensePath: 'licenses/jason-handwriting.txt', ...localFont(`jason-handwriting-${number}`, `JasonHandwriting${number}`),
  })),
];

const thirdExpansion: CatalogEntry[] = [
  {
    id: 'ibm-plex-sans-tc', name: 'IBM Plex Sans TC', englishName: 'IBM Plex Sans・繁體中文版', author: 'IBM', category: '黑體',
    description: '適合介面和中英數混排，標準與粗體可用於區分內文和標題。', weights: [400, 700], defaultWeight: 400,
    sourceUrl: 'https://github.com/IBM/plex', downloadUrl: 'https://github.com/IBM/plex/releases/tag/@ibm%2Fplex-sans-tc@1.1.1',
    license: 'OFL-1.1', licensePath: 'licenses/ibm-plex-sans-tc.txt',
    loader: { kind: 'stylesheet', family: 'IBM Plex Sans TC', stylesheet: {
      400: 'https://cdn.jsdelivr.net/npm/@ibm/plex-sans-tc@1.1.1/fonts/split/woff2/hinted/IBMPlexSansTC-Regular.css',
      700: 'https://cdn.jsdelivr.net/npm/@ibm/plex-sans-tc@1.1.1/fonts/split/woff2/hinted/IBMPlexSansTC-Bold.css',
    } },
  },
  {
    id: 'pop-gothic-tc', name: '大波浪圓體 TC', englishName: 'Pop Gothic CJK TC', author: 'Max／姚春宇', category: '圓體',
    description: '圓潤的手繪筆形適合活動標題和包裝。部分漢字保留日式筆形。', defaultWeight: 400,
    sourceUrl: 'https://github.com/max32002/pop-gothic', downloadUrl: 'https://github.com/max32002/pop-gothic/blob/2.143/CJK%20TC/PopGothicCjkTc-Regular.ttf',
    license: 'OFL-1.1', licensePath: 'licenses/pop-gothic-tc.txt', ...localFont('pop-gothic-tc', 'Pop Gothic CJK TC'),
  },
  {
    id: 'bailu-kai', name: '白鷺楷', englishName: 'BailuKai Medium', author: 'Hu Yen-Chuan／huthief', category: '手寫・楷體',
    description: '以原俠正楷增粗而成的中等字重楷體，適合小標、圖說與橫排。', defaultWeight: 500,
    sourceUrl: 'https://github.com/huthief/BailuKai', downloadUrl: 'https://github.com/huthief/BailuKai/releases/download/20261012/BailuKai-Medium.ttf',
    license: 'OFL-1.1', licensePath: 'licenses/bailu-kai.txt', ...localFont('bailu-kai', 'BailuKai'),
  },
  {
    id: 'jason-handwriting-9', name: '清松手寫體 9 號', englishName: '文青・Jason Handwriting 9', author: '游清松', category: '手寫・楷體',
    description: '作者稱為文青款，適合生活短文與手寫標題。', defaultWeight: 400,
    sourceUrl: 'https://github.com/jasonhandwriting/JasonHandwriting',
    downloadUrl: 'https://github.com/jasonhandwriting/JasonHandwriting/blob/5e30a59f8630be45661ca07ec19d7649a33fb598/JasonHandwriting9.ttf',
    license: 'OFL-1.1', licensePath: 'licenses/jason-handwriting.txt', ...localFont('jason-handwriting-9', 'JasonHandwriting9'),
  },
  {
    id: 'nani-font', name: '何某手寫體', englishName: 'NaniFont', author: 'Max／姚春宇', category: '手寫・楷體',
    description: '保留日系手寫的筆觸並補入常用中文字，適合短句與社群圖文。', defaultWeight: 400,
    sourceUrl: 'https://github.com/max32002/nanifont', downloadUrl: 'https://github.com/max32002/nanifont/blob/1.046/ttf/NaniFont-Regular.ttf',
    license: 'OFL-1.1', licensePath: 'licenses/nani-font.txt', ...localFont('nani-font', 'NaniFont'),
  },
  {
    id: 'swei-3t-sans-tc', name: '獅尾三角黑體 TC', englishName: 'Swei 3T Sans CJK TC', author: 'Max／姚春宇', category: '標題字',
    description: '以思源黑體為底，將部分平直筆端改成三角造形。', defaultWeight: 400,
    sourceUrl: 'https://github.com/max32002/swei-3t-sans', downloadUrl: 'https://github.com/max32002/swei-3t-sans/blob/2.129/CJK%20TC/Swei3TSansCJKtc-Regular.ttf',
    license: 'OFL-1.1', licensePath: 'licenses/swei-3t-sans-tc.txt', ...localFont('swei-3t-sans-tc', 'Swei 3T Sans CJK TC'),
  },
  {
    id: 'genseki-gothic-tw', name: '源石黑體月 TW', englishName: 'GenSeki Gothic TW', author: 'But Ko／ButTaiwan', category: '黑體',
    description: '重現早期鉛字黑體較硬朗的筆形，也收錄臺語與客語用字。', defaultWeight: 400,
    sourceUrl: 'https://github.com/ButTaiwan/genseki-font', downloadUrl: 'https://github.com/ButTaiwan/genseki-font/releases/tag/v2.100',
    license: 'OFL-1.1', licensePath: 'licenses/genseki-gothic-tw.txt', ...localFont('genseki-gothic-tw', 'GenSekiGothic2 TW'),
  },
];

const catalogBatches = [
  { addedAt: '2026-11-17T22:11:26+08:00', entries: launchFonts },
  { addedAt: '2026-11-18T13:26:59+08:00', entries: firstExpansion },
  { addedAt: '2026-11-18T23:30:57+08:00', entries: secondExpansion },
  { addedAt: '2026-11-21T10:52:15+08:00', entries: thirdExpansion },
];

export const fonts: FontDefinition[] = catalogBatches.flatMap(({ addedAt, entries }) =>
  entries.map(font => ({ ...font, addedAt })),
);

function glowSansStylesheets(width: 'normal' | 'compressed' | 'condensed' | 'extended' | 'wide') {
  const weights: Record<number, string> = {
    100: 'Thin', 200: 'ExtraLight', 300: 'Light', 400: 'Regular', 500: 'Book',
    600: 'Medium', 700: 'Bold', 800: 'ExtraBold', 900: 'Heavy',
  };
  return Object.fromEntries(Object.entries(weights).map(([weight, directory]) => [Number(weight),
    `https://cdn.jsdelivr.net/npm/@vp-tw/cjk-web-fonts-glow-sans-tc-${width}@0.0.1/dist/${directory}/Glow-Sans-TC.css`,
  ]));
}

function hanziProWeightStylesheets(font: string, weights: number[]) {
  return Object.fromEntries(weights.map(weight => [weight,
    `https://cdn.jsdelivr.net/npm/@hanzi.pro/webfonts-${font}@0.1.0/swap/${weight}.css`,
  ]));
}

export const fontById = new Map(fonts.map(font => [font.id, font]));
export const fontFamily = (font: FontDefinition) => font.loader.family;
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
