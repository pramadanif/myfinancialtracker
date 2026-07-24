import { cn } from "@/lib/utils";

interface AppLogoProps {
  size?: number;
  className?: string;
  showShadow?: boolean;
}

/** Logo app — selaras dengan ikon PWA (chart naik, gradient biru) */
export default function AppLogo({ size = 80, className, showShadow = true }: AppLogoProps) {
  const pad = size * 0.14;
  const inner = size - pad * 2;
  const rx = size * 0.215;
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
  const baseX = cx - baseW / 2;
  const topDotX = startX + 2 * (barW + gap) + barW / 2;
  const topDotY = baseY - heights[2] - inner * 0.06;
  const dotR = barW * 0.14;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-label="Finance Tracker"
      className={cn(showShadow && "drop-shadow-[0_8px_20px_rgba(0,61,122,0.28)]", className)}
    >
      <defs>
        <linearGradient id="appLogoBg" x1="0" y1="0" x2={size} y2={size} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1A6FBE" />
          <stop offset="100%" stopColor="#003D7A" />
        </linearGradient>
      </defs>
      <rect width={size} height={size} rx={rx} fill="url(#appLogoBg)" />
      <rect
        x={baseX}
        y={baseY}
        width={baseW}
        height={baseH}
        rx={baseH / 2}
        fill="#FFFFFF"
        opacity={0.35}
      />
      {heights.map((h, i) => (
        <rect
          key={i}
          x={startX + i * (barW + gap)}
          y={baseY - h}
          width={barW}
          height={h}
          rx={barRx}
          fill="#FFFFFF"
          opacity={opacities[i]}
        />
      ))}
      <circle cx={topDotX} cy={topDotY} r={dotR} fill="#FFFFFF" />
    </svg>
  );
}
