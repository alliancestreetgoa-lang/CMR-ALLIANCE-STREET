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
        "glass-card rounded-lg p-5 relative overflow-hidden group transition-all duration-200",
        onClick && "cursor-pointer",
        className
      )}
      style={{
        boxShadow: onClick
          ? "0 4px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.04) inset"
          : "0 4px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(255,255,255,0.04) inset",
      }}
      onClick={onClick}
    >
      {/* Subtle gold shimmer top border */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{ background: "linear-gradient(90deg, rgba(212,175,55,0.6) 0%, rgba(212,175,55,0.1) 60%, transparent 100%)" }}
      />

      <div className="flex items-start justify-between gap-3 mb-3">
        <p className={cn("text-xs font-medium tracking-wider uppercase", titleClassName ?? "text-muted-foreground")}>
          {title}
        </p>
        <div
          className={cn(
            "h-8 w-8 rounded-md flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-105",
            iconClassName ?? "bg-primary/10 border border-primary/15"
          )}
        >
          <Icon className={cn("h-3.5 w-3.5", iconColor ?? "text-primary")} />
        </div>
      </div>

      <div className={cn("text-2xl font-bold font-heading leading-none mb-1.5", valueClassName ?? "text-foreground")}>
        {value}
      </div>

      {(description || trend) && (
        <p className={cn("text-xs flex items-center gap-1", descriptionClassName ?? "text-muted-foreground")}>
          {trend === "up" && <span className="text-success font-semibold">↑ {trendValue}</span>}
          {trend === "down" && <span className="text-destructive font-semibold">↓ {trendValue}</span>}
          {trend === "neutral" && <span className="text-muted-foreground">→ {trendValue}</span>}
          <span className="opacity-70">{description}</span>
        </p>
      )}

      {/* Subtle corner glow on hover */}
      {onClick && (
        <div
          className="absolute bottom-0 right-0 w-16 h-16 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(212,175,55,0.08) 0%, transparent 70%)" }}
        />
      )}
    </div>
  );
}
