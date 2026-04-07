import type { LoadingStateProps } from "@/lib/types";
import { cn } from "@/lib/utils";

const sizeMap = {
  sm: { spinner: "w-4 h-4 border-2", text: "text-xs" },
  md: { spinner: "w-6 h-6 border-2", text: "text-sm" },
  lg: { spinner: "w-8 h-8 border-2", text: "text-base" },
};

export function LoadingState({
  message = "Loading...",
  className,
  size = "md",
}: LoadingStateProps) {
  const styles = sizeMap[size] ?? sizeMap.md;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12",
        className
      )}
    >
      <div
        className={cn(
          styles.spinner,
          "border-[#222222] border-t-[#00C9A7] rounded-full animate-spin"
        )}
      />
      {message && (
        <p className={cn(styles.text, "text-[#666666]")}>{message}</p>
      )}
    </div>
  );
}

export function InlineLoader({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-block w-3.5 h-3.5 border-2 border-[#222222] border-t-[#00C9A7] rounded-full animate-spin",
        className
      )}
    />
  );
}
