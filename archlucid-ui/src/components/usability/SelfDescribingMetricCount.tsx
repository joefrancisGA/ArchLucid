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
          {presentation.noun} · {scopeLabel}
        </span>
      </span>
    );
  }

  return (
    <div className="min-w-0 space-y-0.5" data-testid={testId}>
      <Link
        href={presentation.href}
        className={cn(OPERATOR_TYPOGRAPHY.kpiValue, OPERATOR_LINK.inline)}
        data-testid={testId ? `${testId}-value` : undefined}
        aria-label={headline}
      >
        {showHeadline ? headline : presentation.count}
      </Link>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {presentation.noun}
        {scopeLabel.length > 0 ? ` · ${scopeLabel}` : ""}
      </p>
    </div>
  );
}
