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
  onClick?: () => void;
}

export function KPICard({ title, value, description, icon: Icon, trend, trendValue, className, onClick }: KPICardProps) {
  return (
    <Card className={cn("overflow-hidden border border-border shadow-sm hover:shadow-md transition-shadow", onClick && "cursor-pointer hover:ring-2 hover:ring-primary/20", className)} onClick={onClick}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground tracking-wide font-heading">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent className="pt-2">
        <div className="text-2xl font-bold text-foreground font-heading">{value}</div>
        {(description || trend) && (
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
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