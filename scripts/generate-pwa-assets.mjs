import sharp from "sharp";
import { mkdir, writeFile } from "fs/promises";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { renderIconSvg } from "./brand-icon.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");
const iconsDir = join(publicDir, "icons");
const splashDir = join(publicDir, "splash");

async function writePng(svg, path, size) {
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(path);
}

const SPLASH_SIZES = [
  { w: 1290, h: 2796, name: "iphone-14-pro-max" },
  { w: 1179, h: 2556, name: "iphone-14-pro" },
  { w: 1170, h: 2532, name: "iphone-14" },
  { w: 1284, h: 2778, name: "iphone-14-plus" },
  { w: 828, h: 1792, name: "iphone-11" },
  { w: 750, h: 1334, name: "iphone-se" },
];

async function writeSplash(iconSvg512, path, w, h) {
  const iconSize = Math.round(Math.min(w, h) * 0.17);
  const iconY = Math.round(h * 0.36);
  const iconX = Math.round((w - iconSize) / 2);
  const titleSize = Math.round(w * 0.062);
  const subtitleSize = Math.round(w * 0.034);
  const textY = iconY + iconSize + Math.round(titleSize * 1.4);

  const iconBuf = await sharp(Buffer.from(iconSvg512))
    .resize(iconSize, iconSize)
    .png()
    .toBuffer();

  const textSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${Math.round(subtitleSize * 4)}">
    <text x="${w / 2}" y="${titleSize}" text-anchor="middle" fill="#003D7A" font-family="system-ui,-apple-system,sans-serif" font-size="${titleSize}" font-weight="700" letter-spacing="-0.02em">Finance Tracker</text>
    <text x="${w / 2}" y="${titleSize + subtitleSize * 1.55}" text-anchor="middle" fill="#64748B" font-family="system-ui,-apple-system,sans-serif" font-size="${subtitleSize}" font-weight="500">Catat keuangan dengan mudah</text>
  </svg>`);

  const textBuf = await sharp(textSvg).png().toBuffer();

  await sharp({
    create: { width: w, height: h, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } },
  })
    .composite([
      { input: iconBuf, top: iconY, left: iconX },
      { input: textBuf, top: textY, left: 0 },
    ])
    .png()
    .toFile(path);
}

async function main() {
  await mkdir(iconsDir, { recursive: true });
  await mkdir(splashDir, { recursive: true });

  const svgSource = renderIconSvg(512);
  const svgMaskable = renderIconSvg(512, { maskable: true });

  await writePng(svgSource, join(iconsDir, "icon-192.png"), 192);
  await writePng(svgSource, join(iconsDir, "icon-512.png"), 512);
  await writePng(svgMaskable, join(iconsDir, "icon-512-maskable.png"), 512);
  await writePng(svgSource, join(publicDir, "apple-touch-icon.png"), 180);
  await writePng(svgSource, join(publicDir, "favicon.png"), 32);

  await writeFile(join(iconsDir, "icon.svg"), svgSource);

  for (const { w, h, name } of SPLASH_SIZES) {
    await writeSplash(svgSource, join(splashDir, `${name}.png`), w, h);
  }

  console.log("PWA assets generated in public/icons and public/splash");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
