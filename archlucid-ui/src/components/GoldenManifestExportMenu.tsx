"use client";

import { useState } from "react";

import { ExportFormatWhenToUseHint } from "@/components/ExportFormatWhenToUseHint";
import { OperatorErrorRecoveryContract } from "@/components/usability/OperatorErrorRecoveryContract";
import { DemoVsLiveChromeBanner } from "@/components/usability/DemoVsLiveChromeBanner";
import { useProductionDeskChrome } from "@/hooks/useProductionDeskChrome";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import {
  resolveCareerExportBlockedReason,
  type CareerExportClassificationCounts,
} from "@/lib/career-export-coverage-honesty";
import { evaluateCareerArtifactHonesty } from "@/lib/career-artifact/career-artifact-honesty";
import { resolveLegacySealedReExportHonesty } from "@/lib/career-artifact/resolve-legacy-sealed-re-export-honesty";
import { exportVerifyBlockedRecovery } from "@/lib/exports/export-verify-recovery-copy";
import {
  formatRunExportLineageStatusLabel,
  isRunExportLineageAttested,
  RUN_EXPORT_LINEAGE_INTEGRITY_CHECK_DISCLAIMER,
  verifyRunExportLineage,
} from "@/lib/exports/run-export-lineage-verify";
import {
  buildGoldenManifestMarkdownFilename,
  formatGoldenManifestMarkdown,
  isUsableGoldenManifestExportJson,
  triggerGoldenManifestMarkdownDownload,
} from "@/lib/export-markdown";
import { downloadManifestMarkdownExport } from "@/lib/api/manifest-markdown-export-api";
import { manifestMarkdownExportBlockedReason } from "@/lib/manifest/manifest-markdown-export-blocked-reason";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { manifestSummarySealedVersionForCopyGuard, runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import { EXPORT_FORMAT_MARKDOWN } from "@/lib/export-format-when-to-use";
import { recordFirstExportOpenedOnce } from "@/lib/first-tenant-funnel-telemetry";
import { StructuralExecutionModeWire } from "@/lib/structural-execution-mode";
import { cn } from "@/lib/utils";
import type { ManifestSummary, RunSummary, RunTrustEvidenceCard } from "@/types/authority";

export type GoldenManifestExportMenuProps = {
  runId: string;
  manifestId: string;
  goldenManifestJson: unknown | null;
  manifestSummary: ManifestSummary | null;
  trustEvidenceCard?: RunTrustEvidenceCard | null;
  /** Distinct engines that produced findings on this package snapshot (PC-01 / PC-13). */
  enginesSucceeded?: number | null;
  progressSummary?: RunSummary | null;
  graphSnapshot?: unknown;
  findingsSnapshot?: unknown;
  classificationCounts?: CareerExportClassificationCounts | null;
  /** Recorded aggregate quality-gate outcome when the parent already loaded agent evaluation (DR-05). */
  aggregateQualityGateOutcome?: number | null;
  /** Curated static demo run — drives demo/static export banner honesty (FC-73). */
  usedStaticDemoRun?: boolean | null;
  /**
   * Buyer deliverables: single obvious control instead of a select labeled "More formats".
   */
  buyerMarkdownAsPrimaryButton?: boolean;
  /**
   * Stable selector for the primary Markdown download button. Call sites that mount more than one
   * menu must pass distinct ids (sponsor handoff vs artifacts exports) so Playwright strict mode
   * does not resolve two elements.
   */
  markdownDownloadTestId?: string;
};

/**
 * Export menu for finalized review record artifacts on run detail - Markdown is generated entirely in the browser.
 *
 * @important Verify all buyer-visible string labels use {@link SIGNED_MANIFEST_LABEL}, not "golden manifest".
 * The `trustEvidenceGoldenManifestFieldTitle` guard covers data-layer field names but not hardcoded strings inside this component.
 *
 * @deprecated Internal API and prop names still use golden-manifest vocabulary. Buyer-visible labels in this file must
 * stay on {@link SIGNED_MANIFEST_LABEL}; plan a V1.1 rename to `SignedReviewRecordExportMenu` when export surfaces stabilize.
 */
export function GoldenManifestExportMenu(props: GoldenManifestExportMenuProps) {
  const {
    runId,
    manifestId,
    goldenManifestJson,
    manifestSummary,
    trustEvidenceCard,
    buyerMarkdownAsPrimaryButton = false,
    markdownDownloadTestId = "golden-manifest-markdown-download-button",
  } = props;
  const workingDesk = useProductionDeskChrome();
  const healthQuery = useHealthReadySummaryQuery({ enabled: workingDesk });
  const preCommitGateEnabled = healthQuery.data?.preCommitGateEnabled ?? null;
  const hostQualityGateMode = healthQuery.data?.agentOutputQualityGateMode ?? null;
  const hostAgentExecutionMode = healthQuery.data?.agentExecutionMode ?? null;
  const legacySealedReExport = resolveLegacySealedReExportHonesty(manifestSummary);
  const usedStaticDemoRun = props.usedStaticDemoRun === true || props.progressSummary?.isSample === true;
  const [exportMenuKey, setExportMenuKey] = useState(0);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportVerifyStatus, setExportVerifyStatus] = useState<string | null>(null);
  const [exportVerifyRecovery, setExportVerifyRecovery] = useState<ReturnType<
    typeof exportVerifyBlockedRecovery
  > | null>(null);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const canExport: boolean =
    isUsableGoldenManifestExportJson(goldenManifestJson) || manifestSummary !== null;

  if (!canExport) {
    return null;
  }

  async function downloadMarkdownSummary(): Promise<void> {
    const blockedReason = runCollateralSealedManifestCopyBlockedReason({
      runId,
      manifestVersion: manifestSummarySealedVersionForCopyGuard(manifestSummary),
    });

    if (blockedReason !== null) {
      setExportError(blockedReason);
      setExportVerifyRecovery(null);
      return;
    }

    const careerHonestyInput = {
      artifactKind: "export" as const,
      runId,
      progressSummary: props.progressSummary ?? null,
      manifestSummary,
      graphSnapshot: props.graphSnapshot ?? null,
      findingsSnapshot: props.findingsSnapshot ?? null,
      enginesSucceeded: props.enginesSucceeded ?? null,
      workingDesk,
      classificationCounts: props.classificationCounts ?? null,
      preCommitGateEnabled,
      structuralExecutionMode: props.progressSummary?.structuralExecutionMode ?? null,
      isSample: props.progressSummary?.isSample ?? null,
      hostAgentExecutionMode,
      hostQualityGateMode,
      aggregateQualityGateOutcome: props.aggregateQualityGateOutcome ?? null,
      transparencyTrail: manifestSummary?.feasibilityVerdict?.transparencyTrail ?? null,
      legacySealedReExport,
      curatedSampleRun: usedStaticDemoRun,
    };
    const careerExportVerdict = evaluateCareerArtifactHonesty(careerHonestyInput);
    const careerExportBlockedReason = careerExportVerdict.canRender
      ? null
      : careerExportVerdict.blockedReasons[0] ?? resolveCareerExportBlockedReason(careerHonestyInput);

    if (careerExportBlockedReason !== null) {
      setExportError(careerExportBlockedReason);
      setExportVerifyRecovery(null);
      return;
    }

    setExportError(null);
    setExportVerifyRecovery(null);
    setExportVerifyStatus(null);

    const skipVerify = props.progressSummary?.isSample === true;

    if (workingDesk && !skipVerify) {
      setExportVerifyStatus("Verifying export lineage…");

      try {
        const verifyResult = await verifyRunExportLineage(runId);

        if (!isRunExportLineageAttested(verifyResult)) {
          setExportVerifyStatus(formatRunExportLineageStatusLabel(verifyResult));
          setExportVerifyRecovery(exportVerifyBlockedRecovery(verifyResult));
          return;
        }

        setExportVerifyStatus(formatRunExportLineageStatusLabel(verifyResult));
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        setExportError(message);
        return;
      }
    }

    const markdown: string = formatGoldenManifestMarkdown(goldenManifestJson, {
      runId,
      manifestSummaryFallback: manifestSummary,
      trustEvidenceCard: trustEvidenceCard ?? null,
      enginesSucceeded: props.enginesSucceeded ?? null,
      careerExportHonesty: {
        progressSummary: props.progressSummary ?? null,
        graphSnapshot: props.graphSnapshot ?? null,
        findingsSnapshot: props.findingsSnapshot ?? null,
        enginesSucceeded: props.enginesSucceeded ?? null,
        workingDesk,
        classificationCounts: props.classificationCounts ?? null,
        preCommitGateEnabled,
        structuralExecutionMode: props.progressSummary?.structuralExecutionMode ?? null,
        isSample: props.progressSummary?.isSample ?? null,
        hostAgentExecutionMode,
        hostQualityGateMode,
        aggregateQualityGateOutcome: props.aggregateQualityGateOutcome ?? null,
        usedStaticDemoRun,
      },
    });

    const filename: string = buildGoldenManifestMarkdownFilename(runId, manifestId);

    triggerGoldenManifestMarkdownDownload(markdown, filename);
    recordFirstExportOpenedOnce();
    setExportMenuKey((k: number) => k + 1);
  }

  async function downloadServerMarkdownSummary(): Promise<void> {
    const blockedReason = runCollateralSealedManifestCopyBlockedReason({
      runId,
      manifestVersion: manifestSummarySealedVersionForCopyGuard(manifestSummary),
    });

    if (blockedReason !== null) {
      setExportError(blockedReason);
      return;
    }

    setExportError(null);

    try {
      await downloadManifestMarkdownExport(manifestId);
      recordFirstExportOpenedOnce();
      setExportMenuKey((k: number) => k + 1);
    } catch (error: unknown) {
      const failure = toApiLoadFailure(error);
      setExportError(manifestMarkdownExportBlockedReason(failure) ?? failure.message);
    }
  }

  const markdownOptionLabel =
    buyerPolishedShell === true ? "Download review summary" : EXPORT_FORMAT_MARKDOWN.label;

  const exportDemoBanner = (
    <DemoVsLiveChromeBanner
      usedStaticDemoRun={usedStaticDemoRun}
      isSimulator={props.progressSummary?.structuralExecutionMode === StructuralExecutionModeWire.Simulator}
    />
  );

  const exportLegacyWarning =
    legacySealedReExport ? (
      <p
        className={cn("m-0 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)}
        data-testid="golden-manifest-export-legacy-sealed-warning"
        role="status"
      >
        This sealed record predates transparency trail requirements — treat exports as incomplete for career use.
      </p>
    ) : null;

  const exportStatusChrome =
    exportVerifyStatus !== null ? (
      <div className="space-y-1">
        <p
          className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="golden-manifest-export-verify-status"
        >
          Export integrity check: {exportVerifyStatus}
        </p>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          {RUN_EXPORT_LINEAGE_INTEGRITY_CHECK_DISCLAIMER}
        </p>
      </div>
    ) : null;

  const exportRecoveryChrome =
    exportVerifyRecovery !== null ? (
      <OperatorErrorRecoveryContract
        presentation={exportVerifyRecovery}
        testId="golden-manifest-export-verify-recovery"
      />
    ) : null;

  if (buyerMarkdownAsPrimaryButton === true) {
    return (
      <div className="flex max-w-xs flex-col gap-1">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9"
          data-testid={markdownDownloadTestId}
          onClick={() => {
            void downloadMarkdownSummary();
          }}
        >
          {markdownOptionLabel}
        </Button>
        <ExportFormatWhenToUseHint format="markdown" />
        {exportDemoBanner}
        {exportLegacyWarning}
        {exportStatusChrome}
        {exportRecoveryChrome}
        {exportError !== null ? (
          <p
            role="alert"
            className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="golden-manifest-export-error"
          >
            {exportError}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="flex max-w-xs flex-col gap-1">
    <Select
      key={exportMenuKey}
      onValueChange={(value: string) => {
        if (value === "markdown-summary") {
          downloadMarkdownSummary();
          return;
        }

        if (value === "server-markdown-export") {
          void downloadServerMarkdownSummary();
        }
      }}
    >
      <SelectTrigger
        className={cn(
          buyerPolishedShell ? "h-9 w-[12rem] opacity-60" : "h-9 w-[14rem]",
          buyerPolishedShell && "text-neutral-600 dark:text-neutral-400",
        )}
        aria-label={
          buyerPolishedShell
            ? "More export formats for this review"
            : `Export ${SIGNED_MANIFEST_LABEL.toLowerCase()}`
        }
        data-testid="golden-manifest-export-more-formats-trigger"
      >
        <SelectValue placeholder={buyerPolishedShell ? "More formats" : "Export"} />
      </SelectTrigger>
      <SelectContent className="min-w-[16rem]">
        <SelectItem value="markdown-summary" className="items-start py-2">
          <span className="flex flex-col gap-0.5 pr-2">
            <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
              {markdownOptionLabel}
            </span>
            <ExportFormatWhenToUseHint format="markdown" />
          </span>
        </SelectItem>
        <SelectItem value="server-markdown-export" className="items-start py-2">
          <span className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}>
            Download server manifest export (Markdown)
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
      {exportDemoBanner}
      {exportLegacyWarning}
      {exportStatusChrome}
      {exportRecoveryChrome}
      {exportError !== null ? (
        <p
          role="alert"
          className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="golden-manifest-export-error"
        >
          {exportError}
        </p>
      ) : null}
    </div>
  );
}