import { cn } from "@/lib/utils";

type DemoDataBadgeProps = {
  readonly className?: string;
  readonly variant?: "inline" | "banner";
};

/** Unmistakable sample-data indicator on demo/showcase surfaces. */
export function DemoDataBadge(props: DemoDataBadgeProps) {
  const variant = props.variant ?? "inline";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-amber-300 bg-amber-50 font-semibold text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200",
        variant === "banner" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs",
        props.className,
      )}
      data-testid="demo-data-badge"
      role="status"
    >
      Sample data — not your tenant
    </span>
  );
}
