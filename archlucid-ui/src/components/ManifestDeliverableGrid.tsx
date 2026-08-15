"use client";

import { cn } from "@/lib/utils";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  BUYER_MANIFEST_AUTHORITY_SUMMARY,
  BUYER_MANIFEST_DELIVERABLES_HEADING,
  BUYER_MANIFEST_DELIVERABLE_DOCX_DESC,
  BUYER_MANIFEST_DELIVERABLE_DOCX_TITLE,
  BUYER_MANIFEST_DELIVERABLE_SPONSOR_PDF_DESC,
  BUYER_MANIFEST_DELIVERABLE_SPONSOR_PDF_TITLE,
  BUYER_MANIFEST_DELIVERABLE_MARKDOWN_DESC,
  BUYER_MANIFEST_DELIVERABLE_MARKDOWN_TITLE,
  BUYER_MANIFEST_DELIVERABLE_ZIP_DESC,
  BUYER_MANIFEST_DELIVERABLE_ZIP_TITLE,
} from "@/lib/buyer/buyer-polish-copy";
import { downloadFirstValueReportPdf, getArchitecturePackageDocxUrl, getBundleDownloadUrl } from "@/lib/api";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { triggerGoldenManifestMarkdownDownload } from "@/lib/export-markdown";
import { OPERATOR_TYPE_SCALE, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { showError, showSuccess } from "@/lib/toast";

export type ManifestDeliverableGridProps = {
  readonly manifestId: string;
  readonly runId: string;
  readonly buyerPolished: boolean;
  readonly systemName?: string;
};

type DeliverableTileProps = {
  readonly title: string;
  readonly description: string;
  readonly testId: string;
  readonly children: React.ReactNode;
};

function DeliverableTile(props: DeliverableTileProps): React.JSX.Element {
  const { title, description, testId, children } = props;

  return (
    <div
      className="flex flex-col rounded-lg border border-neutral-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      data-testid={testId}
    >
      <p className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>{title}</p>
      <p className={cn("m-0 mt-1 flex-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>{description}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

/** Visual deliverables climax for buyer-polished signed-manifest pages. */
export function ManifestDeliverableGrid(props: ManifestDeliverableGridProps): React.JSX.Element | null {
  const { manifestId, runId, buyerPolished, systemName } = props;
  const [pdfBusy, setPdfBusy] = useState(false);

  const onPdfDownload = useCallback(async () => {
    setPdfBusy(true);

    try {
      await downloadFirstValueReportPdf(runId);
      showSuccess("Sponsor PDF download started.");
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      showError("Sponsor PDF download failed", message);
    } finally {
      setPdfBusy(false);
    }
  }, [runId]);

  const onMarkdownDownload = useCallback(() => {
    const headline = systemName?.trim() ?? "Signed review";
    const body = `# ${headline}\n\n${BUYER_MANIFEST_AUTHORITY_SUMMARY}\n\nReview ID: ${runId}\n`;
    const slug = headline.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

    triggerGoldenManifestMarkdownDownload(body, `decision-receipt-${slug || runId}.md`);
    showSuccess("Decision receipt download started.");
  }, [runId, systemName]);

  if (!buyerPolished) {
    return null;
  }

  const showPdfTile = isCtoDemoPackEnv();
  const runIdTrimmed = runId.trim();

  return (
    <section aria-label={BUYER_MANIFEST_DELIVERABLES_HEADING} data-testid="manifest-deliverable-grid" className="space-y-3">
      <h2 className={cn("m-0", OPERATOR_TYPE_SCALE.cardTitle)}>{BUYER_MANIFEST_DELIVERABLES_HEADING}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        {showPdfTile ? (
          <DeliverableTile
            title={BUYER_MANIFEST_DELIVERABLE_SPONSOR_PDF_TITLE}
            description={BUYER_MANIFEST_DELIVERABLE_SPONSOR_PDF_DESC}
            testId="deliverable-tile-sponsor-pdf"
          >
            <Button type="button" size="sm" variant="default" disabled={pdfBusy} onClick={() => void onPdfDownload()}>
              {pdfBusy ? "Downloading…" : "Download PDF"}
            </Button>
          </DeliverableTile>
        ) : null}
        <DeliverableTile
          title={BUYER_MANIFEST_DELIVERABLE_DOCX_TITLE}
          description={BUYER_MANIFEST_DELIVERABLE_DOCX_DESC}
          testId="deliverable-tile-docx"
        >
          <Button variant="outline" size="sm" asChild>
            <a href={getArchitecturePackageDocxUrl(runIdTrimmed)}>Download DOCX</a>
          </Button>
        </DeliverableTile>
        <DeliverableTile
          title={BUYER_MANIFEST_DELIVERABLE_ZIP_TITLE}
          description={BUYER_MANIFEST_DELIVERABLE_ZIP_DESC}
          testId="deliverable-tile-zip"
        >
          <Button variant="outline" size="sm" asChild>
            <a href={getBundleDownloadUrl(manifestId)}>Download ZIP</a>
          </Button>
        </DeliverableTile>
        {runIdTrimmed.length > 0 ? (
          <DeliverableTile
            title={BUYER_MANIFEST_DELIVERABLE_MARKDOWN_TITLE}
            description={BUYER_MANIFEST_DELIVERABLE_MARKDOWN_DESC}
            testId="deliverable-tile-markdown"
          >
            <Button type="button" variant="outline" size="sm" onClick={onMarkdownDownload}>
              Download Markdown
            </Button>
          </DeliverableTile>
        ) : null}
      </div>
    </section>
  );
}
