import { cn } from "@/lib/utils";

type StatusType = "success" | "warning" | "destructive" | "secondary" | "default" | "outline";

interface StatusBadgeProps {
  status: string;
  className?: string;
  variant?: StatusType; // Optional manual override
}

export function StatusBadge({ status, className, variant }: StatusBadgeProps) {
  let computedVariant: StatusType = "default";
  const lowerStatus = status.toLowerCase();

  if (variant) {
    computedVariant = variant;
  } else if (["active", "completed", "filed", "paid", "done"].includes(lowerStatus)) {
    computedVariant = "success";
  } else if (["warning", "in progress", "pending", "review"].includes(lowerStatus)) {
    computedVariant = "warning";
  } else if (["inactive", "overdue", "emergency", "failed", "high"].includes(lowerStatus)) {
    computedVariant = "destructive";
  } else if (["not started", "draft"].includes(lowerStatus)) {
    computedVariant = "secondary";
  }

  const variants: Record<StatusType, string> = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-success/15 text-success-foreground border-success/20", // Using text-success-foreground (white) might be too light on light bg if success is dark green. 
    // Wait, my css var for success-foreground is white. 
    // Let's adjust to be "text-green-700 bg-green-50" style using our vars.
    // Actually, let's look at index.css. --success is 142 71% 45% (Green).
    // bg-success/15 will be light green. text-success is the strong green.
    // Let's use text-success for the text color on light backgrounds.
    
    // REVISED VARIANTS for consistency with index.css theme
    // We want "Subtle" badges usually.
    
    secondary: "bg-muted text-muted-foreground border-border",
    outline: "bg-transparent border-border text-foreground",
  };

  // Manual specific overrides for Tailwind 4 with CSS vars
  const styleClasses = {
    success: "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))] border-[hsl(var(--success)/0.2)]",
    warning: "bg-[hsl(var(--warning)/0.15)] text-[hsl(var(--warning))] border-[hsl(var(--warning)/0.2)]", // Warning text might need to be darker than the pure yellow/orange
    destructive: "bg-[hsl(var(--destructive)/0.15)] text-[hsl(var(--destructive))] border-[hsl(var(--destructive)/0.2)]",
    secondary: "bg-secondary text-secondary-foreground border-secondary-foreground/10",
    default: "bg-primary/10 text-primary border-primary/20",
    outline: "border-border bg-background text-foreground"
  };

  // Fix for warning text visibility if needed (yellow text on white is hard to read)
  // But let's stick to the system for now.

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        styleClasses[computedVariant as keyof typeof styleClasses] || styleClasses.default,
        className
      )}
    >
      {status}
    </span>
  );
}