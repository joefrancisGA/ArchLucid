"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewOutcomeTaxonomyLegend } from "@/components/ReviewOutcomeTaxonomyLegend";
import { BUYER_APPROVED_WITH_MONITORING_DEFINITION, BUYER_DECISION_KEY_SUMMARY, BUYER_OPEN_SIGNED_RECORD_CTA, BUYER_REVIEW_DETAIL_EVIDENCE_BASIS_LINE, BUYER_REVIEW_MONITORED_RISK_COUNT_CLARIFIER } from "@/lib/buyer/buyer-polish-copy";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { finiteIntegerCountDisplay } from "@/lib/finite-count-display";
import { buildBuyerReviewPackageDispositionLine, buildBuyerReviewPackagePlainStatusHeadline } from "@/lib/review-buyer-disposition-line";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  OPERATOR_CARD,
  OPERATOR_LAYOUT,
  OPERATOR_LINK,
  OPERATOR_NAV_GROUP_LABEL,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import type { components } from "@/lib/openapi-schemas";

import {
  DegradedFindingCoverageBanner,
  RunDetailFindingCoverageDispositionPanel,
} from "./RunDetailFindingCoverageDispositionPanel";
import {
  manifestWarningsSecondaryCopy,
  RunDetailPackageStatusStrip,
  useStreamlinedPilotOutcomeLabels,
} from "./RunDetailPackageStatusStrip";

export type ShowcasePolicyPackStripLink = {
  readonly href: string;
  readonly label: string;
};

