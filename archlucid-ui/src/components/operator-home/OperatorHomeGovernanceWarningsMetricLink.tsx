"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  homeGovernanceWarningsClearHrefFromSearch,
  homeGovernanceWarningsHrefFromSearch,
  homeGovernanceWarningsQueryEnabled,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import {
  OPERATOR_HOME_METRIC_COUNTER_LABEL,
  OPERATOR_HOME_METRIC_COUNTER_VALUE,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorHomeGovernanceWarningsMetricLinkProps = {
  readonly count: number;
  readonly label: string;
  readonly className?: string;
  readonly emphasizeCount?: boolean;
};

/** Warnings KPI toggles the home warnings filter on and clears it when already active. */
export function OperatorHomeGovernanceWarningsMetricLink(
  props: OperatorHomeGovernanceWarningsMetricLinkProps,
): React.JSX.Element {
  const searchParams = useSearchParams();
  const warningsFilterActive = homeGovernanceWarningsQueryEnabled(searchParams);
  const href = warningsFilterActive
    ? homeGovernanceWarningsClearHrefFromSearch(searchParams.toString())
    : homeGovernanceWarningsHrefFromSearch(searchParams.toString());

  const emphasizeCount = props.emphasizeCount !== false;

  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        "rounded-sm no-underline transition-colors hover:text-[var(--al-accent-link)]",
        "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)]",
        warningsFilterActive ? "text-al-text-primary" : undefined,
        props.className,
      )}
      aria-current={warningsFilterActive ? "page" : undefined}
      aria-label={`${props.count} ${props.label.toLowerCase()}`}
      data-testid="operator-home-governance-warnings-metric"
      data-active={warningsFilterActive ? "true" : "false"}
    >
      <span className="inline-flex items-baseline gap-1.5">
        <span
          className={cn(
            emphasizeCount ? OPERATOR_HOME_METRIC_COUNTER_VALUE : OPERATOR_HOME_METRIC_COUNTER_LABEL,
            warningsFilterActive ? "text-al-text-primary" : undefined,
          )}
        >
          {props.count}
        </span>
        <span className={OPERATOR_HOME_METRIC_COUNTER_LABEL}>{props.label}</span>
      </span>
    </Link>
  );
}
