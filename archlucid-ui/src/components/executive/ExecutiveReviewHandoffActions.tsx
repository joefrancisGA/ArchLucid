"use client";

import { useCallback, useState, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  buildExecutiveRiskReviewMarkdown,
  executiveRiskReviewMarkdownFilename,
  type ExecutiveRiskReviewFindingMarkdownRow,
} from "@/lib/executive-risk-review-markdown";
import { ShareReviewPackageButton } from "@/components/ShareReviewPackageButton";
import { getArchitecturePackageDocxUrl, downloadFirstValueReportPdf } from "@/lib/api";
import { triggerGoldenManifestMarkdownDownload } from "@/lib/export-markdown";
import { isCtoDemoPackEnv } from "@/lib/cto-demo-presenter-pack";
import { BUYER_CTO_DEMO_EXECUTIVE_PRINT_CTA } from "@/lib/buyer-polish-copy";
import { showError } from "@/lib/toast";
import type { RunExplanationSummary } from "@/types/explanation";

export type ExecutiveReviewHandoffActionsProps = {
  readonly runId: string;
  readonly headline: string;
  readonly summary: RunExplanationSummary;
  readonly prioritizedFindings: readonly ExecutiveRiskReviewFindingMarkdownRow[];
};

/**
 * Executive route export row: DOCX package (API) plus a deterministic Markdown snapshot for email/wiki handoff.
 */
export function ExecutiveReviewHandoffActions(props: ExecutiveReviewHandoffActionsProps): ReactElement {
  const { runId, headline, summary, prioritizedFindings } = props;
  const [boardPackBusy, setBoardPackBusy] = useState(false);
  const showBoardPacket = isCtoDemoPackEnv();

  const onMarkdownDownload = useCallback(() => {
    const body = buildExecutiveRiskReviewMarkdown(runId, headline, summary, prioritizedFindings);

    triggerGoldenManifestMarkdownDownload(body, executiveRiskReviewMarkdownFilename(runId));
  }, [runId, headline, summary, prioritizedFindings]);

  const onBoardPacketDownload = useCallback(async () => {
    setBoardPackBusy(true);

    try {
      await downloadFirstValueReportPdf(runId);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      showError("Board packet download failed", message);
    } finally {
      setBoardPackBusy(false);
    }
  }, [runId]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showBoardPacket ? (
        <Button
          type="button"
          variant="default"
          size="sm"
          disabled={boardPackBusy}
          onClick={() => void onBoardPacketDownload()}
          data-testid="executive-download-board-packet"
        >
          {boardPackBusy ? "Board packet…" : "Download board packet"}
        </Button>
      ) : null}
      {showBoardPacket ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="print:hidden"
          data-testid="executive-print-summary"
          onClick={() => {
            window.print();
          }}
        >
          {BUYER_CTO_DEMO_EXECUTIVE_PRINT_CTA}
        </Button>
      ) : null}
      <Button variant="outline" size="sm" asChild>
        <a href={getArchitecturePackageDocxUrl(runId)}>Download architecture package (DOCX)</a>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onMarkdownDownload}>
        Download review summary
      </Button>
      <ShareReviewPackageButton runId={runId} systemName={headline} committed />
    </div>
  );
}
