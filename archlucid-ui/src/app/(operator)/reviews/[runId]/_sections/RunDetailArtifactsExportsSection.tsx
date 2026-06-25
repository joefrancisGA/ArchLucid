import Link from "next/link";
import type { ReactElement } from "react";

import { DecisionReceiptExportButton } from "@/components/draft-intake/DecisionReceiptExportButton";
import { ArtifactListTable } from "@/components/ArtifactListTable";
import { BuyerDeliverablesArtifactTabs } from "@/components/BuyerDeliverablesArtifactTabs";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ConsultingDocxExportButton } from "@/components/ConsultingDocxExportButton";
import { ExportTerraformAdvisoryButton } from "@/components/ExportTerraformAdvisoryButton";
import { FunnelTelemetryExportAnchor } from "@/components/FunnelTelemetryExportAnchor";
import { GoldenManifestExportMenu } from "@/components/GoldenManifestExportMenu";
import { ReviewBoardWhitelabelConsultingExportButton } from "@/components/ReviewBoardWhitelabelConsultingExportButton";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import {
  OperatorEmptyState,
  OperatorMalformedCallout,
} from "@/components/OperatorShellMessage";
import { OperatorSectionRetryButton } from "@/components/OperatorSectionRetryButton";
import { Button } from "@/components/ui/button";
import {
  getArchitectureRequestDownloadUrl,
  getArtifactDownloadUrl,
  getBundleDownloadUrl,
  getRunExportDownloadUrl,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { isExportableDecisionVerdict } from "@/lib/decision-receipt-export";
import type { ArtifactDescriptor, ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
  /** Curated demo: show policy-pack diligence line above the table. */
  readonly samplePolicyPackContextLine: string | null;
  readonly requestId?: string | null;
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
    samplePolicyPackContextLine,
    requestId,
  } = props;

  const feasibilityVerdict = resolveFeasibilityVerdict(manifestSummaryForUi, manifestSummary);
  const showDecisionReceipt =
    feasibilityVerdict !== null && isExportableDecisionVerdict(feasibilityVerdict.kind);

  return (
    <section id="artifacts-exports" className="scroll-mt-24">
        <CollapsibleSection
          title={buyerPolishedArtifactTable ? "Deliverables" : "Artifacts & exports"}
          defaultOpen={!buyerPolishedArtifactTable}
        >
          <p className={cn("m-0 mb-4 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Review the manifest&apos;s decisions, findings, and structured metadata. Download artifacts for offline review
            below.
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
            <Button variant="primary" asChild>
              <FunnelTelemetryExportAnchor href={getArtifactDownloadUrl(manifestId, "architecture-review-board")}>
                Download Sponsor Export (DOCX)
              </FunnelTelemetryExportAnchor>
            </Button>
            {requestId ? (
              <Button variant="secondary" asChild>
                <FunnelTelemetryExportAnchor href={getArchitectureRequestDownloadUrl(requestId)} download={`ArchitectureRequest-${requestId}.json`}>
                  Download Request JSON
                </FunnelTelemetryExportAnchor>
              </Button>
            ) : null}
          </div>
          {buyerPolishedArtifactTable ? (
            <div className="m-0 mb-3 space-y-2">
              {samplePolicyPackContextLine !== null && samplePolicyPackContextLine.trim().length > 0 ? (
                <p className={cn("m-0 max-w-prose rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 font-medium text-al-text-primary dark:border-neutral-700 dark:bg-neutral-900/50", OPERATOR_TYPOGRAPHY.helper)}>
                  {samplePolicyPackContextLine.trim()}
                </p>
              ) : null}
              <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                Rows are grouped by executive and review-board consumers.{" "}
                <strong className="text-neutral-800 dark:text-neutral-200">Download evidence package</strong> is the
                diligence bundle.{" "}
                <strong className="text-neutral-800 dark:text-neutral-200">Download review summary</strong> captures a concise
                narrative handoff aligned to this manifest.
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
                    Try reloading, or return to the review. You can still use <strong>Download evidence package</strong> when
                    the bundle is available.
                  </>
                ) : (
                  <>
                    The artifacts request failed (network, 404, or server error)—distinct from an empty list or malformed
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
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {buyerPolishedArtifactTable
                  ? "Try reloading, or return to the review. ZIP download may still work."
                  : "Try reloading, or return to the review detail page. Bundle download may still work."}
              </p>
            </>
          ) : null}

          {!artifactsFailure && !artifactsMalformed && artifacts.length === 0 ? (
            showDecisionReceipt ? (
              <OperatorEmptyState title="Decision delivered — design not feasible">
                <div className="flex flex-col items-center justify-center space-y-3 py-4 text-center">
                  <p className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    A defensible &ldquo;no&rdquo; is a complete deliverable. Export the decision receipt for audit,
                    sponsor handoff, or portfolio records.
                  </p>
                  <DecisionReceiptExportButton
                    context={{
                      source: "committed-run",
                      runId,
                      verdict: feasibilityVerdict,
                    }}
                  />
                </div>
              </OperatorEmptyState>
            ) : (
              <OperatorEmptyState title="No artifacts generated yet">
                <div className="flex flex-col items-center justify-center space-y-2 py-4 text-center">
                  <p className={cn("m-0 font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    No artifacts generated yet. Wait for the review to commit.
                  </p>
                </div>
              </OperatorEmptyState>
            )
          ) : null}

          {!artifactsFailure && !artifactsMalformed && artifacts.length > 0 ? (
            buyerPolishedArtifactTable ? (
              <BuyerDeliverablesArtifactTabs manifestId={manifestId} runId={runId} artifacts={artifacts} />
            ) : (
              <ArtifactListTable
                manifestId={manifestId}
                artifacts={artifacts}
                runId={runId}
                sponsorMode={buyerPolishedArtifactTable}
                audienceSections={buyerPolishedArtifactTable}
              />
            )
          ) : null}

          <div className="mt-4 flex flex-col gap-3">
            {buyerPolishedArtifactTable ? (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="primary" size="sm" asChild>
                  <FunnelTelemetryExportAnchor href={getBundleDownloadUrl(manifestId)}>
                    Download evidence package
                  </FunnelTelemetryExportAnchor>
                </Button>
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
                <Button variant="outline" size="sm" asChild>
                  <FunnelTelemetryExportAnchor href={getBundleDownloadUrl(manifestId)}>Download bundle (ZIP)</FunnelTelemetryExportAnchor>
                </Button>
                <ConsultingDocxExportButton runId={runId} />
                <ReviewBoardWhitelabelConsultingExportButton runId={runId} />
                <ExportTerraformAdvisoryButton runId={runId} />
              </div>
            )}
            {buyerPolishedArtifactTable ? null : (
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="outline" size="sm" asChild>
                  <FunnelTelemetryExportAnchor href={getRunExportDownloadUrl(runId)}>
                    Download review export (ZIP)
                  </FunnelTelemetryExportAnchor>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link href={comparePageHrefAdaptive(runId)}>Compare with another review</Link>
                </Button>
                <Button variant="ghost" size="sm" className="text-teal-800 dark:text-teal-300" asChild>
                  <Link href={`/ask?runId=${encodeURIComponent(runId)}`}>Ask about this review</Link>
                </Button>
              </div>
            )}
          </div>
        </CollapsibleSection>
    </section>
  );
}
