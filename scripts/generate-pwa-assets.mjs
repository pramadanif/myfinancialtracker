import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const iconsDir = join(publicDir, "icons");
const splashDir = join(publicDir, "splash");

const BRAND = "#0055A4";
const WHITE = "#FFFFFF";

async function iconSvg(size, maskable = false) {
  const padding = maskable ? Math.round(size * 0.12) : 0;
  const inner = size - padding * 2;
  const r = maskable ? 0 : Math.round(inner * 0.22);
  const cx = size / 2;
  const walletW = inner * 0.5;
  const walletH = inner * 0.32;
  const wx = cx - walletW / 2;
  const wy = cx - walletH / 2 + inner * 0.06;
  const stroke = inner * 0.04;
  const snapR = walletH * 0.11;

  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${BRAND}" ${r ? `rx="${r}"` : ""}/>
  <rect x="${wx}" y="${wy}" width="${walletW}" height="${walletH}" rx="${walletH * 0.22}" fill="none" stroke="${WHITE}" stroke-width="${stroke}"/>
  <circle cx="${wx + walletW * 0.78}" cy="${wy + walletH * 0.5}" r="${snapR}" fill="${WHITE}"/>
  <line x1="${wx + walletW * 0.12}" y1="${wy + walletH * 0.38}" x2="${wx + walletW * 0.62}" y2="${wy + walletH * 0.38}" stroke="${WHITE}" stroke-width="${stroke * 0.7}" stroke-linecap="round" opacity="0.85"/>
</svg>`);
}

async function splashSvg(w, h) {
  const fontSize = Math.round(w * 0.08);
  const iconSize = Math.round(w * 0.18);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect width="${w}" height="${h}" fill="${WHITE}"/>
  <rect x="${(w - iconSize) / 2}" y="${h * 0.38}" width="${iconSize}" height="${iconSize}" rx="${iconSize * 0.22}" fill="${BRAND}"/>
  <rect x="${(w - iconSize * 0.55) / 2}" y="${h * 0.38 + iconSize * 0.35}" width="${iconSize * 0.55}" height="${iconSize * 0.28}" rx="${iconSize * 0.06}" fill="none" stroke="${WHITE}" stroke-width="${iconSize * 0.04}"/>
  <text x="${w / 2}" y="${h * 0.38 + iconSize + fontSize * 1.2}" text-anchor="middle" fill="${BRAND}" font-family="system-ui,sans-serif" font-size="${fontSize}" font-weight="700">Finance Tracker</text>
</svg>`);
}

async function writePng(svg, path, size) {
  await sharp(svg).resize(size, size).png().toFile(path);
}

async function writeSplash(svg, path, w, h) {
  await sharp(svg).resize(w, h).png().toFile(path);
}

const SPLASH_SIZES = [
  { w: 1290, h: 2796, name: "iphone-14-pro-max" },
  { w: 1179, h: 2556, name: "iphone-14-pro" },
  { w: 1170, h: 2532, name: "iphone-14" },
  { w: 1284, h: 2778, name: "iphone-14-plus" },
  { w: 828, h: 1792, name: "iphone-11" },
  { w: 750, h: 1334, name: "iphone-se" },
];

async function main() {
  await mkdir(iconsDir, { recursive: true });
  await mkdir(splashDir, { recursive: true });

  const svg192 = await iconSvg(512);
  const svgMaskable = await iconSvg(512, true);

  await writePng(svg192, join(iconsDir, "icon-192.png"), 192);
  await writePng(svg192, join(iconsDir, "icon-512.png"), 512);
  await writePng(svgMaskable, join(iconsDir, "icon-512-maskable.png"), 512);
  await writePng(svg192, join(publicDir, "apple-touch-icon.png"), 180);
  await writePng(svg192, join(publicDir, "favicon.png"), 32);

  await writeFile(join(iconsDir, "icon.svg"), svg192);

  for (const { w, h, name } of SPLASH_SIZES) {
    const svg = await splashSvg(w, h);
    await writeSplash(svg, join(splashDir, `${name}.png`), w, h);
  }

  console.log("PWA assets generated in public/icons and public/splash");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
