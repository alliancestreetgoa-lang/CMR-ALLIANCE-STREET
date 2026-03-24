import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  className?: string;
  iconClassName?: string;
  iconColor?: string;
  titleClassName?: string;
  valueClassName?: string;
  descriptionClassName?: string;
  onClick?: () => void;
}

export function KPICard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  trendValue,
  className,
  iconClassName,
  iconColor,
  titleClassName,
  valueClassName,
  descriptionClassName,
  onClick,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "relative rounded-md p-5 group transition-all duration-200 bg-card border border-border/60",
        onClick && "cursor-pointer hover-elevate active-elevate-2",
        className
      )}
      onClick={onClick}
      data-testid={`kpi-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-3">
          <p className={cn("text-xs font-medium tracking-wider uppercase", titleClassName ?? "text-muted-foreground")}>
            {title}
          </p>
          <div
            className={cn(
              "h-8 w-8 rounded-md flex items-center justify-center shrink-0",
              iconClassName ?? "bg-primary/10 border border-primary/15"
            )}
          >
            <Icon className={cn("h-4 w-4", iconColor ?? "text-primary")} />
          </div>
        </div>

        <div className={cn("text-3xl font-light leading-none mb-2 tracking-tight", valueClassName ?? "text-foreground")}>
          {value}
        </div>

        {(description || trend) && (
          <p className={cn("text-xs flex items-center gap-1.5", descriptionClassName ?? "text-muted-foreground")}>
            {trend === "up" && <span className="text-success font-semibold">+{trendValue}</span>}
            {trend === "down" && <span className="text-destructive font-semibold">-{trendValue}</span>}
            {trend === "neutral" && <span className="text-muted-foreground">{trendValue}</span>}
            <span>{description}</span>
          </p>
        )}
      </div>
    </div>
  );
}
