import { categories, type FontDefinition } from './fonts.ts';

export type CatalogSort = 'auto' | 'newest' | 'name';

const names = new Intl.Collator('zh-Hant-TW-u-co-stroke', {
  numeric: true,
  sensitivity: 'base',
});

export function normalizeSearch(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/gu, ' ').toLocaleLowerCase('zh-Hant-TW');
}

export function searchRank(font: FontDefinition, term: string) {
  if (!term) return 0;
  const fields = [font.name, font.englishName].map(normalizeSearch);
  if (fields.includes(term)) return 0;
  if (fields.some(field => field.startsWith(term))) return 1;
  if (fields.some(field => field.includes(term))) return 2;
  return [...fields, normalizeSearch(font.author)].join(' ').includes(term) ? 3 : -1;
}

function compareNames(left: FontDefinition, right: FontDefinition) {
  return names.compare(left.name, right.name) || names.compare(left.id, right.id);
}

function compareCategories(left: FontDefinition, right: FontDefinition) {
  return categories.indexOf(left.category) - categories.indexOf(right.category) || compareNames(left, right);
}

export function orderedFonts(fonts: readonly FontDefinition[], sort: CatalogSort = 'auto', query = '') {
  const term = normalizeSearch(query);
  return [...fonts].sort((left, right) => {
    if (sort === 'newest') return Date.parse(right.addedAt) - Date.parse(left.addedAt) || compareCategories(left, right);
    if (sort === 'name') return compareNames(left, right);
    return searchRank(left, term) - searchRank(right, term) || compareCategories(left, right);
  });
}
