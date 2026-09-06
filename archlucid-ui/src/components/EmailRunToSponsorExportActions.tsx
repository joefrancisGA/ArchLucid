import Link from "next/link";

import { ExportTrackedAnchor } from "@/components/ExportTrackedAnchor";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import {
  getArchitecturePackageDocxUrl,
  getBundleDownloadUrl,
  getRunExportDownloadUrl,
  getRunPackageExportUrl,
} from "@/lib/api";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_LINK,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import { whyDisabledSampleReviewExport } from "@/lib/why-disabled-cta";
import { runCollateralSealedManifestCopyBlockedReason } from "@/lib/runs/run-collateral-sealed-manifest-guard";

export type EmailRunToSponsorExportActionsProps = {
  readonly runId: string;
  readonly manifestId: string;
  readonly proofPackZipVariant: "outline" | "primary";
  readonly sponsorDocxAvailable: boolean;
  readonly curatedSampleRun: boolean;
  readonly buyerPolishedShell: boolean;
  readonly busy: boolean;
  readonly markSentBusy: boolean;
  readonly sentToSponsorUtc: string | null;
  readonly blockSponsorPdf: boolean;
  readonly blockSponsorPdfForExecutionMode: boolean;
  readonly blockSponsorPdfForAiGate: boolean;
  readonly blockSponsorPdfForProjectedDollar: boolean;
  readonly blockSponsorPdfForRoi: boolean;
  readonly sponsorProofPackHref: string;
  readonly SponsorReviewPacketHref: string;
  readonly markdownHref: string;
  readonly onDownloadPdf: () => Promise<void>;
  readonly onMarkSentToSponsor: () => Promise<void>;
};

