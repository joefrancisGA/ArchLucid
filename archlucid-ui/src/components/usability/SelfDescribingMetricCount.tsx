import Link from "next/link";

import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatMetricCountHeadline,
  formatMetricCountScopeLabel,
  type MetricCountPresentation,
} from "@/lib/metric-count-presentation";
import { cn } from "@/lib/utils";

export type SelfDescribingMetricCountProps = {
  readonly presentation: MetricCountPresentation;
  readonly testId?: string;
  readonly variant?: "inline" | "stacked";
  readonly showHeadline?: boolean;
};

const METRIC_TILE_LINK_CLASS =
  "flex min-h-6 min-w-6 flex-col justify-center rounded-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] hover:bg-neutral-50 dark:hover:bg-neutral-800/60";

/** Clickable metric count with inline scope label (TB-2152). */
export function SelfDescribingMetricCount(props: SelfDescribingMetricCountProps): React.JSX.Element {
  const { presentation, testId, variant = "stacked", showHeadline = false } = props;
  const scopeLabel = formatMetricCountScopeLabel(presentation.dimensions);
  const headline = formatMetricCountHeadline(presentation);

  if (variant === "inline") {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-1" data-testid={testId}>
        <Link
          href={presentation.href}
          className={cn("font-medium tabular-nums", OPERATOR_LINK.inline)}
          data-testid={testId ? `${testId}-value` : undefined}
          aria-label={headline}
        >
          {presentation.count}
        </Link>
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {presentation.noun}
          {scopeLabel.length > 0 ? ` — ${scopeLabel}` : ""}
        </span>
      </span>
    );
  }

  return (
    <Link
      href={presentation.href}
      className={cn(METRIC_TILE_LINK_CLASS, "min-w-0 space-y-0.5")}
      data-testid={testId}
      aria-label={headline}
    >
      <span
        className={cn(OPERATOR_TYPOGRAPHY.kpiValue, OPERATOR_LINK.inline, "inline-block")}
        data-testid={testId ? `${testId}-value` : undefined}
      >
        {showHeadline ? headline : presentation.count}
      </span>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {presentation.noun}
        {scopeLabel.length > 0 ? ` — ${scopeLabel}` : ""}
      </p>
    </Link>
  );
}
