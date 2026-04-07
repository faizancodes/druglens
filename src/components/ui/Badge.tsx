import type { BadgeProps } from "@/lib/types";
import { cn } from "@/lib/utils";

const variantStyles: Record<string, string> = {
  default: "bg-[#1a1a1a] text-[#a1a1a1] border border-[#222222]",
  success: "bg-[#22c55e]/10 text-[#22c55e] border border-[#22c55e]/20",
  warning: "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/20",
  error: "bg-[#ef4444]/10 text-[#ef4444] border border-[#ef4444]/20",
  info: "bg-[#3D56F0]/10 text-[#3D56F0] border border-[#3D56F0]/20",
  accent: "bg-[#00C9A7]/10 text-[#00C9A7] border border-[#00C9A7]/20",
};

const sizeStyles: Record<string, string> = {
  sm: "text-[9px] px-1.5 py-0.5",
  md: "text-[10px] px-2 py-0.5",
};

export function Badge({ label, variant = "default", size = "md", className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-semibold uppercase tracking-[0.05em] rounded-[4px]",
        variantStyles[variant] ?? variantStyles.default,
        sizeStyles[size] ?? sizeStyles.md,
        className
      )}
    >
      {label}
    </span>
  );
}

export function RiskBadge({
  tier,
  className,
}: {
  tier: "critical" | "high" | "moderate" | "low" | "minimal";
  className?: string;
}) {
  const tierVariant: Record<string, BadgeProps["variant"]> = {
    critical: "error",
    high: "warning",
    moderate: "info",
    low: "success",
    minimal: "default",
  };

  return (
    <Badge
      label={tier}
      variant={tierVariant[tier] ?? "default"}
      className={className}
    />
  );
}
