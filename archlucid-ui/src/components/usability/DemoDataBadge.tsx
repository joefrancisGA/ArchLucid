
import { cn } from "@/lib/utils";
import { METADATA_STATUS_TAG_SHELL } from "@/lib/design-tokens";

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
        METADATA_STATUS_TAG_SHELL,
        "border border-neutral-300 bg-transparent text-neutral-600 dark:border-neutral-600 dark:text-neutral-400",
        variant === "banner" ? "px-2 py-1" : undefined,
        props.className,
      )}
      data-testid="demo-data-badge"
    >
      Sample data
    </span>
  );
}
