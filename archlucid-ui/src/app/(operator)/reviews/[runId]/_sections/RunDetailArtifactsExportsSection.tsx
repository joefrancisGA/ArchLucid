import Link from "next/link";
import type { ReactElement } from "react";

import { ArtifactListTable } from "@/components/ArtifactListTable";
import { BuyerDeliverablesArtifactTabs } from "@/components/BuyerDeliverablesArtifactTabs";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ContextualHelp } from "@/components/ContextualHelp";
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
  getBundleDownloadUrl,
  getRunExportDownloadUrl,
} from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import type { ArtifactDescriptor, ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";

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
};

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
  } = props;

  return (
    <section id="artifacts-exports" className="scroll-mt-24">
      <div className="relative overflow-visible pr-9 sm:pr-10">
        <div className="absolute end-0 top-0 z-10 sm:end-1 sm:top-1">
          <ContextualHelp helpKey="manifest-review" placement="left" />
        </div>
        <CollapsibleSection
          title={buyerPolishedArtifactTable ? "Deliverables" : "Artifacts & exports"}
          defaultOpen
        >
          {buyerPolishedArtifactTable ? (
            <div className="m-0 mb-3 space-y-2">
              {samplePolicyPackContextLine !== null && samplePolicyPackContextLine.trim().length > 0 ? (
                <p className="m-0 max-w-prose rounded-md border border-neutral-200 bg-neutral-50/80 px-3 py-2 text-xs font-medium text-neutral-800 dark:border-neutral-700 dark:bg-neutral-900/50 dark:text-neutral-200">
                  {samplePolicyPackContextLine.trim()}
                </p>
              ) : null}
              <p className="m-0 max-w-prose text-sm text-neutral-600 dark:text-neutral-400">
                Rows are grouped by sponsor and review-board consumers.{" "}
                <strong className="text-neutral-800 dark:text-neutral-200">Download evidence package</strong> is the
                diligence bundle.{" "}
                <strong className="text-neutral-800 dark:text-neutral-200">Download review summary</strong> captures a concise
                narrative handoff aligned to this manifest.
              </p>
            </div>
          ) : null}
          {artifactsFailure ? (
            <>
              <p className="m-0 mb-2 text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                {buyerPolishedArtifactTable ? "Deliverables list could not be loaded." : "Artifact list could not be loaded."}
              </p>
              <OperatorApiProblem
                problem={artifactsFailure.problem}
                fallbackMessage={artifactsFailure.message}
                correlationId={artifactsFailure.correlationId}
                variant="warning"
              />
              <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
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
              <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
                {buyerPolishedArtifactTable
                  ? "Try reloading, or return to the review. ZIP download may still work."
                  : "Try reloading, or return to the review detail page. Bundle download may still work."}
              </p>
            </>
          ) : null}

          {!artifactsFailure && !artifactsMalformed && artifacts.length === 0 ? (
          <OperatorEmptyState title="No artifacts generated yet">
            <div className="flex flex-col items-center justify-center space-y-2 py-4 text-center">
              <p className="m-0 text-sm font-medium text-neutral-500">
                No artifacts generated yet. Wait for the review to commit.
              </p>
            </div>
          </OperatorEmptyState>
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
      </div>
    </section>
  );
}
