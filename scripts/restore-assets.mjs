import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const lock = JSON.parse(await readFile(new URL('../assets.lock.json', import.meta.url), 'utf8'));
for (const asset of lock.assets) {
  const urls = asset.urls ?? [asset.url];
  const sourceParts = [];
  for (const url of urls) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${response.status}: ${url}`);
    sourceParts.push(Buffer.from(await response.arrayBuffer()));
  }
  const bytes = Buffer.concat(sourceParts.flatMap((part, index) => index === 0 ? [part] : [Buffer.from('\n\n'), part]));
  if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) {
    throw new Error(`來源不符合鎖定版本：${asset.path}`);
  }
  const path = fileURLToPath(new URL(`../${asset.path}`, import.meta.url));
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, bytes);
  console.log(`Restored ${asset.path}`);
}
