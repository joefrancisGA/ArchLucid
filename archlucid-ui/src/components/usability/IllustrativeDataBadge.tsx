import { cn } from "@/lib/utils";
import { DemoDataBadge } from "@/components/usability/DemoDataBadge";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type IllustrativeDataBadgeProps = {
  readonly className?: string;
  readonly variant?: "inline" | "banner";
};

/** Marks placeholder or illustrative ROI / sample metrics so evaluators do not confuse them with tenant data. */
export function IllustrativeDataBadge(props: IllustrativeDataBadgeProps) {
  if (props.variant === "banner") {
    return <DemoDataBadge variant="banner" className={props.className} />;
  }

  return (
    <span
      className={cn("inline-flex items-center rounded-full border border-neutral-300 bg-neutral-100 px-2 py-0.5 font-medium text-neutral-800 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.helper,
        props.className,
      )}
      role="status"
      data-testid="illustrative-data-badge"
    >
      Example data — not your results
    </span>
  );
}
