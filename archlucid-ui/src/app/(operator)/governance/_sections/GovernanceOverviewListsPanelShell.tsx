"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { RefObject } from "react";

import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION,
  GOVERNANCE_OVERVIEW_NO_PENDING_TITLE,
  GOVERNANCE_OVERVIEW_PENDING_SECTION_TITLE,
  GOVERNANCE_OVERVIEW_RECENT_DECISIONS_SECTION_TITLE,
} from "@/lib/governance/governance-overview-copy";

import type { useGovernanceOverviewLoadState } from "./use-governance-overview-load-state";

export type GovernanceOverviewListsPanelShellProps = {
  readonly pendingSectionRef: RefObject<HTMLElement | null>;
  readonly loadState: Extract<
    ReturnType<typeof useGovernanceOverviewLoadState>["loadState"],
    { status: "ready" }
  >;
};

export function GovernanceOverviewListsPanelShell(
  props: GovernanceOverviewListsPanelShellProps,
): React.JSX.Element {
  const { pendingSectionRef, loadState } = props;

  return (
    <>
      <section
        ref={pendingSectionRef}
        id="governance-overview-pending"
        aria-labelledby="governance-overview-pending-heading"
      >
        <h2 id="governance-overview-pending-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
          {GOVERNANCE_OVERVIEW_PENDING_SECTION_TITLE}
        </h2>
        {loadState.dashboard.pendingApprovals.length === 0 ? (
          <div className="mt-3" data-testid="governance-overview-no-pending">
            <EnterpriseCompactEmptyState
              title={GOVERNANCE_OVERVIEW_NO_PENDING_TITLE}
              description={GOVERNANCE_OVERVIEW_NO_PENDING_DESCRIPTION}
              testId="governance-overview-no-pending-compact"
            />
          </div>
        ) : (
          <ul className="m-0 mt-3 list-none space-y-2 p-0">
            {loadState.dashboard.pendingApprovals.slice(0, 5).map((row) => (
              <li key={row.approvalRequestId}>
                <Link
                  className={cn(OPERATOR_LINK.nav, "block rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800")}
                  href={`/governance/approval-queue?runId=${encodeURIComponent(row.runId)}`}
                >
                  <span className="font-medium">{row.manifestVersion}</span>
                  <span className="text-al-text-secondary"> · {row.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {loadState.dashboard.recentDecisions.length > 0 ? (
        <section aria-labelledby="governance-overview-recent-decisions-heading">
          <h2 id="governance-overview-recent-decisions-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.cardTitle)}>
            {GOVERNANCE_OVERVIEW_RECENT_DECISIONS_SECTION_TITLE}
          </h2>
          <ul className="m-0 mt-3 list-none space-y-2 p-0">
            {loadState.dashboard.recentDecisions.slice(0, 5).map((row) => (
              <li key={row.approvalRequestId}>
                <Link
                  className={cn(OPERATOR_LINK.nav, "block rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-800")}
                  href={`/governance/approval-queue?runId=${encodeURIComponent(row.runId)}`}
                >
                  <span className="font-medium">{row.manifestVersion}</span>
                  <span className="text-al-text-secondary"> · {row.status}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