export function EmailRunToSponsorExportActions({
  runId,
  manifestId,
  proofPackZipVariant,
  sponsorDocxAvailable,
  curatedSampleRun,
  buyerPolishedShell,
  busy,
  markSentBusy,
  sentToSponsorUtc,
  blockSponsorPdf,
  blockSponsorPdfForExecutionMode,
  blockSponsorPdfForAiGate,
  blockSponsorPdfForProjectedDollar,
  blockSponsorPdfForRoi,
  sponsorProofPackHref,
  SponsorReviewPacketHref,
  markdownHref,
  onDownloadPdf,
  onMarkSentToSponsor,
}: EmailRunToSponsorExportActionsProps) {
  const collateralExportBlockedReason = runCollateralSealedManifestCopyBlockedReason({
    runId,
    manifestVersion: manifestId,
  });

  return (
    <>
      <h3 className={cn("m-0 mt-5 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
        {buyerPolishedShell ? "Primary package downloads" : "Download package"}
      </h3>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {collateralExportBlockedReason !== null ? (
          <p
            role="alert"
            className={cn("m-0 w-full text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="email-run-to-sponsor-export-blocked-reason"
          >
            {collateralExportBlockedReason}
          </p>
        ) : null}
        <Button
          variant={proofPackZipVariant}
          asChild={collateralExportBlockedReason === null}
          disabled={collateralExportBlockedReason !== null}
          data-testid="email-run-to-sponsor-proof-pack-zip"
        >
          {collateralExportBlockedReason === null ? (
            <ExportTrackedAnchor href={sponsorProofPackHref} download={`sponsor-proof-pack-${runId}.zip`}>
              Download sponsor proof pack (ZIP)
            </ExportTrackedAnchor>
          ) : (
            <span>Download sponsor proof pack (ZIP)</span>
          )}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy || blockSponsorPdf}
          onClick={() => void onDownloadPdf()}
          data-testid="email-run-to-sponsor-primary-action"
          aria-describedby={blockSponsorPdf ? "email-run-to-sponsor-pdf-block-hint" : undefined}
        >
          {busy
            ? "Preparing PDF…"
            : blockSponsorPdfForExecutionMode
              ? "Execution mode blocks PDF"
              : blockSponsorPdfForAiGate
              ? "AI readiness gate blocks PDF"
              : blockSponsorPdfForProjectedDollar
                ? "ROI basis blocks PDF"
                : blockSponsorPdfForRoi
                  ? "ROI baselines required for PDF"
                  : buyerPolishedShell
                    ? "Create sponsor scorecard (PDF)"
                    : "Generate pilot scorecard package"}
        </Button>
        {sponsorDocxAvailable && !curatedSampleRun ? (
          collateralExportBlockedReason !== null ? (
            <Button variant="secondary" disabled data-testid="email-run-to-sponsor-sponsor-docx">
              Download Sponsor Export (DOCX)
            </Button>
          ) : (
            <Button variant="secondary" asChild>
              <ExportTrackedAnchor
                href={getRunPackageExportUrl(runId, "docx")}
                data-testid="email-run-to-sponsor-sponsor-docx"
              >
                Download Sponsor Export (DOCX)
              </ExportTrackedAnchor>
            </Button>
          )
        ) : null}
        {sponsorDocxAvailable && curatedSampleRun ? (
          <div className="flex flex-col gap-1.5">
            <Button
              variant="secondary"
              disabled
              aria-describedby="email-run-to-sponsor-docx-disabled-hint"
              data-testid="email-run-to-sponsor-sponsor-docx"
            >
              Download Sponsor Export (DOCX)
            </Button>
            <WhyDisabledCtaHint
              id="email-run-to-sponsor-docx-disabled-hint"
              reason={whyDisabledSampleReviewExport()}
              testId="email-run-to-sponsor-docx-disabled-hint"
            />
          </div>
        ) : null}
        {sentToSponsorUtc !== null ? (
          <span className="inline-flex flex-col gap-0.5 sm:flex-row sm:items-center sm:gap-2">
            <StatusTag
              kind="ready"
              label="Sent to sponsor"
              data-testid="email-run-to-sponsor-sent-badge"
            />
            <time
              dateTime={sentToSponsorUtc}
              className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
            >
              Recorded at {sentToSponsorUtc}
            </time>
          </span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={markSentBusy || blockSponsorPdf}
            onClick={() => void onMarkSentToSponsor()}
            data-testid="email-run-to-sponsor-mark-sent"
          >
            {markSentBusy ? "Recording…" : "Mark as sent to sponsor"}
          </Button>
        )}
        <span
          id="email-run-to-sponsor-pdf-block-hint"
          className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
        >
          {blockSponsorPdfForExecutionMode
            ? "PDF export stays disabled until execution mode is Real (or this is a labeled curated sample review)."
            : blockSponsorPdfForAiGate
            ? "PDF export stays disabled until strict AI quality readiness signals pass for this review."
            : blockSponsorPdfForProjectedDollar
              ? "PDF export stays disabled until ROI baselines are buyer-provided and projected-dollar claims are export-ready."
              : blockSponsorPdfForRoi
                ? "PDF export stays disabled until tenant ROI baselines are captured."
                : buyerPolishedShell
                  ? "Primary export is the sponsor one‑pager PDF — same storyline as the Markdown summary."
                  : "Step 1: generate the sponsor one‑pager PDF — same storyline as the Markdown narrative."}
        </span>
      </div>

      <ul className={cn("m-0 mt-3 list-none space-y-1.5 p-0 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.helper)}>
        <li>
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={SponsorReviewPacketHref}
            download={`archlucid-sponsor-review-packet-${runId}.md`}
            data-testid="email-run-to-sponsor-sponsor-review-packet"
          >
            {buyerPolishedShell ? "Sponsor review packet (one-click Markdown)" : "Sponsor review packet (Markdown)"}
          </a>
        </li>
        <li>
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={markdownHref}
            download={`archlucid-first-value-report-${runId}.md`}
          >
            {buyerPolishedShell ? "Sponsor value summary (Markdown)" : "First-value report (Markdown)"}
          </a>
        </li>
        <li>
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={getArchitecturePackageDocxUrl(runId)}
          >
            Architecture decision package (DOCX)
          </a>
        </li>
        <li>
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={getBundleDownloadUrl(manifestId)}
          >
            Review bundle (ZIP)
          </a>
          {" · "}
          <a
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={getRunExportDownloadUrl(runId)}
          >
            {buyerPolishedShell ? "Audit-ready review export (ZIP)" : "Architecture review export (ZIP)"}
          </a>
          {" · "}
          {buyerPolishedShell ? null : (
            <>
              <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href="/insights/architecture-scorecard">
                In-product pilot scorecard
              </Link>
              {" · "}
            </>
          )}
          <a className={OPERATOR_BODY_INLINE_LINK_CLASS} href="#artifacts-exports">
            {buyerPolishedShell ? "More export options on this review page" : "Artifacts &amp; exports on this page"}
          </a>
        </li>
      </ul>
    </>
  );
}
