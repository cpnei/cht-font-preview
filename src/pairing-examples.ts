export const pairingExamples = [
  {
    name: '品牌與文化網站',
    description: '用明體大標帶出風格，黑體內文維持清楚。',
    heading: { fontId: 'noto-serif-tc', weight: 600, label: '思源宋體 600' },
    body: { fontId: 'noto-sans-tc', weight: 400, label: '思源黑體 400' },
  },
  {
    name: '書刊與長文',
    description: '用粗黑體標出章節，明體正文保留書刊的閱讀節奏。',
    heading: { fontId: 'noto-sans-tc', weight: 700, label: '思源黑體 700' },
    body: { fontId: 'noto-serif-tc', weight: 400, label: '思源宋體 400' },
  },
  {
    name: '產品介面',
    description: '標題與內文用同款黑體，靠字重區分層級。',
    heading: { fontId: 'noto-sans-tc', weight: 700, label: '思源黑體 700' },
    body: { fontId: 'noto-sans-tc', weight: 400, label: '思源黑體 400' },
  },
] as const;
