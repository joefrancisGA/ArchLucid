"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  homeGovernanceWarningsClearHrefFromSearch,
  homeGovernanceWarningsQueryEnabled,
} from "@/components/operator-home/runs-dashboard-panel-presentation";
import { OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF } from "@/lib/operator/operator-home-metric-hrefs";
import { OPERATOR_LINK } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type OperatorHomeGovernanceWarningsMetricLinkProps = {
  readonly label: string;
  readonly className?: string;
};

/** Warnings KPI toggles the home warnings filter on and clears it when already active. */
export function OperatorHomeGovernanceWarningsMetricLink(
  props: OperatorHomeGovernanceWarningsMetricLinkProps,
): React.JSX.Element {
  const searchParams = useSearchParams();
  const warningsFilterActive = homeGovernanceWarningsQueryEnabled(searchParams);
  const href = warningsFilterActive
    ? homeGovernanceWarningsClearHrefFromSearch(searchParams.toString())
    : OPERATOR_HOME_GOVERNANCE_WARNINGS_HREF;

  return (
    <Link
      href={href}
      scroll={false}
      className={cn(
        OPERATOR_LINK.inline,
        "no-underline hover:underline",
        warningsFilterActive ? "font-semibold text-al-text-primary" : undefined,
        props.className,
      )}
      aria-current={warningsFilterActive ? "true" : undefined}
      data-testid="operator-home-governance-warnings-metric"
      data-active={warningsFilterActive ? "true" : "false"}
    >
      {props.label}
    </Link>
  );
}
