
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
        "bg-[var(--al-status-warn-bg)] text-[var(--al-status-warn-fg)]",
        variant === "banner" ? "px-2 py-1" : undefined,
        props.className,
      )}
      data-testid="demo-data-badge"
      role="status"
      aria-label="Sample data — not your tenant"
    >
      Sample data
    </span>
  );
}
