"use client";

import { useState } from "react";

import {
  buildGoldenManifestMarkdownFilename,
  formatGoldenManifestMarkdown,
  isUsableGoldenManifestExportJson,
  triggerGoldenManifestMarkdownDownload,
} from "@/lib/export-markdown";
import { recordFirstExportOpenedOnce } from "@/lib/first-tenant-funnel-telemetry";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { SIGNED_MANIFEST_LABEL } from "@/lib/usability/canonical-product-terms";
import type { ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";

export type GoldenManifestExportMenuProps = {
  runId: string;
  manifestId: string;
  goldenManifestJson: unknown | null;
  manifestSummary: ManifestSummary | null;
  trustEvidenceCard?: RunTrustEvidenceCard | null;
  /**
   * Buyer deliverables: single obvious control instead of a select labeled “More formats”.
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
 * Export menu for finalized review record artifacts on run detail — Markdown is generated entirely in the browser.
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
  const [exportMenuKey, setExportMenuKey] = useState(0);
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();

  const canExport: boolean =
    isUsableGoldenManifestExportJson(goldenManifestJson) || manifestSummary !== null;

  if (!canExport) {
    return null;
  }

  function downloadMarkdownSummary(): void {
    const markdown: string = formatGoldenManifestMarkdown(goldenManifestJson, {
      runId,
      manifestSummaryFallback: manifestSummary,
      trustEvidenceCard: trustEvidenceCard ?? null,
    });

    const filename: string = buildGoldenManifestMarkdownFilename(runId, manifestId);

    triggerGoldenManifestMarkdownDownload(markdown, filename);
    recordFirstExportOpenedOnce();
    setExportMenuKey((k: number) => k + 1);
  }

  if (buyerMarkdownAsPrimaryButton === true) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-9"
        data-testid={markdownDownloadTestId}
        onClick={() => {
          downloadMarkdownSummary();
        }}
      >
        Download review summary
      </Button>
    );
  }

  return (
    <Select
      key={exportMenuKey}
      onValueChange={(value: string) => {
        if (value !== "markdown-summary") {
          return;
        }

        downloadMarkdownSummary();
      }}
    >
      <SelectTrigger
        className={buyerPolishedShell ? "h-9 w-[11rem]" : "h-9 w-[10rem]"}
        aria-label={buyerPolishedShell ? "More export formats for this review" : `Export ${SIGNED_MANIFEST_LABEL.toLowerCase()}`}
      >
        <SelectValue placeholder={buyerPolishedShell ? "More formats" : "Export"} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="markdown-summary">
          {buyerPolishedShell ? "Download review summary" : "Markdown summary"}
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
