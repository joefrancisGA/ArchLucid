"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";

import { CopyExecutiveSponsorLinkButton } from "@/components/reviews/CopyExecutiveSponsorLinkButton";
import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { GoldenManifestExportMenu } from "@/components/GoldenManifestExportMenu";
import { ArtifactPreviewSponsorExportVocabularyRail } from "@/components/ArtifactPreviewSponsorExportVocabularyRail";
import { RoiSponsorExportVocabularyRail } from "@/components/RoiSponsorExportVocabularyRail";
import { SponsorRoiBaselineGateNotice } from "@/components/SponsorRoiBaselineGateNotice";
import { SponsorRehearsalPreviewPanel } from "@/components/reviews/SponsorRehearsalPreviewPanel";
import type { SponsorRehearsalPreviewInput } from "@/lib/sponsor-rehearsal-preview";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { getRunPackageExportUrl } from "@/lib/api";
import { OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  buildInviteReviewerHref,
  INVITE_REVIEWER_PAGE_TITLE,
} from "@/lib/invite-reviewer-flow";
import { whyDisabledSampleReviewExport } from "@/lib/why-disabled-cta";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import {
  RUN_DETAIL_SPONSOR_HANDOFF_LEAD,
  RUN_DETAIL_SPONSOR_HANDOFF_MORE_EXPORTS_LABEL,
  RUN_DETAIL_SPONSOR_HANDOFF_TITLE,
} from "@/lib/runs/run-detail-deliverables-copy";
import { manifestSummarySealedVersionForCopyGuard, runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";
import {
  EXTRACTION_FIDELITY_GATE_MESSAGE,
  isExtractionFidelityGateSatisfied,
} from "@/lib/review-quality/finalize-quality-scorecard";
import type { ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";

export type ReviewPackageSponsorHandoffStripProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly goldenManifestJsonForExport: unknown | null;
  readonly manifestSummary: ManifestSummary | null;
  readonly trustEvidenceCard: RunTrustEvidenceCard | null | undefined;
  readonly usedStaticDemoRun: boolean;
  readonly showExtendedSponsorBriefing: boolean;
  readonly lowExtractionConfidenceCount?: number;
  /** Optional rehearsal inputs; empty sections stay honest when omitted. */
  readonly rehearsalPreview?: SponsorRehearsalPreviewInput | null;
};

/** Sponsor export entry on the Finalized review record tab — soft ROI baseline warn (TB-2204). */
export function ReviewPackageSponsorHandoffStrip(
  props: ReviewPackageSponsorHandoffStripProps,
): React.JSX.Element {
  const lowExtractionConfidenceCount = Math.max(0, Math.trunc(props.lowExtractionConfidenceCount ?? 0));
  const [extractionCaveatAcknowledged, setExtractionCaveatAcknowledged] = useState(false);
  const extractionGateSatisfied = isExtractionFidelityGateSatisfied({
    lowConfidenceCriticalFieldCount: lowExtractionConfidenceCount,
    extractionCaveatAcknowledged,
  });
  const sealedManifestVersion = manifestSummarySealedVersionForCopyGuard(props.manifestSummary);
  const collateralExportBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId: props.runId,
    manifestVersion: sealedManifestVersion,
  });
  const docxExportAllowed = extractionGateSatisfied && collateralExportBlockedReason === null;
  const { callerAuthorityRank } = useOperatorNavAuthority();
  const canInviteReviewer = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;

  return (
    <section
      id="sponsor-handoff"
      className="scroll-mt-24 rounded-lg border border-neutral-200 bg-al-surface-raised p-4 dark:border-neutral-800"
      data-testid="review-package-sponsor-handoff-strip"
      aria-labelledby="review-package-sponsor-handoff-heading"
    >
      <h2
        id="review-package-sponsor-handoff-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {RUN_DETAIL_SPONSOR_HANDOFF_TITLE}
      </h2>
      <p className={cn("m-0 mt-1 text-neutral-700 dark:text-neutral-300", OPERATOR_SHORT_HELPER_MEASURE_CLASS, OPERATOR_TYPOGRAPHY.body)}>
        {RUN_DETAIL_SPONSOR_HANDOFF_LEAD}
      </p>
      <SponsorRoiBaselineGateNotice isFinalized />
      {lowExtractionConfidenceCount > 0 ? (
        <div
          className="mt-3 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50/80 p-3 dark:border-amber-900/50 dark:bg-amber-950/30"
          data-testid="review-package-extraction-fidelity-gate"
        >
          <Checkbox
            id="review-package-extraction-caveat-ack"
            checked={extractionCaveatAcknowledged}
            onCheckedChange={(checked) => {
              setExtractionCaveatAcknowledged(checked === true);
            }}
            data-testid="review-package-extraction-caveat-ack-checkbox"
          />
          <div className="space-y-1">
            <Label htmlFor="review-package-extraction-caveat-ack" className={OPERATOR_TYPOGRAPHY.body}>
              {EXTRACTION_FIDELITY_GATE_MESSAGE}
            </Label>
            <p className={cn("m-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
              {lowExtractionConfidenceCount} critical finding
              {lowExtractionConfidenceCount === 1 ? "" : "s"} were extracted with low confidence.
            </p>
          </div>
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CopyExecutiveSponsorLinkButton
          runId={props.runId}
          manifestVersion={manifestSummarySealedVersionForCopyGuard(props.manifestSummary)}
        />
        {canInviteReviewer ? (
          <Button variant="outline" size="sm" asChild data-testid="review-package-sponsor-handoff-invite-reviewer">
            <Link href={buildInviteReviewerHref(props.runId)}>{INVITE_REVIEWER_PAGE_TITLE}</Link>
          </Button>
        ) : null}
        {props.usedStaticDemoRun ? (
          <div className={cn("flex flex-col gap-1.5", OPERATOR_SHORT_HELPER_MEASURE_CLASS)}>
            <Button
              variant="outline"
              size="sm"
              disabled
              aria-describedby="review-package-sponsor-handoff-docx-disabled-hint"
            >
              Download architecture review report (DOCX)
            </Button>
            <WhyDisabledCtaHint
              id="review-package-sponsor-handoff-docx-disabled-hint"
              reason={whyDisabledSampleReviewExport()}
              testId="review-package-sponsor-handoff-docx-disabled-hint"
            />
          </div>
        ) : (
          <div className={cn("flex flex-col gap-1.5", OPERATOR_SHORT_HELPER_MEASURE_CLASS)}>
            <Button
              variant="outline"
              size="sm"
              disabled={!docxExportAllowed}
              asChild={docxExportAllowed}
              data-testid="review-package-sponsor-handoff-docx"
            >
              {docxExportAllowed ? (
                <ExportTrackedAnchor href={getRunPackageExportUrl(props.runId, "docx")}>
                  Download architecture review report (DOCX)
                </ExportTrackedAnchor>
              ) : (
                <span>Download architecture review report (DOCX)</span>
              )}
            </Button>
            {!docxExportAllowed && collateralExportBlockedReason !== null ? (
              <p
                role="alert"
                className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
                data-testid="review-package-sponsor-handoff-docx-blocked-reason"
              >
                {collateralExportBlockedReason}
              </p>
            ) : null}
          </div>
        )}
      </div>
      <details
        className="mt-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-800"
        data-testid="review-package-sponsor-handoff-more-exports"
      >
        <summary
          className={cn("cursor-pointer font-medium text-neutral-800 dark:text-neutral-200", OPERATOR_TYPOGRAPHY.body)}
        >
          {RUN_DETAIL_SPONSOR_HANDOFF_MORE_EXPORTS_LABEL}
        </summary>
        <div className="mt-3 space-y-3">
          <RoiSponsorExportVocabularyRail currentSurfaceId="sponsor-handoff" runId={props.runId} />
          <ArtifactPreviewSponsorExportVocabularyRail
            currentSurfaceId="sponsor-export"
            runId={props.runId}
          />
          <GoldenManifestExportMenu
            runId={props.runId}
            manifestId={props.manifestId}
            goldenManifestJson={props.goldenManifestJsonForExport}
            manifestSummary={props.manifestSummary}
            trustEvidenceCard={props.trustEvidenceCard ?? null}
            markdownDownloadTestId="review-package-sponsor-handoff-markdown-download"
          />
          {props.showExtendedSponsorBriefing ? (
            <Button variant="outline" size="sm" asChild data-testid="review-package-sponsor-handoff-more">
              <Link href={buildReviewDetailTabHref(props.runId, "review-package", { hash: "sponsor-handoff-extended" })}>
                Extended sponsor briefing
              </Link>
            </Button>
          ) : null}
          <SponsorRehearsalPreviewPanel
            input={
              props.rehearsalPreview ?? {
                packageTitle: props.runId,
              }
            }
          />
        </div>
      </details>
    </section>
  );
}
