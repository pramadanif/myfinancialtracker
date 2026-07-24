/** Shared brand icon — dipakai generate PWA & dokumentasi visual */

export const BRAND = {
  primary: "#0055A4",
  primaryLight: "#1A6FBE",
  primaryDark: "#003D7A",
  white: "#FFFFFF",
};

/**
 * Ikon: 3 bar naik + dasar — terbaca jelas dari 32px sampai 512px
 * @param {number} size
 * @param {{ maskable?: boolean }} opts
 */
export function renderIconSvg(size, { maskable = false } = {}) {
  const pad = maskable ? size * 0.1 : size * 0.14;
  const inner = size - pad * 2;
  const rx = maskable ? 0 : size * 0.215;

  const cx = size / 2;
  const baseY = pad + inner * 0.82;
  const baseW = inner * 0.62;
  const baseH = inner * 0.045;
  const barW = inner * 0.13;
  const gap = inner * 0.1;
  const barRx = barW * 0.26;
  const totalBarsW = barW * 3 + gap * 2;
  const startX = cx - totalBarsW / 2;

  const heights = [inner * 0.22, inner * 0.34, inner * 0.48];
  const opacities = [0.72, 0.86, 1];

  const bars = heights
    .map((h, i) => {
      const x = startX + i * (barW + gap);
      const y = baseY - h;
      return `<rect x="${x.toFixed(2)}" y="${y.toFixed(2)}" width="${barW.toFixed(2)}" height="${h.toFixed(2)}" rx="${barRx.toFixed(2)}" fill="${BRAND.white}" opacity="${opacities[i]}"/>`;
    })
    .join("\n  ");

  const baseX = cx - baseW / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="${size}" y2="${size}" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="${BRAND.primaryLight}"/>
      <stop offset="100%" stop-color="${BRAND.primaryDark}"/>
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="${size * 0.012}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <rect width="${size}" height="${size}" rx="${rx.toFixed(2)}" fill="url(#bg)"/>
  <g filter="url(#glow)">
  <rect x="${baseX.toFixed(2)}" y="${baseY.toFixed(2)}" width="${baseW.toFixed(2)}" height="${baseH.toFixed(2)}" rx="${(baseH / 2).toFixed(2)}" fill="${BRAND.white}" opacity="0.35"/>
  ${bars}
  <circle cx="${(startX + 2 * (barW + gap) + barW / 2).toFixed(2)}" cy="${(baseY - heights[2] - inner * 0.06).toFixed(2)}" r="${(barW * 0.14).toFixed(2)}" fill="${BRAND.white}"/>
  </g>
</svg>`;
}
