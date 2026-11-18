export const categories = ['全部字型', '黑體', '明體', '圓體', '手寫・楷體', '標題字'] as const;
export type Category = typeof categories[number];

export interface FontDefinition {
  id: string;
  name: string;
  englishName: string;
  author: string;
  category: Exclude<Category, '全部字型'>;
  description: string;
  weights: number[];
  defaultWeight: number;
  sourceUrl: string;
  downloadUrl: string;
  license: 'OFL-1.1';
  licensePath: string;
  loader: { kind: 'google'; family: string; axis: string } | { kind: 'local'; path: string; bytes: number; preview: { path: string; bytes: number } };
}

export const fonts: FontDefinition[] = [
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
    description: '細細的筆觸，收藏青春裡的每一句呢喃。', weights: [100], defaultWeight: 100,
    sourceUrl: 'https://github.com/Chenyu-otf/chenyuluoyan_thin', downloadUrl: 'https://github.com/Chenyu-otf/chenyuluoyan_thin#下載',
    license: 'OFL-1.1', licensePath: 'licenses/chenyuluoyan.txt', loader: { kind: 'local', path: 'fonts/ChenYuluoyan-2.0-Thin.woff2', bytes: 4809156, preview: { path: 'fonts/ChenYuluoyan-2.0-Thin.preview.woff2', bytes: 41740 } },
  },
  {
    id: 'mantou-sans', name: '饅頭黑體', englishName: 'Mantou Sans', author: 'mant0u0 / Artakana', category: '標題字',
    description: '飽滿、有力，讓想說的話成為目光焦點。', weights: [400], defaultWeight: 400,
    sourceUrl: 'https://github.com/mant0u0/MantouSans', downloadUrl: 'https://github.com/mant0u0/MantouSans#下載與安裝',
    license: 'OFL-1.1', licensePath: 'licenses/mantou-sans.txt', loader: { kind: 'local', path: 'fonts/MantouSans-Regular.woff2', bytes: 1334460, preview: { path: 'fonts/MantouSans-Regular.preview.woff2', bytes: 15096 } },
  },
];

export const fontById = new Map(fonts.map(font => [font.id, font]));
export const fontFamily = (font: FontDefinition) => font.loader.kind === 'google' ? font.loader.family : `preview-${font.id}`;
export const assetUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
