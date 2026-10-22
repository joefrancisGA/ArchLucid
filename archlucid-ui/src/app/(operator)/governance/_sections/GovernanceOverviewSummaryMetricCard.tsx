"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_OVERVIEW_BLOCKING_AWAITING_EVIDENCE_LABEL,
  GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_BREAKDOWN_HEADING,
  GOVERNANCE_OVERVIEW_BLOCKING_STALE_LABEL,
  GOVERNANCE_OVERVIEW_BLOCKING_UNOWNED_LABEL,
  GOVERNANCE_OVERVIEW_METRIC_WINDOW_LABEL,
} from "@/lib/governance/governance-overview-copy";
import {
  governanceOverviewBlockingBreakdownDisclosureHrefFromSearch,
  parseGovernanceOverviewBlockingBreakdownOpenFromSearch,
} from "@/lib/governance/governance-overview-blocking-breakdown-disclosure-url";
import type { GovernanceOverviewBlockingFindingsBreakdown } from "./governance-overview-summary";

function summaryMetricAccessibleName(label: string, value: number, destination: string): string {
  return `${label}: ${finiteIntegerCountDisplay(value)}. Go to ${destination}.`;
}

export type GovernanceOverviewSummaryMetricCardProps = {
  readonly label: string;
  readonly definition: string;
  readonly value: number;
  readonly href?: string;
  readonly destinationLabel?: string;
  readonly caution?: boolean;
  readonly breakdown?: GovernanceOverviewBlockingFindingsBreakdown;
};

export function GovernanceOverviewSummaryMetricCard(
  props: GovernanceOverviewSummaryMetricCardProps,
): React.JSX.Element {
  const router = useRouter();
  const pathname = usePathname() ?? "/governance";
  const searchParams = useSearchParams();
  const governanceOverviewBlockingBreakdownOpenParam = searchParams.get("governanceOverviewBlockingBreakdownOpen");
  const [breakdownOpen, setBreakdownOpenState] = useState(() =>
    parseGovernanceOverviewBlockingBreakdownOpenFromSearch(governanceOverviewBlockingBreakdownOpenParam),
  );

  const syncBreakdownOpenToUrl = useCallback(
    (open: boolean) => {
      router.replace(
        governanceOverviewBlockingBreakdownDisclosureHrefFromSearch(searchParams.toString(), open, pathname),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setBreakdownOpen = useCallback(
    (open: boolean) => {
      setBreakdownOpenState(open);
      syncBreakdownOpenToUrl(open);
    },
    [syncBreakdownOpenToUrl],
  );

  useEffect(() => {
    setBreakdownOpenState(
      parseGovernanceOverviewBlockingBreakdownOpenFromSearch(governanceOverviewBlockingBreakdownOpenParam),
    );
  }, [governanceOverviewBlockingBreakdownOpenParam]);

  const valueClassName = cn(
    "m-0 mt-1 font-semibold tabular-nums text-al-text-primary",
    OPERATOR_TYPOGRAPHY.dataValue,
    props.caution && props.value > 0 ? "text-amber-800 dark:text-amber-200" : null,
  );

  const body = (
    <>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</p>
      <p className={valueClassName}>{finiteIntegerCountDisplay(props.value)}</p>
      <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
        {GOVERNANCE_OVERVIEW_METRIC_WINDOW_LABEL} · {props.definition}
      </p>
      {props.breakdown !== undefined ? (
        <details
          className="mt-2"
          open={breakdownOpen}
          onToggle={(event) => {
            setBreakdownOpen((event.currentTarget as HTMLDetailsElement).open);
          }}
        >
          <summary className={cn("cursor-pointer text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            {GOVERNANCE_OVERVIEW_BLOCKING_FINDINGS_BREAKDOWN_HEADING}
          </summary>
          <ul className={cn("m-0 mt-1 list-none space-y-0.5 p-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
            <li>
              {GOVERNANCE_OVERVIEW_BLOCKING_UNOWNED_LABEL}:{" "}
              {finiteIntegerCountDisplay(props.breakdown.unownedHighSeverityFindings)}
            </li>
            <li>
              {GOVERNANCE_OVERVIEW_BLOCKING_STALE_LABEL}: {finiteIntegerCountDisplay(props.breakdown.staleFindings)}
            </li>
            <li>
              {GOVERNANCE_OVERVIEW_BLOCKING_AWAITING_EVIDENCE_LABEL}:{" "}
              {finiteIntegerCountDisplay(props.breakdown.findingsAwaitingEvidence)}
            </li>
          </ul>
        </details>
      ) : null}
    </>
  );

  if (props.href !== undefined && props.destinationLabel !== undefined) {
    return (
      <Link
        className={cn(
          "group rounded-md border border-neutral-200 bg-white px-3 py-3 transition",
          "hover:border-[var(--al-accent-interactive)] hover:bg-al-surface-raised",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--al-accent-interactive)] focus-visible:ring-offset-2",
          "dark:border-neutral-800 dark:bg-neutral-950/40 dark:hover:border-neutral-700",
        )}
        href={props.href}
        aria-label={summaryMetricAccessibleName(props.label, props.value, props.destinationLabel)}
        data-testid={`governance-overview-metric-link-${props.label.toLowerCase().replace(/\s+/g, "-")}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">{body}</div>
          <ChevronRight
            aria-hidden
            className="mt-0.5 h-4 w-4 shrink-0 text-al-text-secondary transition group-hover:text-[var(--al-accent-interactive)]"
          />
        </div>
      </Link>
    );
  }

  return (
    <div
      className="rounded-md border border-dashed border-neutral-200 bg-neutral-50/60 px-3 py-3 dark:border-neutral-800 dark:bg-neutral-950/20"
      data-testid={`governance-overview-metric-readonly-${props.label.toLowerCase().replace(/\s+/g, "-")}`}
      aria-label={`${props.label}: ${finiteIntegerCountDisplay(props.value)}. Read-only summary count.`}
    >
      {body}
    </div>
  );
}
