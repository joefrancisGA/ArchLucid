"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { ReactElement } from "react";

import { DecisionReceiptExportButton } from "@/components/draft-intake/DecisionReceiptExportButton";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import { BuyerDeliverablesArtifactTabs } from "@/components/BuyerDeliverablesArtifactTabs";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ConsultingDocxExportButton } from "@/components/ConsultingDocxExportButton";
import { EnterpriseCompactEmptyState } from "@/components/EnterpriseCompactEmptyState";
import { ExportTerraformAdvisoryButton } from "@/components/ExportTerraformAdvisoryButton";
import { ExportFormatWhenToUseHint } from "@/components/ExportFormatWhenToUseHint";
import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { GoldenManifestExportMenu } from "@/components/GoldenManifestExportMenu";
import { ReviewBoardWhitelabelConsultingExportButton } from "@/components/ReviewBoardWhitelabelConsultingExportButton";
import { RunScopedAuditExportButton } from "@/components/runs/RunScopedAuditExportButton";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { FatalPageReportProblemSupportRow } from "@/components/support/FatalPageReportProblemAction";
import {
  OperatorMalformedCallout,
} from "@/components/operator/OperatorShellMessage";
import { OperatorSectionRetryButton } from "@/components/operator/OperatorSectionRetryButton";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  getArchitectureRequestDownloadUrl,
  getBundleDownloadUrl,
  getRunExportDownloadUrl,
  getRunPackageExportUrl,
  SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { BUYER_MANIFEST_DELIVERABLES_HEADING } from "@/lib/buyer/buyer-polish-copy";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { isExportableDecisionVerdict } from "@/lib/decision-receipt-export";
