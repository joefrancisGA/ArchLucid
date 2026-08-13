import type { WorkItemClipboardFormat } from "@/lib/copy-finding-as-work-item";
import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";
import { severityBadgeLabel } from "@/lib/quick-decision-summary-derive";

export type ArchitectureWorkItemFindingLine = {
  readonly findingId: string;
  readonly title: string;
  readonly severityLabel: string;
  readonly recommendedAction: string;
};

export type ArchitectureWorkItemPreview = {
  readonly title: string;
  readonly description: string;
  readonly priority: string;
  readonly owner: string;
  readonly findingsIncluded: readonly ArchitectureWorkItemFindingLine[];
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

function deriveArchitecturePriority(findings: readonly QuickDecisionFinding[]): string {
  if (findings.length === 0) {
    return "Medium";
  }

  const highest = findings.reduce((max, finding) => Math.max(max, finding.severityValue), 0);

  return severityBadgeLabel(highest);
}

function mapFindingLines(findings: readonly QuickDecisionFinding[]): ArchitectureWorkItemFindingLine[] {
  const sorted = [...findings].sort((left, right) => right.severityValue - left.severityValue);

  return sorted.slice(0, MAX_FINDING_LINES).map((finding) => ({
    findingId: finding.findingId,
    title: finding.title,
    severityLabel: severityBadgeLabel(finding.severityValue),
    recommendedAction: finding.recommendation.trim().length > 0 ? finding.recommendation.trim() : "See finding detail.",
  }));
}

export function pickNativeCreateFindingId(findings: readonly QuickDecisionFinding[]): string | null {
  if (findings.length === 0) {
    return null;
  }

  const sorted = [...findings].sort((left, right) => right.severityValue - left.severityValue);

  return sorted[0]?.findingId ?? null;
}

export function buildArchitectureWorkItemPreview(
  input: BuildArchitectureWorkItemPreviewInput,
): ArchitectureWorkItemPreview {
  const overview = input.architectureOverview.trim();
  const description =
    overview.length > 0
      ? overview
      : "Implementation work derived from the ArchLucid architecture review.";

  return {
    title: `Implement architecture — ${input.architectureName.trim() || "ArchLucid review"}`,
    description,
    priority: deriveArchitecturePriority(input.findings),
    owner: input.ownerLabel?.trim() || "Unassigned",
    findingsIncluded: mapFindingLines(input.findings),
    sourceArchitectureLink: architectureReviewUrl(input.siteOrigin, input.runId),
  };
}

function formatFindingsForClipboard(findings: readonly ArchitectureWorkItemFindingLine[]): string[] {
  if (findings.length === 0) {
    return ["No findings recorded yet — add assessment findings before tracking remediation tasks."];
  }

  return findings.map(
    (finding, index) =>
      `${index + 1}. [${finding.severityLabel}] ${finding.title} (${finding.findingId})\n   ${finding.recommendedAction}`,
  );
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
  const findingLines = formatFindingsForClipboard(preview.findingsIncluded);

  if (format === "jiraWiki") {
    return [
      `h2. ${preview.title}`,
      "",
      `*Priority:* ${preview.priority}`,
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
      `Priority: ${preview.priority}`,
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
    `**Priority:** ${preview.priority}`,
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
