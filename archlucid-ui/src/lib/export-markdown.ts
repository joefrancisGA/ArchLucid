import type { ManifestSummary, RunTrustEvidenceCard } from "@/types/authority";

import { formatManifestDocumentShape } from "./export-markdown-manifest-document";
import { formatCareerExportHonestyMarkdown } from "@/lib/career-export-coverage-honesty";
import type { CareerExportCoverageHonestyInput } from "@/lib/career-export-coverage-honesty";
import { formatTransparencyTrailMarkdownSection } from "@/lib/feasibility/export-transparency-trail-section";
import { formatInsightDensityMeasurementFloorPresentation } from "@/lib/quality/insight-density-measurement-floor";
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
  /** Distinct engines that produced findings on this package snapshot (PC-01). */
  enginesSucceeded?: number | null;
  /** Optional inputs for the shared career export honesty block (PC-13). */
  careerExportHonesty?: Omit<CareerExportCoverageHonestyInput, "runId" | "manifestSummary"> & {
    readonly manifestSummary?: ManifestSummary | null;
  };
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

function resolveCareerExportHonestyInput(
  options: GoldenManifestMarkdownOptions | undefined,
  manifestSummary: ManifestSummary | null | undefined,
): CareerExportCoverageHonestyInput | null {
  const runId = options?.runId?.trim() ?? "";

  if (runId.length === 0) {
    return null;
  }

  const honestyOptions = options?.careerExportHonesty;

  return {
    runId,
    progressSummary: honestyOptions?.progressSummary ?? null,
    manifestSummary: manifestSummary ?? honestyOptions?.manifestSummary ?? null,
    graphSnapshot: honestyOptions?.graphSnapshot ?? null,
    enginesSucceeded: options?.enginesSucceeded ?? honestyOptions?.enginesSucceeded ?? null,
    workingDesk: honestyOptions?.workingDesk ?? false,
    classificationCounts: honestyOptions?.classificationCounts ?? null,
  };
}

function appendCareerExportHonestyMarkdownSection(
  body: string,
  options: GoldenManifestMarkdownOptions | undefined,
  manifestSummary: ManifestSummary | null | undefined,
): string {
  const honestyInput = resolveCareerExportHonestyInput(options, manifestSummary);

  if (honestyInput === null) {
    return body;
  }

  const honestyMarkdown = formatCareerExportHonestyMarkdown(honestyInput).trim();

  if (honestyMarkdown.length === 0) {
    return body;
  }

  return `${body.trim()}\n\n${honestyMarkdown}\n`;
}

function formatManifestSummaryFallback(
  summary: ManifestSummary,
  runId?: string | null,
  enginesSucceeded?: number | null,
  options?: GoldenManifestMarkdownOptions,
): string {
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

  const honestyInput = resolveCareerExportHonestyInput(options, summary);

  if (honestyInput !== null) {
    lines.push(formatCareerExportHonestyMarkdown(honestyInput).trim());
    lines.push("");
  } else {
    lines.push("## Measurement floor");
    lines.push("");
    lines.push(formatInsightDensityMeasurementFloorPresentation(enginesSucceeded ?? null).line);
    lines.push("");
  }

  const trail = summary.feasibilityVerdict?.transparencyTrail ?? null;

  if (honestyInput === null && trail !== null && trail !== undefined) {
    lines.push(formatTransparencyTrailMarkdownSection(trail));
  }

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
  let appendSharedHonesty = false;

  if (isUsableGoldenManifestExportJson(goldenManifestJson)) {
    const m = goldenManifestJson as Record<string, unknown>;

    if (looksLikeSandboxGoldenManifest(m)) {
      body = formatSandboxStyleGoldenManifest(m);
    } else {
      body = formatManifestDocumentShape(m);
    }

    appendSharedHonesty = true;
  } else if (options?.manifestSummaryFallback) {
    body = formatManifestSummaryFallback(
      options.manifestSummaryFallback,
      options.runId ?? null,
      options.enginesSucceeded ?? null,
      options,
    );
  } else {
    body =
      `# Finalized review record export\n\n` +
      `Review record JSON was not available and no summary fallback was provided.\n`;
  }

  const withHonesty = appendSharedHonesty
    ? appendCareerExportHonestyMarkdownSection(body, options, options?.manifestSummaryFallback ?? null)
    : body;

  return appendTrustEvidenceMarkdownSection(withHonesty, options?.trustEvidenceCard);
}
