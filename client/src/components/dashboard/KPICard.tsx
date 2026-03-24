import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <Card
      className={cn(
        "overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow",
        onClick && "cursor-pointer hover:ring-2 hover:ring-primary/20",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium tracking-wide font-heading", titleClassName ?? "text-muted-foreground")}>
          {title}
        </CardTitle>
        <div className={cn("h-9 w-9 rounded-full flex items-center justify-center shrink-0", iconClassName ?? "bg-primary/15")}>
          <Icon className={cn("h-4 w-4", iconColor ?? "text-primary")} />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className={cn("text-2xl font-bold font-heading", valueClassName ?? "text-foreground")}>{value}</div>
        {(description || trend) && (
          <p className={cn("text-xs mt-1 flex items-center gap-1", descriptionClassName ?? "text-muted-foreground")}>
            {trend === "up" && <span className="text-success font-medium">↑ {trendValue}</span>}
            {trend === "down" && <span className="text-destructive font-medium">↓ {trendValue}</span>}
            {trend === "neutral" && <span className="text-muted-foreground">→ {trendValue}</span>}
            <span className="opacity-80">{description}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
}
