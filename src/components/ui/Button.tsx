"use client";

import type { ButtonProps } from "@/lib/types";
import { cn } from "@/lib/utils";

const variantStyles: Record<string, string> = {
  primary:
    "bg-[#00C9A7] text-[#0a0a0a] hover:bg-[#00a88c] border border-transparent font-bold",
  secondary:
    "bg-transparent text-[#a1a1a1] hover:text-white border border-[#222222] hover:border-[#333333]",
  ghost:
    "bg-transparent text-[#a1a1a1] hover:text-white hover:bg-[#111111] border border-transparent",
  danger:
    "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 border border-[#ef4444]/20",
};

const sizeStyles: Record<string, string> = {
  sm: "text-xs px-3 py-1.5 h-7",
  md: "text-sm px-4 py-2 h-9",
  lg: "text-sm px-6 py-3 h-11",
};

export function Button({
  label,
  children,
  variant = "primary",
  size = "md",
  disabled = false,
  isLoading = false,
  onClick,
  type = "button",
  className,
  icon,
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[4px] transition-colors duration-150",
        "focus-visible:outline focus-visible:outline-1 focus-visible:outline-[#00C9A7]",
        variantStyles[variant] ?? variantStyles.primary,
        sizeStyles[size] ?? sizeStyles.md,
        isDisabled && "opacity-50 cursor-not-allowed pointer-events-none",
        className
      )}
    >
      {isLoading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          <span>{label ?? children ?? "Loading..."}</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {(label || children) && <span>{label ?? children}</span>}
        </>
      )}
    </button>
  );
}
