import type { ErrorStateProps } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

export function ErrorState({
  message = "Something went wrong.",
  title = "Error",
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className
      )}
    >
      <div className="w-10 h-10 flex items-center justify-center bg-[#ef4444]/10 border border-[#ef4444]/20">
        <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-[#666666] mt-1 max-w-xs">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="text-xs text-[#00C9A7] hover:underline transition-colors"
        >
          Try again
        </button>
      )}
    </div>
  );
}
