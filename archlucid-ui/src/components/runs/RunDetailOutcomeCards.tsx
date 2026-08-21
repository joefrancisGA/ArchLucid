"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ReviewOutcomeTaxonomyLegend } from "@/components/ReviewOutcomeTaxonomyLegend";
import { GovernanceStatusTag } from "@/components/governance/GovernanceStatusTag";
import { StatusTag } from "@/components/ui/status-tag";
import { useNavCommittedArchitectureReview } from "@/components/operator/OperatorNavAuthorityProvider";
import { BUYER_APPROVED_WITH_MONITORING_DEFINITION, BUYER_DECISION_KEY_SUMMARY, BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK, BUYER_OPEN_SIGNED_RECORD_CTA, BUYER_REVIEW_DETAIL_EVIDENCE_BASIS_LINE, BUYER_REVIEW_MONITORED_RISK_COUNT_CLARIFIER } from "@/lib/buyer/buyer-polish-copy";
import { CORE_PILOT_PATH_STREAMLINED_LABELS, isStreamlinedCorePilotPath } from "@/lib/vocabulary/core-pilot-path-vocabulary";
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
  "block rounded-lg no-underline outline-none ring-offset-2 transition hover:ring-2 hover:ring-teal-500/40 focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950";

const stripShell =
  "rounded-lg border border-neutral-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-950/30";

