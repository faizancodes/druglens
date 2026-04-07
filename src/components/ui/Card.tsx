import type { CardProps } from "@/lib/types";
import { cn } from "@/lib/utils";

export function Card({
  title,
  description,
  className,
  children,
  padding = true,
  hoverable = false,
  onClick,
}: CardProps) {
  return (
    <div
      className={cn(
        "bg-[#111111] border border-[#222222] transition-colors duration-150",
        hoverable && "hover:border-[#333333] cursor-pointer",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {(title || description) && (
        <div className={cn("border-b border-[#222222]", padding ? "px-6 py-4" : "px-0 py-0")}>
          {title && (
            <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
              {title}
            </h3>
          )}
          {description && (
            <p className="text-xs text-[#666666] mt-1">{description}</p>
          )}
        </div>
      )}
      <div className={cn(padding ? "p-6" : "")}>{children}</div>
    </div>
  );
}

export function CardHeader({
  className,
  children,
  title,
  subtitle,
  actions,
}: {
  className?: string;
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className={cn("px-6 py-4 border-b border-[#222222]", className)}>
      {(title || subtitle || actions) ? (
        <div className="flex items-center justify-between gap-4">
          <div>
            {title && (
              <h3 className="text-xs font-semibold uppercase tracking-[0.05em] text-[#a1a1a1]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#666666] mt-0.5">{subtitle}</p>
            )}
          </div>
          {actions && <div className="shrink-0">{actions}</div>}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return <div className={cn("p-6", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("px-6 py-4 border-t border-[#222222]", className)}>
      {children}
    </div>
  );
}
