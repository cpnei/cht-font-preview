import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const lock = JSON.parse(await readFile(new URL('../assets.lock.json', import.meta.url), 'utf8'));
for (const asset of lock.assets) {
  const bytes = await readFile(new URL(`../${asset.path}`, import.meta.url));
  if (bytes.length !== asset.bytes || createHash('sha256').update(bytes).digest('hex') !== asset.sha256) {
    throw new Error(`字型或授權檔驗證失敗：${asset.path}`);
  }
}
console.log(`Verified ${lock.assets.length} original font/license assets.`);
