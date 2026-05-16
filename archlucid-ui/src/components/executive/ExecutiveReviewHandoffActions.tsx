"use client";

import { useCallback, type ReactElement } from "react";

import { Button } from "@/components/ui/button";
import {
  buildExecutiveRiskReviewMarkdown,
  executiveRiskReviewMarkdownFilename,
  type ExecutiveRiskReviewFindingMarkdownRow,
} from "@/lib/executive-risk-review-markdown";
import { getArchitecturePackageDocxUrl } from "@/lib/api";
import { triggerGoldenManifestMarkdownDownload } from "@/lib/export-markdown";
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

  const onMarkdownDownload = useCallback(() => {
    const body = buildExecutiveRiskReviewMarkdown(runId, headline, summary, prioritizedFindings);

    triggerGoldenManifestMarkdownDownload(body, executiveRiskReviewMarkdownFilename(runId));
  }, [runId, headline, summary, prioritizedFindings]);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm" asChild>
        <a href={getArchitecturePackageDocxUrl(runId)}>Download architecture package (DOCX)</a>
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={onMarkdownDownload}>
        Download Markdown summary
      </Button>
    </div>
  );
}
