// Generates PNG app icons (no dependencies). Run: node scripts/make-icons.mjs
import fs from 'node:fs';
import zlib from 'node:zlib';

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (buf) => { let c = 0xffffffff; for (const b of buf) c = crcTable[(c ^ b) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
const chunk = (type, data) => {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([len, td, c]);
};
const distSeg = (px, py, ax, ay, bx, by) => {
  const dx = bx - ax, dy = by - ay, t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
};
const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));

function icon(size) {
  const bgA = [77, 116, 105], bgB = [111, 160, 150], cream = [247, 245, 236], apricot = [213, 140, 85];
  const raw = Buffer.alloc((size * 4 + 1) * size);
  const s = size / 512;
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let col = mix(bgA, bgB, (x + y) / (2 * size));
      // apricot disc behind the check
      const dc = Math.hypot(x - 256 * s, y - 256 * s) - 150 * s;
      const disc = Math.max(0, Math.min(1, 0.5 - dc / 1.5));
      col = mix(col, apricot, disc * 0.95);
      // cream check mark
      const d = Math.min(distSeg(x, y, 196 * s, 262 * s, 240 * s, 308 * s), distSeg(x, y, 240 * s, 308 * s, 322 * s, 210 * s)) - 17 * s;
      const a = Math.max(0, Math.min(1, 0.5 - d / 1.5));
      col = mix(col, cream, a);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = col[0]; raw[o + 1] = col[1]; raw[o + 2] = col[2]; raw[o + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync('public/icons', { recursive: true });
fs.writeFileSync('public/icons/icon-192.png', icon(192));
fs.writeFileSync('public/icons/icon-512.png', icon(512));
fs.writeFileSync('public/icons/apple-touch-icon.png', icon(180));
console.log('icons written');