import type { ArtifactDescriptor, ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import { OPERATOR_LINK, OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR } from "@/lib/first-week-route-guidance";
import { RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT, RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT } from "@/lib/enterprise-compact-empty-state-presets";
import {
  RUN_DETAIL_DELIVERABLES_BUYER_TABLE_LEAD,
  RUN_DETAIL_DELIVERABLES_INTRO,
} from "@/lib/runs/run-detail-deliverables-copy";

export type RunDetailArtifactsExportsSectionProps = {
  readonly manifestId: string;
  readonly runId: string;
  readonly buyerPolishedArtifactTable: boolean;
  readonly artifacts: ArtifactDescriptor[];
  readonly artifactsFailure: ApiLoadFailureState | null;
  readonly artifactsMalformed: string | null;
  readonly goldenManifestJsonForExport: unknown | null;
  readonly manifestSummaryForUi: ManifestSummary | null;
  readonly manifestSummary: ManifestSummary | null;
  readonly trustEvidenceCard: RunTrustEvidenceCard | null | undefined;
  readonly requestId?: string | null;
  /** When set, overrides buyer-polished default collapsed deliverables accordion. */
  readonly deliverablesDefaultOpen?: boolean;
  /** Curated sample review — no backend export target for architecture-review-board DOCX. */
  readonly usedStaticDemoRun?: boolean;
};

function resolveFeasibilityVerdict(
  manifestSummaryForUi: ManifestSummary | null,
  manifestSummary: ManifestSummary | null,
): ManifestFeasibilityVerdict | null {
  const verdict = manifestSummaryForUi?.feasibilityVerdict ?? manifestSummary?.feasibilityVerdict;

  if (verdict === undefined || verdict === null) {
    return null;
  }

  return verdict;
}

export function RunDetailArtifactsExportsSection(
  props: RunDetailArtifactsExportsSectionProps,
): ReactElement {
  const {
    manifestId,
    runId,
    buyerPolishedArtifactTable,
    artifacts,
    artifactsFailure,
    artifactsMalformed,
    goldenManifestJsonForExport,
    manifestSummaryForUi,
    manifestSummary,
    trustEvidenceCard,
    requestId,
    deliverablesDefaultOpen,
    usedStaticDemoRun = false,
  } = props;

  const feasibilityVerdict = resolveFeasibilityVerdict(manifestSummaryForUi, manifestSummary);
  const showDecisionReceipt =
    feasibilityVerdict !== null && isExportableDecisionVerdict(feasibilityVerdict.kind);
  const deliverablesSectionDefaultOpen =
    deliverablesDefaultOpen ?? !buyerPolishedArtifactTable;

  return (
    <section id="artifacts-exports" className="scroll-mt-24">
        <CollapsibleSection
          title={BUYER_MANIFEST_DELIVERABLES_HEADING}
          headingLevel={3}
          defaultOpen={deliverablesSectionDefaultOpen}
        >
          <p className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.body)}>
            {RUN_DETAIL_DELIVERABLES_INTRO}
          </p>
          <div className="mb-4 flex flex-wrap gap-3">
            {showDecisionReceipt ? (
              <DecisionReceiptExportButton
                context={{
                  source: "committed-run",
                  runId,
                  verdict: feasibilityVerdict,
                }}
              />
            ) : null}
            {/* Exports stay secondary — the review's recommended next step owns the only primary affordance. */}
            {usedStaticDemoRun ? (
              <div className={cn("flex flex-col gap-1.5", OPERATOR_SHORT_HELPER_MEASURE_CLASS)}>
                <Button variant="outline" disabled aria-describedby="run-detail-docx-export-disabled-hint">
                  Download architecture review report (DOCX)
                </Button>
                <ExportFormatWhenToUseHint format="docx" />
                <p
                  id="run-detail-docx-export-disabled-hint"
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                >
                  {SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT}
                </p>
              </div>
            ) : (
              <div className={cn("flex flex-col gap-1", OPERATOR_SHORT_HELPER_MEASURE_CLASS)}>
                <ExportTrackedAnchor
                  className={buttonVariants({ variant: "outline" })}
                  href={getRunPackageExportUrl(runId, "docx")}
                >
                  Download architecture review report (DOCX)
                </ExportTrackedAnchor>
                <ExportFormatWhenToUseHint format="docx" />
              </div>
            )}
            {requestId ? (
              <ExportTrackedAnchor
                className={buttonVariants({ variant: "secondary" })}
                href={getArchitectureRequestDownloadUrl(requestId)}
                download={`ArchitectureRequest-${requestId}.json`}
              >
                Download Request JSON
              </ExportTrackedAnchor>
            ) : null}
          </div>
          {buyerPolishedArtifactTable ? (
            <div className="m-0 mb-3 space-y-2">
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.body)}>
                {RUN_DETAIL_DELIVERABLES_BUYER_TABLE_LEAD}
              </p>
            </div>
          ) : null}
          {artifactsFailure ? (
            <>
              <p className={cn("m-0 mb-2 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {buyerPolishedArtifactTable ? "Deliverables list could not be loaded." : "Artifact list could not be loaded."}
              </p>
              <OperatorApiProblem
                problem={artifactsFailure.problem}
                fallbackMessage={artifactsFailure.message}
                correlationId={artifactsFailure.correlationId}
                variant="warning"
              />
              <p className={cn("mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {buyerPolishedArtifactTable ? (
                  <>
                    Try reloading, or return to the review. You can still use <strong>Download evidence bundle</strong> when
                    the bundle is available.
                  </>
                ) : (
                  <>
                    The artifacts request failed (network, 404, or server error — istinct from an empty list or malformed
                    JSON.
                  </>
                )}
              </p>
              <OperatorSectionRetryButton
                label={buyerPolishedArtifactTable ? "Retry loading deliverables" : "Retry loading artifacts"}
              />
            </>
          ) : null}

          {!artifactsFailure && artifactsMalformed ? (
            <>
              <OperatorMalformedCallout>
                <strong>
                  {buyerPolishedArtifactTable
                    ? "Deliverables response was not usable."
                    : "Artifact list response was not usable."}
                </strong>
                <p className="mt-2">{artifactsMalformed}</p>
              </OperatorMalformedCallout>
              <FatalPageReportProblemSupportRow
                surfaceId="review-commit-export-page-failure"
                errorTitle={
                  buyerPolishedArtifactTable
                    ? "Deliverables response was not usable."
                    : "Artifact list response was not usable."
                }
                errorCode="malformed-response"
                reviewId={runId}
              />
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {buyerPolishedArtifactTable
                  ? "Try reloading, or return to the review. ZIP download may still work."
                  : "Try reloading, or return to the review detail page. Bundle download may still work."}
              </p>
            </>
          ) : null}

          {!artifactsFailure && !artifactsMalformed && artifacts.length === 0 ? (
            showDecisionReceipt ? (
              <EnterpriseCompactEmptyState
                {...RUN_DETAIL_DECISION_RECEIPT_EMPTY_COMPACT}
                footer={
                  <DecisionReceiptExportButton
                    context={{
                      source: "committed-run",
                      runId,
                      verdict: feasibilityVerdict,
                    }}
                  />
                }
              />
            ) : (
              <EnterpriseCompactEmptyState
                {...RUN_DELIVERABLES_PENDING_FINALIZE_COMPACT}
                actions={[
                  {
                    label: "Finalize this review",
                    href: BUYER_REVIEW_DETAIL_IN_PROGRESS_FINALIZE_ANCHOR,
                    variant: "primary",
                  },
                ]}
                footer={<OperatorSectionRetryButton label="Reload" />}
              />
            )
          ) : null}

          {!artifactsFailure && !artifactsMalformed && artifacts.length > 0 ? (
            <div className="w-full min-w-0">
              {buyerPolishedArtifactTable ? (
                <BuyerDeliverablesArtifactTabs manifestId={manifestId} runId={runId} artifacts={artifacts} />
              ) : (
                <ArtifactListTable
                  manifestId={manifestId}
                  artifacts={artifacts}
                  runId={runId}
                  sponsorMode={buyerPolishedArtifactTable}
                  audienceSections={buyerPolishedArtifactTable}
                />
              )}
            </div>
          ) : null}

          <div className="mt-4 flex flex-col gap-3">
            {buyerPolishedArtifactTable ? (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex max-w-[14rem] flex-col gap-1">
                  <ExportTrackedAnchor
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    href={getBundleDownloadUrl(manifestId)}
                  >
                    Download evidence bundle
                  </ExportTrackedAnchor>
                  <ExportFormatWhenToUseHint format="zip" />
                </div>
                <GoldenManifestExportMenu
                  runId={runId}
                  manifestId={manifestId}
                  goldenManifestJson={goldenManifestJsonForExport}
                  manifestSummary={manifestSummaryForUi ?? manifestSummary}
                  trustEvidenceCard={trustEvidenceCard ?? null}
                  buyerMarkdownAsPrimaryButton
                />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <GoldenManifestExportMenu
                  runId={runId}
                  manifestId={manifestId}
                  goldenManifestJson={goldenManifestJsonForExport}
                  manifestSummary={manifestSummaryForUi ?? manifestSummary}
                  trustEvidenceCard={trustEvidenceCard ?? null}
                />
                <div className="flex max-w-[14rem] flex-col gap-1">
                  <ExportTrackedAnchor
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    href={getBundleDownloadUrl(manifestId)}
                  >
                    Download bundle (ZIP)
                  </ExportTrackedAnchor>
                  <ExportFormatWhenToUseHint format="zip" />
                </div>
                <ConsultingDocxExportButton runId={runId} />
                <ReviewBoardWhitelabelConsultingExportButton runId={runId} />
                <ExportTerraformAdvisoryButton runId={runId} />
              </div>
            )}
            {buyerPolishedArtifactTable ? null : (
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex max-w-[14rem] flex-col gap-1">
                  <ExportTrackedAnchor
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                    href={getRunExportDownloadUrl(runId)}
                  >
                    Download review export (ZIP)
                  </ExportTrackedAnchor>
                  <ExportFormatWhenToUseHint format="zip" />
                </div>
                <RunScopedAuditExportButton runId={runId} />
                <Link
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), OPERATOR_LINK.nav)}
                  href={comparePageHrefAdaptive(runId)}
                >
                  Compare with another review
                </Link>
                <Link
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), OPERATOR_LINK.nav)}
                  href={`/insights/ask-review-questions?runId=${encodeURIComponent(runId)}`}
                >
                  Ask about this review
                </Link>
              </div>
            )}
          </div>
        </CollapsibleSection>
    </section>
  );
}
