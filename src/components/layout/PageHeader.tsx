import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: string;
  actions?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  badge,
  actions,
  className,
  children,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1 pb-6 border-b border-[#1a1a1a] mb-6",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {badge && (
            <span className="inline-flex items-center text-[9px] font-bold uppercase tracking-[0.1em] text-[#00C9A7] bg-[#00C9A7]/10 border border-[#00C9A7]/20 px-2 py-0.5 rounded-[2px] mb-2">
              {badge}
            </span>
          )}
          <h1 className="text-xl font-light text-white tracking-tight leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-[#666666] mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>
        {actions && (
          <div className="flex items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
      {children && <div className="mt-3">{children}</div>}
    </div>
  );
}
