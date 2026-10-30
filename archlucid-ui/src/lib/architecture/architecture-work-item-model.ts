import type { WorkItemClipboardFormat } from "@/lib/copy-finding-as-work-item";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { severityBadgeLabel } from "@/lib/quick-decision-summary-derive";
import { formatQuickDecisionRecommendedAction } from "@/lib/quick-decision-finding-links";
import { compareFindingSeverity } from "@/lib/quick-decision-severity-labels";

export type ArchitectureWorkItemFindingLine = {
  readonly findingId: string;
  readonly title: string;
  readonly severityLabel: string;
  readonly recommendedAction: string;
};

export type ArchitectureWorkItemPreview = {
  readonly title: string;
  readonly description: string;
  readonly highestFindingSeverity: string;
  readonly owner: string;
  readonly findingsIncluded: readonly ArchitectureWorkItemFindingLine[];
  readonly findingsOmittedCount: number;
  readonly sourceArchitectureLink: string;
};

export type BuildArchitectureWorkItemPreviewInput = {
  readonly runId: string;
  readonly architectureName: string;
  readonly architectureOverview: string;
  readonly ownerLabel: string | null;
  readonly findings: readonly QuickDecisionFinding[];
  readonly siteOrigin: string;
};

const MAX_FINDING_LINES = 8;

function architectureReviewUrl(siteOrigin: string, runId: string): string {
  const origin = siteOrigin.replace(/\/$/, "");

  return `${origin}/architecture/reviews/${encodeURIComponent(runId)}`;
}

function deriveHighestFindingSeverity(findings: readonly QuickDecisionFinding[]): string {
  const knownSeverities = findings
    .map((finding) => finding.severityValue)
    .filter((severity): severity is number => severity !== null);

  if (knownSeverities.length === 0) {
    return "Severity was not stored.";
  }

  const highest = Math.max(...knownSeverities);

  return severityBadgeLabel(highest);
}

function resolveArchitectureWorkItemOwnerLabel(ownerLabel: string | null): string {
  if (ownerLabel === null) {
    return "Work item owner was not stored.";
  }

  if (ownerLabel.trim().length === 0) {
    return "Work item owner was stored empty.";
  }

  return ownerLabel.trim();
}

function sliceFindingsForPreview(findings: readonly QuickDecisionFinding[]): {
  readonly included: readonly QuickDecisionFinding[];
  readonly omittedCount: number;
} {
  const sorted = [...findings].sort((left, right) => compareFindingSeverity(left.severityValue, right.severityValue));
  const included = sorted.slice(0, MAX_FINDING_LINES);

  return {
    included,
    omittedCount: Math.max(0, sorted.length - included.length),
  };
}

function mapFindingLines(findings: readonly QuickDecisionFinding[]): {
  readonly lines: ArchitectureWorkItemFindingLine[];
  readonly omittedCount: number;
} {
  const { included, omittedCount } = sliceFindingsForPreview(findings);

  return {
    omittedCount,
    lines: included.map((finding) => ({
      findingId: finding.findingId,
      title:
        finding.title.trim().length > 0 ? finding.title.trim() : "Finding title was not stored.",
      severityLabel: severityBadgeLabel(finding.severityValue),
      recommendedAction: formatQuickDecisionRecommendedAction(finding.recommendation),
    })),
  };
}

export function pickNativeCreateFindingId(findings: readonly QuickDecisionFinding[]): string | null {
  if (findings.length === 0) {
    return null;
  }

  const sorted = [...findings].sort((left, right) => compareFindingSeverity(left.severityValue, right.severityValue));

  return sorted[0]?.findingId ?? null;
}

export function buildArchitectureWorkItemPreview(
  input: BuildArchitectureWorkItemPreviewInput,
): ArchitectureWorkItemPreview {
  const overview = input.architectureOverview.trim();
  const description =
    overview.length > 0
      ? overview
      : "Architecture overview was not stored.";

  const architectureName = input.architectureName.trim();
  const title =
    architectureName.length > 0
      ? `Draft architecture work item — ${architectureName}`
      : "Draft architecture work item — architecture name was not stored.";

  const mappedFindings = mapFindingLines(input.findings);

  return {
    title,
    description,
    highestFindingSeverity: deriveHighestFindingSeverity(input.findings),
    owner: resolveArchitectureWorkItemOwnerLabel(input.ownerLabel),
    findingsIncluded: mappedFindings.lines,
    findingsOmittedCount: mappedFindings.omittedCount,
    sourceArchitectureLink: architectureReviewUrl(input.siteOrigin, input.runId),
  };
}

function formatFindingsCapRemainderLine(omittedCount: number): string | null {
  if (omittedCount <= 0) {
    return null;
  }

  return `${omittedCount} additional finding${omittedCount === 1 ? "" : "s"} were not included in this preview.`;
}

function formatFindingsForClipboard(
  findings: readonly ArchitectureWorkItemFindingLine[],
  omittedCount: number,
): string[] {
  if (findings.length === 0) {
    return ["Findings were not stored."];
  }

  const lines = findings.map(
    (finding, index) =>
      `${index + 1}. [${finding.severityLabel}] ${finding.title} (${finding.findingId})\n   ${finding.recommendedAction}`,
  );

  const remainder = formatFindingsCapRemainderLine(omittedCount);

  return remainder !== null ? [...lines, remainder] : lines;
}

export function clipboardFormatForItsmProvider(provider: "Jira" | "ServiceNow"): WorkItemClipboardFormat {
  if (provider === "Jira") {
    return "jiraWiki";
  }

  return "serviceNowText";
}

export function buildArchitectureWorkItemClipboardBody(
  format: WorkItemClipboardFormat,
  preview: ArchitectureWorkItemPreview,
): string {
  const findingLines = formatFindingsForClipboard(preview.findingsIncluded, preview.findingsOmittedCount);

  if (format === "jiraWiki") {
    return [
      `h2. ${preview.title}`,
      "",
      `*Severity (highest finding):* ${preview.highestFindingSeverity}`,
      `*Priority:* Priority was not stored.`,
      `*Owner:* ${preview.owner}`,
      "",
      "*Description*",
      preview.description,
      "",
      "*Findings or tasks*",
      ...findingLines.map((line) => `# ${line.replace(/\n/g, "\n# ")}`),
      "",
      "*Source architecture*",
      `* (${preview.sourceArchitectureLink}|ArchLucid architecture review)`,
    ].join("\n");
  }

  if (format === "serviceNowText") {
    return [
      `Short description: ${preview.title}`,
      "",
      "Description:",
      preview.description,
      "",
      `Severity (highest finding): ${preview.highestFindingSeverity}`,
      "Priority: Priority was not stored.",
      `Owner: ${preview.owner}`,
      "",
      "Findings or tasks:",
      ...findingLines,
      "",
      `Source architecture: ${preview.sourceArchitectureLink}`,
    ].join("\n");
  }

  return [
    `## ${preview.title}`,
    "",
    `**Severity (highest finding):** ${preview.highestFindingSeverity}`,
    "**Priority:** Priority was not stored.",
    `**Owner:** ${preview.owner}`,
    "",
    preview.description,
    "",
    "### Findings or tasks",
    ...findingLines.map((line) => `- ${line.replace(/\n/g, "\n  ")}`),
    "",
    `**Source architecture:** ${preview.sourceArchitectureLink}`,
  ].join("\n");
}
