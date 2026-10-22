import type { ReactElement } from "react";

import { cn } from "@/lib/utils";

import { OperatorSavedViewsBar } from "@/components/operator/OperatorSavedViewsBar";
import { recordAuditRecentSavedView } from "@/lib/audit-recent-saved-views";
import type { OperatorSavedView } from "@/lib/api/operator-saved-views";
import type { OperatorSavedViewPayload } from "@/lib/operator/operator-saved-view-types";
import {
  auditSearchEventsSectionHeadingBuyerPolished,
  auditSearchEventsSectionHeadingOperator,
  auditSearchEventsSectionHeadingReader,
  auditSearchSectionLeadReaderLine,
} from "@/lib/enterprise-controls-context-copy";
import {
  AUDIT_TRAIL_FILTERS_EMPTY_HINT,
} from "@/lib/audit-trail-page-copy";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { buyerFacingReviewLinkLabelFromRunId } from "@/lib/buyer/buyer-facing-review-title";
import { SHOWCASE_STATIC_DEMO_RUN_ID } from "@/lib/showcase-static-demo";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { AuditRecentSavedViewsChips } from "./AuditRecentSavedViewsChips";

type AuditSearchBuyerChromeProps = {
  readonly buyerPolishedShell: boolean;
  readonly buyerOmitSearchFiltersChrome: boolean;
  readonly buyerCompactFilters: boolean;
  readonly callerAuthorityRank: number;
  readonly runId: string;
  readonly showSavedViews?: boolean;
  readonly searching: boolean;
  readonly loadingTypes: boolean;
  readonly getAuditSavedViewPayload?: () => OperatorSavedViewPayload;
  readonly loadAuditSavedView?: (view: OperatorSavedView) => void | Promise<void>;
};

export function AuditSearchBuyerChrome(props: AuditSearchBuyerChromeProps): ReactElement {
  const {
    buyerPolishedShell,
    buyerOmitSearchFiltersChrome,
    buyerCompactFilters,
    callerAuthorityRank,
    runId,
    showSavedViews = false,
    searching,
    loadingTypes,
    getAuditSavedViewPayload,
    loadAuditSavedView,
  } = props;

  return (
    <>
      {showSavedViews && getAuditSavedViewPayload !== undefined && loadAuditSavedView !== undefined ? (
        <>
          <AuditRecentSavedViewsChips
            onLoadView={(view) => {
              recordAuditRecentSavedView({ viewId: view.id, name: view.name });
              void loadAuditSavedView(view);
            }}
          />
          <OperatorSavedViewsBar
            surface="audit"
            disabled={searching || loadingTypes}
            getCurrentPayload={getAuditSavedViewPayload}
            onLoadView={(view) => {
              recordAuditRecentSavedView({ viewId: view.id, name: view.name });
              void loadAuditSavedView(view);
            }}
          />
        </>
      ) : null}
      <h3 id="audit-search-heading" className={cn("mt-0", buyerCompactFilters ? "mb-2" : "mb-3", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {buyerPolishedShell
          ? auditSearchEventsSectionHeadingBuyerPolished
          : callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority
            ? auditSearchEventsSectionHeadingReader
            : auditSearchEventsSectionHeadingOperator}
      </h3>
      {buyerPolishedShell && buyerCompactFilters ? (
        <p className={cn("m-0 mb-2 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {AUDIT_TRAIL_FILTERS_EMPTY_HINT}
        </p>
      ) : null}
      {buyerPolishedShell && !buyerOmitSearchFiltersChrome && !buyerCompactFilters ? (
        <p className={cn("m-0 mb-3 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          Open filters if you need to narrow events or switch reviews.
        </p>
      ) : null}
      {buyerPolishedShell && buyerOmitSearchFiltersChrome ? (
        <p
          className={cn("m-0 mb-3 max-w-2xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="audit-buyer-short-timeline-filter-omit"
        >
          Open filters if you need to switch reviews or narrow event types.
        </p>
      ) : null}
      {buyerPolishedShell && !buyerOmitSearchFiltersChrome && !buyerCompactFilters ? (
        <div className="mb-3 flex flex-wrap gap-2">
          <p
            className={cn(
              "m-0 inline-flex flex-wrap items-center gap-x-1 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 font-medium text-al-text-primary dark:border-neutral-600 dark:bg-neutral-900",
              OPERATOR_TYPOGRAPHY.badge,
            )}
            data-testid="audit-buyer-sample-timeline-chip"
          >
            <span className="text-al-text-secondary">Showing:</span>
            <strong className="font-semibold text-al-text-primary">
              {buyerFacingReviewLinkLabelFromRunId(
                runId.trim().length > 0 ? runId : SHOWCASE_STATIC_DEMO_RUN_ID,
              )}
            </strong>
            <span className="text-al-text-secondary">— full lifecycle</span>
          </p>
        </div>
      ) : null}
      {callerAuthorityRank < AUTHORITY_RANK.ExecuteAuthority && !buyerPolishedShell ? (
        <p className={cn("mb-2 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {auditSearchSectionLeadReaderLine}
        </p>
      ) : null}
    </>
  );
}
