"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { GoldenManifestExportMenu } from "@/components/GoldenManifestExportMenu";
import { ArtifactPreviewSponsorExportVocabularyRail } from "@/components/ArtifactPreviewSponsorExportVocabularyRail";
import { RoiSponsorExportVocabularyRail } from "@/components/RoiSponsorExportVocabularyRail";
import { SponsorRoiBaselineGateNotice } from "@/components/SponsorRoiBaselineGateNotice";
import { SponsorRehearsalPreviewPanel } from "@/components/reviews/SponsorRehearsalPreviewPanel";
import type { SponsorRehearsalPreviewInput } from "@/lib/sponsor-rehearsal-preview";
import { Button } from "@/components/ui/button";
import { getRunPackageExportUrl, SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT } from "@/lib/api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import {
  RUN_DETAIL_SPONSOR_HANDOFF_LEAD,
  RUN_DETAIL_SPONSOR_HANDOFF_MORE_EXPORTS_LABEL,
  RUN_DETAIL_SPONSOR_HANDOFF_TITLE,
} from "@/lib/runs/run-detail-deliverables-copy";
import type { ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";

export type ReviewPackageSponsorHandoffStripProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly goldenManifestJsonForExport: unknown | null;
  readonly manifestSummary: ManifestSummary | null;
  readonly trustEvidenceCard: RunTrustEvidenceCard | null | undefined;
  readonly usedStaticDemoRun: boolean;
  readonly showExtendedSponsorBriefing: boolean;
  /** Optional rehearsal inputs; empty sections stay honest when omitted. */
  readonly rehearsalPreview?: SponsorRehearsalPreviewInput | null;
};

/** Sponsor export entry on the signed review record tab — soft ROI baseline warn (TB-2204). */
export function ReviewPackageSponsorHandoffStrip(
  props: ReviewPackageSponsorHandoffStripProps,
): React.JSX.Element {
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
      <p className={cn("m-0 mt-1 max-w-prose text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        {RUN_DETAIL_SPONSOR_HANDOFF_LEAD}
      </p>
      <SponsorRoiBaselineGateNotice isFinalized />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {props.usedStaticDemoRun ? (
          <Button variant="primary" size="sm" disabled title={SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT}>
            Download architecture review report (DOCX)
          </Button>
        ) : (
          <Button variant="primary" size="sm" asChild data-testid="review-package-sponsor-handoff-docx">
            <ExportTrackedAnchor href={getRunPackageExportUrl(props.runId, "docx")}>
              Download architecture review report (DOCX)
            </ExportTrackedAnchor>
          </Button>
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
