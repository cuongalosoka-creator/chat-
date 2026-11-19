import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) {
      c = (c >>> 1) ^ (c & 1 ? 0xedb88320 : 0);
    }
  }
  return (c ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const combined = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(combined), 0);
  return Buffer.concat([len, combined, crcBuf]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const stride = width * 4 + 1;
  const raw = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    raw[y * stride] = 0; // filter None
    rgba.copy(raw, y * stride + 1, y * width * 4, (y + 1) * width * 4);
  }
  const compressed = zlib.deflateSync(raw, {level: 9});

  return Buffer.concat([
    signature,
    makeChunk('IHDR', ihdr),
    makeChunk('IDAT', compressed),
    makeChunk('IEND', Buffer.alloc(0)),
  ]);
}

function distToRoundedRect(x, y, rx, ry, rw, rh, radius) {
  const cx = rx + rw / 2;
  const cy = ry + rh / 2;
  const hx = rw / 2 - radius;
  const hy = rh / 2 - radius;
  const dx = Math.max(Math.abs(x - cx) - hx, 0);
  const dy = Math.max(Math.abs(y - cy) - hy, 0);
  return Math.hypot(dx, dy) - radius;
}

function renderIcon(size, maskable = false) {
  const rgba = Buffer.alloc(size * size * 4);
  const scale = size / 512;
  const innerScale = maskable ? 0.72 : 0.92;
  const offset = (size * (1 - innerScale)) / 2;

  // Emerald #059669 = (5, 150, 105)
  const bgR = 5, bgG = 150, bgB = 105;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;
      let r = bgR, g = bgG, b = bgB, a = 255;

      if (!maskable) {
        const bgDist = distToRoundedRect(x, y, 0, 0, size, size, 112 * scale);
        if (bgDist > 0.75) {
          a = 0;
        } else if (bgDist > -0.75) {
          a = Math.round(255 * (0.75 - bgDist) / 1.5);
        }
      }

      // Map pixel into 512x512 inner coordinate space
      const lx = (x - offset) / (scale * innerScale);
      const ly = (y - offset) / (scale * innerScale);

      // Chat bubble body + tail
      const inBubble = distToRoundedRect(lx, ly, 128, 124, 256, 208, 46) <= 0;
      const inTail =
        lx >= 156 &&
        lx <= 228 &&
        ly >= 312 &&
        ly <= 384 &&
        ly - 312 <= (228 - lx) * 0.95 &&
        lx >= 156;

      if (inBubble || inTail) {
        r = 255;
        g = 255;
        b = 255;

        // Three emerald dots inside bubble
        const dots = [196, 256, 316];
        for (const dx of dots) {
          if (Math.hypot(lx - dx, ly - 228) <= 18) {
            r = bgR;
            g = bgG;
            b = bgB;
          }
        }
      }

      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = a;
    }
  }

  return encodePng(size, size, rgba);
}

const outDir = path.resolve('public');
fs.mkdirSync(outDir, {recursive: true});
fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), renderIcon(192, false));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), renderIcon(512, false));
fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), renderIcon(512, true));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), renderIcon(180, true));
console.log('Generated PWA PNG icons in public/');
