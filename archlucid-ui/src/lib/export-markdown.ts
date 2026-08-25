import type { ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";

import { formatManifestDocumentShape } from "./export-markdown-manifest-document";
import { pushPolicyAtCommitMarkdownLines } from "./export-markdown-policy-section";
import { formatSandboxStyleGoldenManifest } from "./export-markdown-sandbox-manifest";
import { isRecord } from "./export-markdown-text";
import {
  appendTrustEvidenceMarkdownSection,
  formatTrustEvidenceCardMarkdown,
} from "./export-markdown-trust-evidence";

export {
  buildGoldenManifestMarkdownFilename,
  triggerGoldenManifestMarkdownDownload,
} from "./export-markdown-download";
export { formatTrustEvidenceCardMarkdown };

export type GoldenManifestMarkdownOptions = {
  /** Echoed in metadata. */
  runId?: string | null;
  /** When full manifest JSON is missing, format a short summary from API manifest summary instead. */
  manifestSummaryFallback?: ManifestSummary | null;
  /** Appended to sponsor-style Markdown exports when the run detail includes this card. */
  trustEvidenceCard?: RunTrustEvidenceCard | null;
};

/**
 * Returns true when the run-detail `goldenManifest` payload looks like a real document rather than a placeholder.
 */
export function isUsableGoldenManifestExportJson(data: unknown): boolean {
  if (!isRecord(data)) {
    return false;
  }

  const keys = Object.keys(data);

  if (keys.length === 0) {
    return false;
  }

  if (keys.length === 1 && data.demo === true) {
    return false;
  }

  return true;
}

function formatManifestSummaryFallback(summary: ManifestSummary, runId?: string | null): string {
  const lines: string[] = [];

  lines.push(`# Architecture review record summary`);
  lines.push("");

  lines.push("## Document metadata");
  lines.push("");

  if (runId) {
    lines.push(`- **Review id:** \`${runId}\``);
  }

  lines.push(`- **Review record id:** \`${summary.manifestId}\``);
  lines.push(`- **Status:** ${summary.status}`);
  lines.push(`- **Policy pack:** ${summary.ruleSetId} @ ${summary.ruleSetVersion}`);
  lines.push(`- **Review record hash:** \`${summary.manifestHash}\``);

  if (summary.effectiveGovernanceAtCommit !== undefined && summary.effectiveGovernanceAtCommit !== null) {
    pushPolicyAtCommitMarkdownLines(
      { effectiveGovernanceAtCommit: summary.effectiveGovernanceAtCommit },
      lines,
    );
  } else {
    lines.push("");
  }

  lines.push("## Objectives");
  lines.push("");

  if (summary.operatorSummary) {
    lines.push(summary.operatorSummary);
  } else {
    lines.push("_No operator summary was returned by the API._");
  }

  lines.push("");

  lines.push("## Architecture overview");
  lines.push("");
  lines.push(
    "Full review record JSON was not available in the browser session; this export contains summary counts only.",
  );
  lines.push("");
  lines.push(`- **Decisions:** ${summary.decisionCount}`);
  lines.push(`- **Warnings:** ${summary.warningCount}`);
  lines.push(`- **Unresolved issues:** ${summary.unresolvedIssueCount}`);
  lines.push("");

  lines.push("## Component breakdown");
  lines.push("");
  lines.push("_Unavailable without full review record JSON._");
  lines.push("");

  lines.push("## Security model");
  lines.push("");
  lines.push("_Unavailable without full review record JSON._");
  lines.push("");

  return lines.join("\n");
}

function looksLikeSandboxGoldenManifest(m: Record<string, unknown>): boolean {
  return (
    Array.isArray(m.highlights) &&
    isRecord(m.summary) &&
    typeof m.schemaVersion === "string"
  );
}

/**
 * Renders a readable Markdown summary from a golden manifest JSON value (ManifestDocument or legacy sandbox shapes).
 */
export function formatGoldenManifestMarkdown(
  goldenManifestJson: unknown,
  options?: GoldenManifestMarkdownOptions,
): string {
  let body: string;

  if (isUsableGoldenManifestExportJson(goldenManifestJson)) {
    const m = goldenManifestJson as Record<string, unknown>;

    if (looksLikeSandboxGoldenManifest(m)) {
      body = formatSandboxStyleGoldenManifest(m);
    } else {
      body = formatManifestDocumentShape(m);
    }
  } else if (options?.manifestSummaryFallback) {
    body = formatManifestSummaryFallback(options.manifestSummaryFallback, options.runId ?? null);
  } else {
    body =
      `# Finalized review record export\n\n` +
      `Review record JSON was not available and no summary fallback was provided.\n`;
  }

  return appendTrustEvidenceMarkdownSection(body, options?.trustEvidenceCard);
}
