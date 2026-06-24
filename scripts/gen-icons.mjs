// Gera os ícones PWA do Construfácil (PNG) sem dependências externas.
// Desenha o logo da marca (casa de construção) em laranja, com supersampling
// para bordas suaves. Rode com: node scripts/gen-icons.mjs
import { deflateSync } from "node:zlib";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "public", "icons");

// ---- CRC32 / PNG encoder ----
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}
function encodePNG(width, height, rgba) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  // filter byte 0 per row
  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const idat = deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk("IHDR", ihdr),
    chunk("IDAT", idat),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// ---- Desenho ----
const ORANGE = [249, 115, 22]; // #f97316
const ORANGE_DARK = [234, 88, 12]; // #ea580c
const WHITE = [255, 255, 255];

function pointInTri(px, py, a, b, c) {
  const d1 = (px - b[0]) * (a[1] - b[1]) - (a[0] - b[0]) * (py - b[1]);
  const d2 = (px - c[0]) * (b[1] - c[1]) - (b[0] - c[0]) * (py - c[1]);
  const d3 = (px - a[0]) * (c[1] - a[1]) - (c[0] - a[0]) * (py - a[1]);
  const neg = d1 < 0 || d2 < 0 || d3 < 0;
  const pos = d1 > 0 || d2 > 0 || d3 > 0;
  return !(neg && pos);
}

// cor de um ponto normalizado (u,v em 0..1). maskable = preenche todo o quadrado.
function colorAt(u, v, maskable) {
  // fundo: quadrado (maskable) ou rounded-rect (any)
  let bg = null;
  if (maskable) {
    bg = true;
  } else {
    const r = 0.22; // raio dos cantos
    const cx = Math.min(Math.max(u, r), 1 - r);
    const cy = Math.min(Math.max(v, r), 1 - r);
    const dx = u - cx;
    const dy = v - cy;
    bg = dx * dx + dy * dy <= r * r;
  }
  if (!bg) return [0, 0, 0, 0];

  // gradiente vertical laranja
  const t = Math.min(1, Math.max(0, v));
  const base = [
    Math.round(ORANGE[0] + (ORANGE_DARK[0] - ORANGE[0]) * t),
    Math.round(ORANGE[1] + (ORANGE_DARK[1] - ORANGE[1]) * t),
    Math.round(ORANGE[2] + (ORANGE_DARK[2] - ORANGE[2]) * t),
    255,
  ];

  // casa branca: telhado (triângulo) + corpo (retângulo), com porta recortada
  const apex = [0.5, 0.24];
  const left = [0.2, 0.52];
  const right = [0.8, 0.52];
  const inRoof = pointInTri(u, v, apex, left, right);
  const inBody = u >= 0.3 && u <= 0.7 && v >= 0.5 && v <= 0.78;
  const inDoor = u >= 0.44 && u <= 0.56 && v >= 0.6 && v <= 0.78;

  if ((inRoof || inBody) && !inDoor) return [...WHITE, 255];
  return base;
}

function render(size, maskable) {
  const SS = 4; // supersampling
  const rgba = Buffer.alloc(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let r = 0, g = 0, b = 0, a = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const u = (x + (sx + 0.5) / SS) / size;
          const v = (y + (sy + 0.5) / SS) / size;
          const c = colorAt(u, v, maskable);
          // pré-multiplica alpha para média correta nas bordas
          const af = c[3] / 255;
          r += c[0] * af;
          g += c[1] * af;
          b += c[2] * af;
          a += c[3];
        }
      }
      const n = SS * SS;
      const af = a / n / 255;
      const idx = (y * size + x) * 4;
      rgba[idx] = af > 0 ? Math.round(r / n / af) : 0;
      rgba[idx + 1] = af > 0 ? Math.round(g / n / af) : 0;
      rgba[idx + 2] = af > 0 ? Math.round(b / n / af) : 0;
      rgba[idx + 3] = Math.round(a / n);
    }
  }
  return encodePNG(size, size, rgba);
}

const alvos = [
  { nome: "icon-192.png", size: 192, maskable: false },
  { nome: "icon-512.png", size: 512, maskable: false },
  { nome: "icon-maskable-512.png", size: 512, maskable: true },
  { nome: "apple-touch-icon.png", size: 180, maskable: true },
  { nome: "favicon-32.png", size: 32, maskable: false },
];

for (const a of alvos) {
  writeFileSync(join(OUT, a.nome), render(a.size, a.maskable));
  console.log("gerado:", a.nome, `(${a.size}px${a.maskable ? ", maskable" : ""})`);
}
console.log("ok");
