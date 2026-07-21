"use client";

import { resolveIcon, getAccountIconName } from "@/lib/icons";
import { cn } from "@/lib/utils";

type IconSize = "sm" | "md" | "lg" | "xl";

const SIZE_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
};

interface DynamicIconProps {
  name?: string | null;
  size?: IconSize | number;
  className?: string;
  color?: string;
  strokeWidth?: number;
}

export default function DynamicIcon({
  name,
  size = "md",
  className,
  color,
  strokeWidth = 1.75,
}: DynamicIconProps) {
  const Icon = resolveIcon(name);
  const pixelSize = typeof size === "number" ? size : SIZE_MAP[size];

  return (
    <Icon
      size={pixelSize}
      className={cn("flex-shrink-0", className)}
      color={color}
      strokeWidth={strokeWidth}
    />
  );
}

interface CategoryIconBoxProps {
  iconName?: string | null;
  size?: IconSize;
  selected?: boolean;
  className?: string;
}

export function CategoryIconBox({
  iconName,
  size = "md",
  selected = false,
  className,
}: CategoryIconBoxProps) {
  const boxSize = size === "sm" ? "w-8 h-8" : size === "lg" ? "w-12 h-12" : "w-10 h-10";

  return (
    <div
      className={cn(
        "rounded-xl flex items-center justify-center flex-shrink-0",
        boxSize,
        selected ? "bg-primary text-white" : "bg-primary-light text-primary",
        className
      )}
    >
      <DynamicIcon
        name={iconName}
        size={size}
        color={selected ? "#FFFFFF" : "#0055A4"}
        strokeWidth={1.75}
      />
    </div>
  );
}

interface AccountIconBoxProps {
  accountName: string;
  colorTag?: string;
  size?: IconSize;
  className?: string;
}

export function AccountIconBox({
  accountName,
  colorTag = "#0055A4",
  size = "md",
  className,
}: AccountIconBoxProps) {
  const iconName = getAccountIconName(accountName);

  return (
    <div
      className={cn(
        "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0",
        className
      )}
      style={{ backgroundColor: `${colorTag}18` }}
    >
      <DynamicIcon name={iconName} size={size} color={colorTag} />
    </div>
  );
}
