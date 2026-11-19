import { assetUrl, fontById, type FontDefinition } from './fonts.ts';
import sample from './pairing-sample.json' with { type: 'json' };

export const pairingRoles = ['heading', 'body'] as const;
export type PairingRole = typeof pairingRoles[number];
export const pairingTextLimits = { heading: 80, body: 400 };
export interface PairingChoice { font: FontDefinition; weight: number; text: string }
export type Pairing = Record<PairingRole, PairingChoice>;

const version = 1;
const fragment = '#pairing?';
export const maxShareUrlLength = 2000;
export const maxShareFileSize = 16 * 1024;

function fontSpec({ font, weight, text }: PairingChoice, includeText: boolean) {
  const source = font.loader;
  const webFont = source.kind === 'local'
    ? { family: source.family, woff2Url: new URL(assetUrl(source.files[weight].path), location.href).href }
    : source.kind === 'stylesheet'
      ? { family: source.family, stylesheetUrl: typeof source.stylesheet === 'string' ? source.stylesheet : source.stylesheet[weight] }
      : { family: source.family, stylesheetUrl: 'https://fonts.googleapis.com/css2?' + new URLSearchParams({
          family: source.family + source.axis, display: 'swap',
        }) };

  return {
    fontId: font.id,
    name: font.name,
    fontFamily: source.kind === 'local' ? source.originalFamily : source.family,
    fontWeight: weight,
    ...(source.kind === 'stylesheet' && source.stretch ? { fontStretch: source.stretch } : {}),
    sourceUrl: font.sourceUrl,
    downloadUrl: font.downloadUrl,
    license: font.license,
    licenseUrl: new URL(assetUrl(font.licensePath), location.href).href,
    webFont,
    ...(includeText ? { text } : {}),
  };
}

export function pairingSpec(pairing: Pairing, includeText: boolean) {
  return JSON.stringify({
    version,
    heading: fontSpec(pairing.heading, includeText),
    body: fontSpec(pairing.body, includeText),
  }, null, 2);
}

export function pairingUrl(pairing: Pairing, includeText: boolean) {
  const url = new URL(assetUrl(''), location.href);
  const params = new URLSearchParams({ v: String(version) });
  for (const role of pairingRoles) {
    const choice = pairing[role];
    params.set(role, choice.font.id);
    params.set(role + 'Weight', String(choice.weight));
    if (includeText) params.set(role + 'Text', choice.text);
  }
  url.hash = fragment + params;
  return url.href;
}

function readChoice(value: unknown, role: PairingRole): PairingChoice {
  if (!value || typeof value !== 'object') throw new Error();
  const { fontId, fontWeight, text } = value as Record<string, unknown>;
  const font = typeof fontId === 'string' ? fontById.get(fontId) : undefined;
  if (!font || typeof fontWeight !== 'number' || !font.weights.includes(fontWeight)) throw new Error();
  if (text !== undefined && (typeof text !== 'string' || text.length > pairingTextLimits[role]
    || (role === 'heading' && /[\r\n]/.test(text)))) throw new Error();
  return { font, weight: fontWeight, text: text ?? sample[role] };
}

export function readPairingSpec(value: unknown): Pairing {
  if (!value || typeof value !== 'object') throw new Error();
  const spec = value as Record<string, unknown>;
  if (spec.version !== version) throw new Error();
  return { heading: readChoice(spec.heading, 'heading'), body: readChoice(spec.body, 'body') };
}

export function readPairingUrl(hash: string): Pairing | undefined {
  if (!hash.startsWith(fragment)) return;
  if (hash.length > maxShareUrlLength) throw new Error();
  const params = new URLSearchParams(hash.slice(fragment.length));
  const choice = (role: PairingRole) => ({
    fontId: params.get(role),
    fontWeight: Number(params.get(role + 'Weight')),
    text: params.get(role + 'Text') ?? undefined,
  });
  return readPairingSpec({ version: Number(params.get('v')), heading: choice('heading'), body: choice('body') });
}
