import { assetUrl, fontById, fontFamily } from './fonts';
import { type FontLoader } from './loader';
import candidates from './hero-fonts.json';
import headline from './site-headline.json';

const loadBudget = 1200;
const sample = headline.lead + headline.end;

export function randomizeHeroFont(heading: HTMLElement, loader: FontLoader) {
  if (!candidates.length) return;
  const observer = new IntersectionObserver(entries => {
    if (!entries.some(entry => entry.isIntersecting)) return;
    observer.disconnect();
    const candidate = candidates[Math.floor(Math.random() * candidates.length)];
    void applyWhenLoaded(candidate);
  });
  observer.observe(heading);

  async function applyWhenLoaded(candidate: typeof candidates[number]) {
    const font = fontById.get(candidate.id)!;
    const deadline = performance.now() + loadBudget;
    const loaded: FontFace[] = [];
    let available = false;
    try {
      if (candidate.faces && candidate.family) {
        const descriptors = { weight: String(candidate.weight), stretch: candidate.stretch };
        loaded.push(...await Promise.all(candidate.faces.map(face => new FontFace(
          candidate.family!, `url("${assetUrl(face.path)}")`,
          { ...descriptors, unicodeRange: face.range },
        ).load())));
        available = true;
      } else {
        await loader.load(font, sample, candidate.weight, false, true);
        available = loader.status(font, sample, candidate.weight, true) === 'ready';
      }
    } catch {
      return;
    }
    if (!available || performance.now() >= deadline) return;
    for (const face of loaded) document.fonts.add(face);
    heading.style.setProperty('--hero-family', `"${candidate.family ?? fontFamily(font)}", var(--site-heading-font)`);
    heading.style.setProperty('--hero-weight', String(candidate.weight));
    if (candidate.stretch) heading.style.setProperty('--hero-stretch', candidate.stretch);
    heading.dataset.heroFont = candidate.id;
  }
}
