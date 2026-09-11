import { feasibilityVerdictKindLabel } from "@/lib/feasibility-verdict-display";
import { formatStructuralExecutionModeLabel } from "@/lib/structural-execution-mode";
import type { ManifestSummary } from "@/types/authority";
import type { StructuralExecutionModeInput } from "@/lib/structural-execution-mode";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

export type SendableExportCoverInput = {
  readonly runId?: string | null;
  readonly manifestSummary?: ManifestSummary | null;
  readonly feasibilityVerdict?: ManifestFeasibilityVerdict | null;
  readonly structuralExecutionMode?: StructuralExecutionModeInput;
  readonly hostAgentExecutionMode?: string | null;
};

/** First-page sendable cover block for Markdown/DOCX-aligned exports. */
export function formatSendableExportCoverMarkdown(input: SendableExportCoverInput): string {
  const lines: string[] = [];
  const summary = input.manifestSummary ?? null;
  const runId = input.runId?.trim() ?? "";
  const feasibilityVerdict = input.feasibilityVerdict ?? summary?.feasibilityVerdict ?? null;
  const executionModeLabel =
    input.structuralExecutionMode !== null && input.structuralExecutionMode !== undefined
      ? formatStructuralExecutionModeLabel(input.structuralExecutionMode)
      : input.hostAgentExecutionMode?.trim() ?? null;

  lines.push("## Sendable export cover");
  lines.push("");

  if (runId.length > 0) {
    lines.push(`- **Review id:** \`${runId}\``);
  }

  if (summary !== null) {
    lines.push(`- **Policy pack:** ${summary.ruleSetId} @ ${summary.ruleSetVersion}`);
    lines.push(`- **Review record status:** ${summary.status}`);
  }

  if (feasibilityVerdict !== null) {
    lines.push(`- **Gate outcome:** ${feasibilityVerdictKindLabel(feasibilityVerdict.kind)}`);

    const gateSummary = feasibilityVerdict.summary?.trim();

    if (gateSummary !== null && gateSummary !== undefined && gateSummary.length > 0) {
      lines.push(`- **Gate summary:** ${gateSummary}`);
    }
  }

  if (executionModeLabel !== null && executionModeLabel.length > 0) {
    lines.push(`- **Execution mode:** ${executionModeLabel}`);
  }

  lines.push("");
  lines.push(
    "_Cover fields mirror the review-package stamp: policy pack, gate outcome, and execution mode before findings._",
  );
  lines.push("");

  return lines.join("\n");
}
