"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { GoldenManifestExportMenu } from "@/components/GoldenManifestExportMenu";
import { InlineGlossaryChip } from "@/components/InlineGlossaryChip";
import { SponsorRoiBaselineGateNotice } from "@/components/SponsorRoiBaselineGateNotice";
import { SponsorRehearsalPreviewPanel } from "@/components/reviews/SponsorRehearsalPreviewPanel";
import type { SponsorRehearsalPreviewInput } from "@/lib/sponsor-rehearsal-preview";
import { Button } from "@/components/ui/button";
import { getRunPackageExportUrl, SAMPLE_REVIEW_EXPORT_UNAVAILABLE_HINT } from "@/lib/api";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import {
  RUN_DETAIL_SPONSOR_HANDOFF_MORE_EXPORTS_LABEL,
  RUN_DETAIL_SPONSOR_HANDOFF_TITLE,
} from "@/lib/run-detail-deliverables-copy";
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

/** Above-the-fold sponsor export entry — promotes existing export surfaces (TB-2132). Soft ROI baseline warn (TB-2204). */
export function ReviewPackageSponsorHandoffStrip(
  props: ReviewPackageSponsorHandoffStripProps,
): React.JSX.Element {
  return (
    <section
      id="sponsor-handoff"
      className="scroll-mt-24 rounded-lg border border-teal-200 bg-teal-50/60 p-4 dark:border-teal-900 dark:bg-teal-950/30"
      data-testid="review-package-sponsor-handoff-strip"
      aria-labelledby="review-package-sponsor-handoff-heading"
    >
      <h2
        id="review-package-sponsor-handoff-heading"
        className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
      >
        {RUN_DETAIL_SPONSOR_HANDOFF_TITLE}
      </h2>
      <div className={cn("m-0 mt-1 max-w-prose text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
        Download the executive review summary or architecture report when you are ready to share this finalized{" "}
        <InlineGlossaryChip nounId="signed-review-record">signed review record</InlineGlossaryChip> internally or with
        sponsors. Use <InlineGlossaryChip nounId="governance-approval">governance approval</InlineGlossaryChip> when
        policy sign-off is required.
      </div>
      <SponsorRoiBaselineGateNotice isFinalized />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <GoldenManifestExportMenu
          runId={props.runId}
          manifestId={props.manifestId}
          goldenManifestJson={props.goldenManifestJsonForExport}
          manifestSummary={props.manifestSummary}
          trustEvidenceCard={props.trustEvidenceCard ?? null}
          buyerMarkdownAsPrimaryButton
        />
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
        {props.showExtendedSponsorBriefing ? (
          <Button variant="outline" size="sm" asChild data-testid="review-package-sponsor-handoff-more">
            <Link href={buildReviewDetailTabHref(props.runId, "review-package", { hash: "sponsor-handoff-extended" })}>
              {RUN_DETAIL_SPONSOR_HANDOFF_MORE_EXPORTS_LABEL}
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="mt-3">
        <SponsorRehearsalPreviewPanel
          input={
            props.rehearsalPreview ?? {
              packageTitle: props.runId,
            }
          }
        />
      </div>
    </section>
  );
}
