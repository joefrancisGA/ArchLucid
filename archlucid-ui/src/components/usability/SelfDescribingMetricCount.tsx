import Link from "next/link";

import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  formatMetricCountHeadline,
  formatMetricCountScopeLabel,
  type MetricCountPresentation,
} from "@/lib/metric-count-presentation";
import { cn } from "@/lib/utils";

export type SelfDescribingMetricCountProps = {
  readonly presentation: MetricCountPresentation;
  readonly testId?: string;
  readonly variant?: "inline" | "stacked" | "executive";
  readonly showHeadline?: boolean;
};

export const METRIC_TILE_INTERACTIVE_SHELL_CLASS =
  "flex min-h-6 min-w-6 flex-col justify-center rounded-md border border-neutral-200 bg-white transition-colors hover:border-neutral-300 hover:bg-neutral-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:border-neutral-700 dark:bg-neutral-900 dark:hover:border-neutral-600 dark:hover:bg-neutral-800/60";

const METRIC_SCOPE_SEPARATOR = " · ";

function formatMetricNounWithScope(noun: string, scopeLabel: string): string {
  return scopeLabel.length > 0 ? `${noun}${METRIC_SCOPE_SEPARATOR}${scopeLabel}` : noun;
}

/** Clickable metric count with inline scope label (TB-2152). */
export function SelfDescribingMetricCount(props: SelfDescribingMetricCountProps): React.JSX.Element {
  const { presentation, testId, variant = "stacked", showHeadline = false } = props;
  const scopeLabel = formatMetricCountScopeLabel(presentation.dimensions, { noun: presentation.noun });
  const headline = formatMetricCountHeadline(presentation);
  const nounWithScope = formatMetricNounWithScope(presentation.noun, scopeLabel);

  if (variant === "inline") {
    return (
      <span className="inline-flex flex-wrap items-baseline gap-x-1" data-testid={testId}>
        <Link
          href={presentation.href}
          className={cn("font-medium tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.kpiValue)}
          data-testid={testId ? `${testId}-value` : undefined}
          aria-label={headline}
        >
          {presentation.count}
        </Link>
        <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{nounWithScope}</span>
      </span>
    );
  }

  const countClassName =
    variant === "executive"
      ? cn(OPERATOR_TYPOGRAPHY.executiveDashboardMetric, "inline-block text-al-text-primary")
      : cn(OPERATOR_TYPOGRAPHY.kpiValue, "inline-block text-al-text-primary");

  return (
    <Link
      href={presentation.href}
      className={cn(METRIC_TILE_INTERACTIVE_SHELL_CLASS, "min-w-0 space-y-0.5")}
      data-testid={testId}
      aria-label={headline}
    >
      <span className={countClassName} data-testid={testId ? `${testId}-value` : undefined}>
        {showHeadline ? headline : presentation.count}
      </span>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{nounWithScope}</p>
    </Link>
  );
}
