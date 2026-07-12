import Link from "next/link";
import { cn } from "@/lib/utils";

import { RunStatusBadge } from "@/components/RunStatusBadge";
import { Button } from "@/components/ui/button";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import type { RunSummary } from "@/types/authority";

import {
  REVIEWS_HUB_RECENT_EMPTY_BODY,
  REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL,
  REVIEWS_HUB_RECENT_EMPTY_TITLE,
  REVIEWS_HUB_RECENT_SECTION_TITLE,
} from "./reviews-hub-copy";
import { toReviewsHubPackageRowDisplay } from "./reviews-hub-package-display";

type ReviewsHubRecentPackagesProps = {
  readonly runs: readonly RunSummary[];
};

/** Recent packages table or intentional empty state for `/reviews`. */
export function ReviewsHubRecentPackages(props: ReviewsHubRecentPackagesProps): React.JSX.Element {
  const rows = props.runs.map(toReviewsHubPackageRowDisplay);

  return (
    <section className="mt-8" data-testid="reviews-hub-recent-packages">
      <h2 className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{REVIEWS_HUB_RECENT_SECTION_TITLE}</h2>

      {rows.length === 0 ? (
        <div
          className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50/60 px-4 py-5 dark:border-neutral-700 dark:bg-neutral-900/40"
          data-testid="reviews-hub-recent-empty"
          role="status"
        >
          <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{REVIEWS_HUB_RECENT_EMPTY_TITLE}</p>
          <p className={cn("m-0 mt-2 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            {REVIEWS_HUB_RECENT_EMPTY_BODY}
          </p>
          <div className="mt-4">
            <Button variant="primary" size="sm" asChild>
              <Link href="/reviews/new" data-testid="reviews-hub-recent-empty-start-review">
                {REVIEWS_HUB_RECENT_EMPTY_PRIMARY_LABEL}
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <EnterpriseTable ariaLabel={REVIEWS_HUB_RECENT_SECTION_TITLE} data-testid="reviews-hub-packages-table">
            <EnterpriseTableHead>
              <EnterpriseTableHeadRow>
                <EnterpriseTableHeaderCell>Review package</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Status</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Last updated</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell className="text-right">Findings</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell className="text-right">Risks</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell className="text-right">Evidence</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Governance</EnterpriseTableHeaderCell>
                <EnterpriseTableHeaderCell>Action</EnterpriseTableHeaderCell>
              </EnterpriseTableHeadRow>
            </EnterpriseTableHead>
            <EnterpriseTableBody>
              {props.runs.map((run) => {
                const row = toReviewsHubPackageRowDisplay(run);

                return (
                  <EnterpriseTableRow
                    key={row.runId}
                    data-testid={row.isSamplePackage ? "reviews-hub-sample-row" : `reviews-hub-row-${row.runId}`}
                  >
                    <EnterpriseTableCell>
                      <div className="min-w-[12rem]">
                        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{row.name}</p>
                        {row.isSamplePackage ? (
                          <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Sample package</p>
                        ) : null}
                      </div>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <RunStatusBadge run={run} />
                      <span className="sr-only">{row.statusLabel}</span>
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>{row.lastUpdated}</EnterpriseTableCell>
                    <EnterpriseTableCell className="text-right tabular-nums">
                      {finiteIntegerCountDisplay(row.findingsCount)}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell className="text-right tabular-nums">
                      {finiteIntegerCountDisplay(row.riskCount)}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell className="text-right tabular-nums">
                      {finiteIntegerCountDisplay(row.evidenceCount)}
                    </EnterpriseTableCell>
                    <EnterpriseTableCell>{row.governanceState}</EnterpriseTableCell>
                    <EnterpriseTableCell>
                      <Button type="button" variant="outline" size="sm" asChild>
                        <Link href={row.primaryAction.href} data-testid={`reviews-hub-primary-action-${row.runId}`}>
                          {row.primaryAction.label}
                        </Link>
                      </Button>
                    </EnterpriseTableCell>
                  </EnterpriseTableRow>
                );
              })}
            </EnterpriseTableBody>
          </EnterpriseTable>
        </div>
      )}
    </section>
  );
}