type RunDetailOutcomeCardsProps = {
  readonly runId: string;
  /** When finalized, links the manifest outcome card to manifest detail. */
  readonly manifestId?: string | null;
  readonly hasGoldenManifest: boolean;
  readonly findingCountDisplay: number | null;
  readonly warningCountDisplay: number | null;
  readonly artifactCount: number;
  readonly unresolvedIssueCountDisplay: number | null;
  /** From manifest status when summary is loaded; omit to hide the governance line on the manifest card. */
  readonly governanceGateLabel?: string | null;
  /** Aggregate posture from explanation summary (buyer strip severity signal). */
  readonly aggregateRiskPosture?: string | null;
  /** When true, one or more finding engines failed but the review may still be committable. */
  readonly degradedFindingCoverage?: boolean;
  /** Sanitized engine labels from finding coverage summary (engine/category). */
  readonly failedEngineLabels?: readonly string[];
  readonly findingCoverageSummary?: components["schemas"]["RunFindingCoverageSummary"] | null;
  /** Buyer-polished strip only: prominent link to read-only pack detail (showcase demo). */
  readonly showcasePolicyPackStrip?: ShowcasePolicyPackStripLink | null;
  /** When true, omit promoted status headline and disposition line (shown elsewhere). */
  readonly hidePromotedStatus?: boolean;
  /** When ReviewPackageDoThisNextStrip owns the filled page primary (TB-2175). */
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

/**
 * Top-of-run proof summary: reviewers see outcomes before scrolling to timeline and agent diagnostics.
 */
const samePageJumpClass =
  "block rounded-lg no-underline outline-none ring-offset-2 transition hover:ring-2 hover:ring-neutral-400/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--al-accent-border-focus)] dark:outline-offset-neutral-950";

export function RunDetailOutcomeCards({
  runId,
  manifestId,
  hasGoldenManifest,
  findingCountDisplay,
  warningCountDisplay,
  artifactCount,
  unresolvedIssueCountDisplay,
  governanceGateLabel,
  aggregateRiskPosture,
  showcasePolicyPackStrip,
  degradedFindingCoverage = false,
  failedEngineLabels = [],
  findingCoverageSummary = null,
  hidePromotedStatus = false,
  pagePrimaryOwnedElsewhere = false,
}: RunDetailOutcomeCardsProps) {
  const supplementaryNavLinkClass =
    pagePrimaryOwnedElsewhere === true ? OPERATOR_LINK.optional : OPERATOR_LINK.nav;
  const { approvalStatusLabel } = useStreamlinedPilotOutcomeLabels();
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const coverageBanner =
    degradedFindingCoverage === true ? (
      <DegradedFindingCoverageBanner failedEngineLabels={failedEngineLabels} />
    ) : null;
  const dispositionPanel =
    findingCoverageSummary !== null ? <RunDetailFindingCoverageDispositionPanel summary={findingCoverageSummary} /> : null;

  if (buyerPolishedShell) {
  const statusHeadline = buildBuyerReviewPackagePlainStatusHeadline({
    hasGoldenManifest,
    findingCountDisplay,
    warningCountDisplay,
    unresolvedIssueCountDisplay,
    governanceGateLabel,
    aggregateRiskPosture,
  });

  return (
    <div id="run-decision-summary" className={cn("scroll-mt-24", OPERATOR_LAYOUT.sectionStack)}>
      {coverageBanner}
      {dispositionPanel}
      {!hidePromotedStatus && statusHeadline !== null ? (
        <div
          className={cn(
            "rounded-md border border-neutral-200 bg-al-surface-raised dark:border-neutral-800 shadow-sm",
            OPERATOR_CARD.body,
          )}
          data-testid="buyer-review-status-headline"
          role="status"
        >
          <p className={cn("m-0 whitespace-pre-line font-semibold leading-snug text-neutral-950 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}>
            {statusHeadline}
          </p>
          <p className={cn("m-0 mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            {BUYER_REVIEW_DETAIL_EVIDENCE_BASIS_LINE}
          </p>
          {hasGoldenManifest ? (
            <dl
              className={cn("m-0 mt-3 grid gap-2 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="buyer-review-decision-summary"
            >
              <div>
                <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>Decision</dt>
                <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">
                  {(aggregateRiskPosture ?? governanceGateLabel ?? "Package finalized").trim()}
                </dd>
              </div>
              <div>
                <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>Material finding</dt>
                <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">PHI minimization risk</dd>
              </div>
              <div>
                <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>Evidence basis</dt>
                <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">
                  {typeof findingCountDisplay === "number"
                    ? `${findingCountDisplay} citation${findingCountDisplay === 1 ? "" : "s"} in evidence trail`
                    : "Evidence trail ready"}
                </dd>
              </div>
              <div>
                <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "text-neutral-500 dark:text-neutral-400")}>Exports</dt>
                <dd className="m-0 mt-0.5 text-neutral-800 dark:text-neutral-200">Review, finalized review record, audit trail</dd>
              </div>
            </dl>
          ) : null}
          {(aggregateRiskPosture ?? "").trim().toLowerCase() === "approved with monitoring" ? (
            <p
              className={cn("m-0 mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}
              data-testid="buyer-approved-with-monitoring-definition"
            >
              {BUYER_APPROVED_WITH_MONITORING_DEFINITION}
            </p>
          ) : null}
        </div>
      ) : null}
      {!hidePromotedStatus ? (
      <p
        className={cn(
          "m-0 rounded-md border border-neutral-200 bg-al-surface-raised font-medium leading-snug dark:border-neutral-800",
          OPERATOR_CARD.nested,
          OPERATOR_TYPOGRAPHY.body,
        )}
        role="status"
        data-testid="buyer-review-disposition-line"
      >
        {buildBuyerReviewPackageDispositionLine({
          hasGoldenManifest,
          findingCountDisplay,
          warningCountDisplay,
          unresolvedIssueCountDisplay,
          governanceGateLabel,
          aggregateRiskPosture,
        })}
      </p>
      ) : null}
      {typeof warningCountDisplay === "number" && warningCountDisplay > 0 ? (
        <details className={cn("mt-2 leading-relaxed text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          <summary className={cn("cursor-pointer font-medium text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
            How monitored risks are counted
          </summary>
          <p className="m-0 mt-2" data-testid="buyer-review-monitored-risk-clarifier">
            {BUYER_REVIEW_MONITORED_RISK_COUNT_CLARIFIER}
          </p>
        </details>
      ) : null}
      <RunDetailPackageStatusStrip
        manifestId={manifestId}
        hasGoldenManifest={hasGoldenManifest}
        warningCountDisplay={warningCountDisplay}
        findingCountDisplay={findingCountDisplay}
        aggregateRiskPosture={aggregateRiskPosture}
        artifactCount={artifactCount}
        governanceGateLabel={governanceGateLabel}
        showcasePolicyPackStrip={showcasePolicyPackStrip ?? null}
        pagePrimaryOwnedElsewhere={pagePrimaryOwnedElsewhere}
      />
      <details className="rounded-lg border border-neutral-200 bg-neutral-50/50 dark:border-neutral-800 dark:bg-neutral-900/30">
        <summary className={cn("cursor-pointer select-none font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_CARD.nested, OPERATOR_TYPOGRAPHY.body)}>
          {BUYER_DECISION_KEY_SUMMARY}
        </summary>
        <div className="border-t border-neutral-200 px-3 py-3 dark:border-neutral-800">
          <ReviewOutcomeTaxonomyLegend />
        </div>
      </details>
    </div>
  );
  }

  const unresolvedTrunc =
    typeof unresolvedIssueCountDisplay === "number" && Number.isFinite(unresolvedIssueCountDisplay)
      ? Math.trunc(unresolvedIssueCountDisplay)
      : null;

  const warningsLine = manifestWarningsSecondaryCopy(warningCountDisplay);

  const findingsCardEl = (
    <Card className="h-full border-neutral-200 dark:border-neutral-800">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Findings</CardTitle>
        <CardDescription>
          {manifestId ? "From architecture review — click to jump" : "From architecture review"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">
        <p className="m-0 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {finiteIntegerCountDisplay(findingCountDisplay)}
        </p>
        {unresolvedTrunc !== null && unresolvedTrunc > 0 ? (
          <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {unresolvedTrunc} unresolved in this review record
          </p>
        ) : null}
      </CardContent>
    </Card>
  );

  const artifactsCardEl = (
    <Card className="h-full border-neutral-200 dark:border-neutral-800">
      <CardHeader className={OPERATOR_CARD.header}>
        <CardTitle className={cn("text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>Artifacts</CardTitle>
        <CardDescription>{manifestId ? "Generated outputs — click to jump" : "Generated outputs"}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="m-0 text-lg font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">
          {finiteIntegerCountDisplay(artifactCount)}
        </p>
        <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>Attached when the review record is finalized</p>
      </CardContent>
    </Card>
  );

  return (
    <div className={OPERATOR_LAYOUT.sectionStack}>
      {coverageBanner}
      {dispositionPanel}
      <section aria-label="Review outcomes" className={cn("grid sm:grid-cols-2 xl:grid-cols-4", OPERATOR_LAYOUT.controlClusterGap)}>
      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={cn("text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>{SIGNED_MANIFEST_LABEL}</CardTitle>
          <CardDescription>Reviewed architecture record</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <p
            className={cn(
              "m-0 font-semibold text-al-text-primary",
              OPERATOR_TYPOGRAPHY.body,
              hasGoldenManifest ? "text-emerald-700 dark:text-emerald-400" : "text-amber-800 dark:text-amber-200",
            )}
          >
            {hasGoldenManifest ? "Finalized" : "Awaiting finalize"}
          </p>
          {warningsLine !== null ? (
            <p className={cn("m-0 mt-1 tabular-nums text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}>{warningsLine}</p>
          ) : null}
          <p className={cn("mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            {hasGoldenManifest
              ? "Finalized review record is pinned to this review."
              : "Finalize from the finalize control when ready."}
          </p>
          {governanceGateLabel !== null && governanceGateLabel !== undefined && governanceGateLabel.length > 0 ? (
            <p className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              <span className="font-medium text-neutral-800 dark:text-neutral-200">{approvalStatusLabel}:</span>{" "}
              {governanceGateLabel}
            </p>
          ) : null}
          {hasGoldenManifest && manifestId !== null && manifestId !== undefined && manifestId.trim().length > 0 ? (
            <Link
              className={cn("mt-2 inline-block", supplementaryNavLinkClass)}
              href={signedRecordDetailPath(manifestId.trim())}
              data-testid="run-detail-open-signed-record-link"
            >
              {BUYER_OPEN_SIGNED_RECORD_CTA}
            </Link>
          ) : null}
        </CardContent>
      </Card>

      {manifestId ? (
        <Link href="#run-explanation" className={samePageJumpClass}>
          {findingsCardEl}
        </Link>
      ) : (
        findingsCardEl
      )}

      {manifestId ? (
        <Link href="#artifacts-exports" className={samePageJumpClass}>
          {artifactsCardEl}
        </Link>
      ) : (
        artifactsCardEl
      )}

      <Card className="border-neutral-200 dark:border-neutral-800">
        <CardHeader className={OPERATOR_CARD.header}>
          <CardTitle className={cn("text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>In-page activity</CardTitle>
          <CardDescription>Shortcuts on this review — the authoritative timeline is the Audit trail.</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Link
            className={supplementaryNavLinkClass}
            href="#authority-chain"
          >
            Jump to activity timeline on this page
          </Link>
          <Link
            className={cn("mt-2 block", supplementaryNavLinkClass)}
            href={`/architecture/reviews/${encodeURIComponent(runId)}/provenance`}
          >
            Full provenance view
          </Link>
          <Link
            className={cn("mt-2 block", supplementaryNavLinkClass)}
            href={`/showcase/${encodeURIComponent(runId)}`}
          >
            Completed output (public showcase)
          </Link>
          <p className={cn("mt-2 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            Timeline and audit identifiers stay below — start here after the sample review.
          </p>
        </CardContent>
      </Card>
    </section>
    </div>
  );
}