function DegradedFindingCoverageBanner({
  failedEngineLabels,
}: {
  readonly failedEngineLabels: readonly string[];
}) {
  const labelText =
    failedEngineLabels.length > 0
      ? failedEngineLabels.join(", ")
      : "one or more finding engines";

  return (
    <div
      className={cn(
        "rounded-md border border-amber-600/40 bg-al-surface-raised p-3 text-al-text-primary dark:border-amber-700/50",
        OPERATOR_TYPOGRAPHY.body,
      )}
      data-testid="degraded-finding-coverage-banner"
      role="status"
    >
      <p className="m-0 font-semibold">Degraded finding coverage</p>
      <p className={cn("m-0 mt-1 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}>
        This review completed with incomplete finding-engine coverage ({labelText}). Treat unresolved findings as
        advisory until coverage is restored.
      </p>
    </div>
  );
}

function finiteCoverageCount(value: number | null | undefined): number {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.trunc(value)) : 0;
}

function FindingCoverageDispositionPanel({
  summary,
}: {
  readonly summary: NonNullable<RunDetailOutcomeCardsProps["findingCoverageSummary"]>;
}) {
  const disposition = summary.dispositionCoverage;

  if (disposition === null || disposition === undefined) {
    return null;
  }

  const rows = [
    ["Open", disposition.openCount],
    ["Accepted", disposition.acceptedCount],
    ["Remediated", disposition.remediatedCount],
    ["Deferred", disposition.deferredCount],
    ["Needs evidence", disposition.needsEvidenceCount],
    ["Rejected / N/A", disposition.rejectedNotApplicableCount],
    ["Waived", disposition.waivedCount],
  ] as const;

  return (
    <section
      className={cn(
        "rounded-lg border px-3 py-3",
        OPERATOR_TYPOGRAPHY.body,
        summary.hasCommitBlockingFailures === true
          ? "border-rose-600/40 bg-al-surface-raised text-al-text-primary dark:border-rose-800/50"
          : "border-neutral-200 bg-neutral-50/80 text-neutral-900 dark:border-neutral-800 dark:bg-neutral-900/40 dark:text-neutral-100",
      )}
      data-testid="finding-coverage-disposition-panel"
      role={summary.hasCommitBlockingFailures === true ? "alert" : "status"}
    >
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <p className="m-0 font-semibold">
          {summary.hasCommitBlockingFailures === true
            ? "Commit-blocking finding coverage"
            : "Finding disposition coverage"}
        </p>
        <p className={cn("m-0", OPERATOR_TYPOGRAPHY.helper, "text-current/80")}>
          Engines {finiteCoverageCount(summary.enginesSucceeded)}/{finiteCoverageCount(summary.enginesAttempted)} succeeded
          {finiteCoverageCount(summary.enginesFailed) > 0 ? ` · ${finiteCoverageCount(summary.enginesFailed)} failed` : ""}
        </p>
      </div>
      {summary.hasCommitBlockingFailures === true ? (
        <p className={cn("m-0 mt-2 leading-relaxed", OPERATOR_TYPOGRAPHY.helper)}>
          Finalization should remain blocked until the coverage gap is resolved or explicitly regenerated.
        </p>
      ) : null}
      <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-md bg-white/65 px-2 py-1.5 dark:bg-black/15">
            <dt className={cn(OPERATOR_NAV_GROUP_LABEL, "opacity-70")}>{label}</dt>
            <dd className={cn("m-0 font-semibold tabular-nums text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{finiteCoverageCount(value)}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function manifestWarningsSecondaryCopy(warningCountDisplay: number | null): string | null {
  if (typeof warningCountDisplay !== "number" || !Number.isFinite(warningCountDisplay)) {
    return null;
  }

  const n = Math.trunc(warningCountDisplay);

  if (n <= 0) {
    return null;
  }

  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  if (buyerPolishedShell) {
    return `${n} monitored risk${n === 1 ? "" : "s"} (PHI minimization)`;
  }

  return `${n} review warning${n === 1 ? "" : "s"} (PHI minimization)`;
}

function buyerFindingSeveritySignal(
  findingCountDisplay: number | null,
  aggregateRiskPosture: string | null | undefined,
): string | null {
  const n =
    typeof findingCountDisplay === "number" && Number.isFinite(findingCountDisplay)
      ? Math.trunc(findingCountDisplay)
      : null;

  if (n === null || n <= 0) {
    return null;
  }

  const raw = aggregateRiskPosture?.trim() ?? "";

  if (raw.length === 0) {
    return null;
  }

  const key = raw.toLowerCase();

  if (key === "not rated" || key === "low") {
    return null;
  }

  if (n === 1 && (key === "high" || key === "critical")) {
    return `${raw.charAt(0).toUpperCase()}${raw.slice(1).toLowerCase()} severity`;
  }

  if (key === "high" || key === "critical") {
    return `Includes ${key}-severity items`;
  }

  if (key === "medium") {
    return "Medium risk posture";
  }

  if (key === "approved with monitoring") {
    return "Approved with monitoring";
  }

  if (key === "controlled") {
    return "Mitigated and monitored";
  }

  if (key === "acceptable" || key === "accepted") {
    return "Residual risk accepted with documented controls";
  }

  if (key === "elevated") {
    return "Elevated — prioritize sponsor review";
  }

  if (key === "monitored") {
    return "Monitored pending validation";
  }

  const capitalized = `${raw.charAt(0).toUpperCase()}${raw.slice(1).toLowerCase()}`;

  return `${capitalized} posture — confirm meaning with approvals`;
}

function stripSegmentLabelClass(): string {
  return cn("m-0", OPERATOR_NAV_GROUP_LABEL);
}

function useStreamlinedPilotOutcomeLabels(): {
  readonly evaluationStandardsLabel: string;
  readonly approvalStatusLabel: string;
} {
  const hasCommittedArchitectureReview = useNavCommittedArchitectureReview();
  const streamlinedPilotPath = isStreamlinedCorePilotPath(hasCommittedArchitectureReview);

  return {
    evaluationStandardsLabel: streamlinedPilotPath
      ? CORE_PILOT_PATH_STREAMLINED_LABELS.evaluationStandards
      : "Policy pack",
    approvalStatusLabel: streamlinedPilotPath
      ? CORE_PILOT_PATH_STREAMLINED_LABELS.reviewApproval
      : "Resolve outcomes",
  };
}

type PackageStatusStripProps = {
  manifestId: string | null | undefined;
  hasGoldenManifest: boolean;
  warningCountDisplay: number | null;
  findingCountDisplay: number | null;
  aggregateRiskPosture: string | null | undefined;
  artifactCount: number;
  governanceGateLabel: string | null | undefined;
  showcasePolicyPackStrip: ShowcasePolicyPackStripLink | null | undefined;
  readonly pagePrimaryOwnedElsewhere?: boolean;
};

function PackageStatusStrip(props: PackageStatusStripProps) {
  const { evaluationStandardsLabel, approvalStatusLabel } = useStreamlinedPilotOutcomeLabels();
  const inlineLinkClass =
    props.pagePrimaryOwnedElsewhere === true ? OPERATOR_LINK.optional : OPERATOR_LINK.inline;
  const trimmedManifestId = props.manifestId?.trim() ?? "";
  const hasManifest = trimmedManifestId.length > 0;
  const warningsLine = manifestWarningsSecondaryCopy(props.warningCountDisplay);
  const findingN =
    typeof props.findingCountDisplay === "number" && Number.isFinite(props.findingCountDisplay)
      ? Math.trunc(props.findingCountDisplay)
      : null;
  const warningN =
    typeof props.warningCountDisplay === "number" && Number.isFinite(props.warningCountDisplay)
      ? Math.trunc(props.warningCountDisplay)
      : null;
  const findingsWord = findingN === 1 ? "finding" : "findings";
  const findingsPrimary =
    findingN !== null && findingN >= 0
      ? isBuyerPolishedOperatorShellEnv() && warningN !== null && warningN > 0
        ? BUYER_FINDINGS_COUNT_WITH_MONITORED_RISK(findingN, warningN)
        : `${findingN} ${findingsWord}`
      : finiteIntegerCountDisplay(props.findingCountDisplay);
  const severitySignal = buyerFindingSeveritySignal(props.findingCountDisplay, props.aggregateRiskPosture);
  const gate =
    props.governanceGateLabel !== null &&
    props.governanceGateLabel !== undefined &&
    props.governanceGateLabel.trim().length > 0
      ? props.governanceGateLabel.trim()
      : "—";

  const segmentInner = "min-w-0 flex-1 px-3 py-3 sm:px-4";
  const valueClass = cn("m-0 font-semibold tabular-nums text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body);
  const detailClass = cn("m-0 mt-0.5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper);

  const packageBody = (
    <>
      {props.hasGoldenManifest ? (
        <StatusTag kind="ready" label="Finalized" aria-label="Package state: finalized" />
      ) : (
        <StatusTag kind="in-progress" label="In progress" aria-label="Package state: in progress" />
      )}
      {warningsLine !== null ? <p className={detailClass}>{warningsLine}</p> : null}
    </>
  );

  const findingsBody = (
    <>
      <p className={valueClass}>{findingsPrimary}</p>
      {severitySignal !== null ? <p className={detailClass}>{severitySignal}</p> : null}
    </>
  );

  return (
    <section
      role="status"
      aria-label="Review status summary"
      className={cn(stripShell, "flex flex-col divide-y divide-neutral-200 sm:flex-row sm:divide-x sm:divide-y-0 dark:divide-neutral-700")}
    >
      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Package state</p>
        <div className="mt-1">
          {props.hasGoldenManifest && hasManifest ? (
            <Link
              href={signedRecordDetailPath(trimmedManifestId)}
              className={cn("block rounded outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950", inlineLinkClass)}
              data-testid="run-detail-finalized-package-link"
            >
              {packageBody}
            </Link>
          ) : (
            packageBody
          )}
        </div>
      </div>

      {props.showcasePolicyPackStrip !== null &&
      props.showcasePolicyPackStrip !== undefined &&
      props.showcasePolicyPackStrip.href.trim().length > 0 &&
      props.showcasePolicyPackStrip.label.trim().length > 0 ? (
        <div className={segmentInner}>
          <p className={stripSegmentLabelClass()}>{evaluationStandardsLabel}</p>
          <div className="mt-1">
            <Link
              href={props.showcasePolicyPackStrip.href.trim()}
              className={cn("block rounded outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950", inlineLinkClass)}
            >
              <p className={valueClass}>{props.showcasePolicyPackStrip.label.trim()}</p>
              <p className={detailClass}>Read-only pack rules and version</p>
            </Link>
          </div>
        </div>
      ) : null}

      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Findings</p>
        <div className="mt-1">
          {hasManifest ? (
            <Link
              href="#run-explanation"
              className={cn("block rounded outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950", inlineLinkClass)}
            >
              {findingsBody}
            </Link>
          ) : (
            findingsBody
          )}
        </div>
      </div>

      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Deliverables</p>
        <div className="mt-1">
          {hasManifest ? (
            <Link
              href="#artifacts-exports"
              className={cn("block rounded outline-none ring-offset-2 focus-visible:ring-2 focus-visible:ring-teal-600 dark:ring-offset-neutral-950", inlineLinkClass)}
            >
              <p className={valueClass}>{finiteIntegerCountDisplay(props.artifactCount)}</p>
              <p className={detailClass}>Export-ready deliverables</p>
            </Link>
          ) : (
            <>
              <p className={valueClass}>{finiteIntegerCountDisplay(props.artifactCount)}</p>
              <p className={detailClass}>Export-ready deliverables</p>
            </>
          )}
        </div>
      </div>

      <div className={segmentInner}>
        <p className={stripSegmentLabelClass()}>Approval status</p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {gate !== "—" ? (
            <GovernanceStatusTag status={gate} aria-label={`${approvalStatusLabel}: ${gate}`} />
          ) : (
            <p className={cn(valueClass, "mt-0")}>{gate}</p>
          )}
        </div>
      </div>
    </section>
  );
}

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
    findingCoverageSummary !== null ? <FindingCoverageDispositionPanel summary={findingCoverageSummary} /> : null;

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
      <PackageStatusStrip
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
