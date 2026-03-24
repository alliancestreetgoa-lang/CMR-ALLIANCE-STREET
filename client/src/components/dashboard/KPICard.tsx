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
        "kpi-glass-3d relative rounded-xl p-5 group transition-all duration-300 ease-out",
        onClick && "cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {/* Top reflective edge — bright highlight */}
      <div
        className="absolute inset-x-0 top-0 h-px rounded-t-xl pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 5%, rgba(255,255,255,0.25) 30%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.25) 70%, transparent 95%)" }}
      />

      {/* Left edge highlight for 3D depth */}
      <div
        className="absolute inset-y-0 left-0 w-px rounded-l-xl pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.05) 60%, transparent 100%)" }}
      />

      <div
        className="absolute top-0 left-0 w-24 h-24 pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: "radial-gradient(circle at 0% 0%, rgba(229,62,62,0.10) 0%, transparent 70%)" }}
      />

      {/* Inner glass highlight — diagonal reflection */}
      <div
        className="absolute inset-0 rounded-xl pointer-events-none overflow-hidden"
      >
        <div
          className="absolute -top-1/2 -left-1/4 w-3/4 h-full pointer-events-none opacity-[0.04] group-hover:opacity-[0.07] transition-opacity duration-500"
          style={{
            background: "linear-gradient(135deg, white 0%, transparent 60%)",
            transform: "rotate(-15deg)",
          }}
        />
      </div>

      {/* Bottom shadow for 3D lift */}
      <div
        className="absolute -bottom-2 left-3 right-3 h-4 rounded-full pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity duration-300 blur-md"
        style={{ background: "rgba(0,0,0,0.5)" }}
      />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-3 mb-4">
          <p className={cn("text-[11px] font-semibold tracking-[0.12em] uppercase", titleClassName ?? "text-muted-foreground")}>
            {title}
          </p>
          <div
            className={cn(
              "h-9 w-9 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg",
              iconClassName ?? "border border-primary/20"
            )}
            style={{
              background: iconClassName ? undefined : "linear-gradient(135deg, rgba(229,62,62,0.12) 0%, rgba(229,62,62,0.04) 100%)",
              boxShadow: "0 2px 8px rgba(0,0,0,0.2), 0 0 0 1px rgba(255,255,255,0.04) inset",
            }}
          >
            <Icon className={cn("h-4 w-4", iconColor ?? "text-primary")} />
          </div>
        </div>

        <div className={cn("text-3xl font-bold font-heading leading-none mb-2 tracking-tight", valueClassName ?? "text-foreground")}>
          {value}
        </div>

        {(description || trend) && (
          <p className={cn("text-xs flex items-center gap-1.5", descriptionClassName ?? "text-muted-foreground/80")}>
            {trend === "up" && <span className="text-success font-semibold">↑ {trendValue}</span>}
            {trend === "down" && <span className="text-destructive font-semibold">↓ {trendValue}</span>}
            {trend === "neutral" && <span className="text-muted-foreground">→ {trendValue}</span>}
            <span>{description}</span>
          </p>
        )}
      </div>

      <div
        className="absolute bottom-0 right-0 w-28 h-28 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(229,62,62,0.08) 0%, transparent 65%)" }}
      />
    </div>
  );
}
