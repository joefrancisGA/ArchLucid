import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import type { HelpTopicTocGroup } from "@/lib/caiq-sig-response-help-presentation";

export function isSecurityTrustHelpTopic(helpTopicSlug: string | undefined): boolean {
  return helpTopicSlug === "security-trust";
}

export type SecurityTrustPostureCounts = {
  readonly selfAsserted: number;
  readonly planned: number;
  readonly active: number;
  readonly templateOnly: number;
  readonly notIssued: number;
};

const POSTURE_SUMMARY_HEADING = "## Posture summary";

const SECURITY_TRUST_TOC_GROUP_LABELS = {
  posture: "Posture and assurance",
  data: "Data handling and connectivity",
  procurement: "Procurement",
  engineering: "Engineering evidence",
} as const;

function classifySecurityTrustPostureStatus(statusLabel: string): keyof SecurityTrustPostureCounts | null {
  const trimmed = statusLabel.trim().toLowerCase();

  if (trimmed.startsWith("self-asserted")) {
    return "selfAsserted";
  }

  if (trimmed.startsWith("planned")) {
    return "planned";
  }

  if (trimmed.startsWith("active")) {
    return "active";
  }

  if (trimmed.startsWith("template")) {
    return "templateOnly";
  }

  if (trimmed.includes("not issued")) {
    return "notIssued";
  }

  return null;
}

function extractPostureSummarySection(markdown: string): { section: string; remainder: string } | null {
  const startIdx = markdown.indexOf(POSTURE_SUMMARY_HEADING);

  if (startIdx < 0) {
    return null;
  }

  const afterHeading = markdown.slice(startIdx + POSTURE_SUMMARY_HEADING.length);
  const nextHeadingMatch = afterHeading.match(/\n## /);
  const endIdx =
    nextHeadingMatch?.index !== undefined
      ? startIdx + POSTURE_SUMMARY_HEADING.length + nextHeadingMatch.index
      : markdown.length;
  const section = markdown.slice(startIdx, endIdx).trimEnd();
  const remainder = `${markdown.slice(0, startIdx).trimEnd()}\n\n${markdown.slice(endIdx).trimStart()}`.trim();

  return { section, remainder };
}

/** Moves posture summary directly under the page lead-in so sponsors see assurance mix first. */
export function promoteSecurityTrustPostureSection(markdown: string): string {
  const extracted = extractPostureSummarySection(markdown);

  if (extracted === null) {
    return markdown;
  }

  const introAnchor = "---\n\n## Procurement questionnaire accelerator";
  const anchorIdx = extracted.remainder.indexOf(introAnchor);

  if (anchorIdx < 0) {
    return markdown;
  }

  return `${extracted.remainder.slice(0, anchorIdx).trimEnd()}\n\n${extracted.section}\n\n---\n\n${extracted.remainder.slice(anchorIdx + "---\n\n".length).trimStart()}`;
}

function parsePostureSummaryStatusCells(markdown: string): readonly string[] {
  const sectionMatch = markdown.match(/## Posture summary[\s\S]*?\n\| Control[\s\S]*?\n\|[-| :]+\|\n([\s\S]*?)(?:\n---|\n## |$)/);

  if (sectionMatch === null) {
    return [];
  }

  const rows = sectionMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  const statuses: string[] = [];

  for (const row of rows) {
    const cells = row
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (cells.length >= 2) {
      statuses.push(cells[1] ?? "");
    }
  }

  return statuses;
}

export function computeSecurityTrustPostureCounts(preparedMarkdown: string): SecurityTrustPostureCounts {
  // Mutable accumulator; returned object satisfies the readonly counts shape.
  const counts: { -readonly [K in keyof SecurityTrustPostureCounts]: number } = {
    selfAsserted: 0,
    planned: 0,
    active: 0,
    templateOnly: 0,
    notIssued: 0,
  };

  for (const status of parsePostureSummaryStatusCells(preparedMarkdown)) {
    const bucket = classifySecurityTrustPostureStatus(status);

    if (bucket !== null) {
      counts[bucket] += 1;
    }
  }

  return counts;
}

export function countSecurityTrustPostureTableRows(preparedMarkdown: string): number {
  return parsePostureSummaryStatusCells(preparedMarkdown).length;
}

export function sumSecurityTrustPostureCounts(counts: SecurityTrustPostureCounts): number {
  return counts.selfAsserted + counts.planned + counts.active + counts.templateOnly + counts.notIssued;
}

function isSecurityTrustPostureHeading(title: string): boolean {
  const normalized = title.trim().toLowerCase();

  return (
    normalized === "posture summary"
    || normalized === "self-asserted controls"
    || normalized === "planned controls"
    || normalized === "third-party engagements"
    || normalized === "customer-facing artifacts"
    || normalized === "how to request the procurement pack"
    || normalized === "support responsiveness"
  );
}

function isSecurityTrustDataHeading(title: string): boolean {
  const normalized = title.trim().toLowerCase();

  return (
    normalized === "healthcare and phi"
    || normalized === "cloud inventory connectivity (tier 1 default)"
    || normalized === "download the evidence pack"
    || normalized === "tenant isolation (production)"
  );
}

function isSecurityTrustProcurementHeading(title: string): boolean {
  return title.trim().toLowerCase() === "procurement questionnaire accelerator";
}

function isSecurityTrustEngineeringHeading(title: string): boolean {
  const normalized = title.trim().toLowerCase();

  return normalized.includes("scalability") || normalized.includes("load evidence");
}

export function buildSecurityTrustTocGroups(headings: readonly HelpMarkdownHeading[]): readonly HelpTopicTocGroup[] {
  const postureHeadings: HelpMarkdownHeading[] = [];
  const dataHeadings: HelpMarkdownHeading[] = [];
  const procurementHeadings: HelpMarkdownHeading[] = [];
  const engineeringHeadings: HelpMarkdownHeading[] = [];

  for (const heading of headings) {
    if (isSecurityTrustPostureHeading(heading.title)) {
      postureHeadings.push(heading);
      continue;
    }

    if (isSecurityTrustDataHeading(heading.title)) {
      dataHeadings.push(heading);
      continue;
    }

    if (isSecurityTrustProcurementHeading(heading.title)) {
      procurementHeadings.push(heading);
      continue;
    }

    if (isSecurityTrustEngineeringHeading(heading.title)) {
      engineeringHeadings.push(heading);
    }
  }

  const groups: HelpTopicTocGroup[] = [];

  if (postureHeadings.length > 0) {
    groups.push({
      id: "security-trust-posture",
      label: SECURITY_TRUST_TOC_GROUP_LABELS.posture,
      headings: postureHeadings,
    });
  }

  if (dataHeadings.length > 0) {
    groups.push({
      id: "security-trust-data",
      label: SECURITY_TRUST_TOC_GROUP_LABELS.data,
      headings: dataHeadings,
    });
  }

  if (procurementHeadings.length > 0) {
    groups.push({
      id: "security-trust-procurement",
      label: SECURITY_TRUST_TOC_GROUP_LABELS.procurement,
      headings: procurementHeadings,
    });
  }

  if (engineeringHeadings.length > 0) {
    groups.push({
      id: "security-trust-engineering",
      label: SECURITY_TRUST_TOC_GROUP_LABELS.engineering,
      headings: engineeringHeadings,
    });
  }

  return groups;
}

/** Short StatusTag label for posture-summary table rows. */
export function resolveSecurityTrustPostureStatusTagLabel(statusLabel: string): string {
  const trimmed = statusLabel.trim();

  if (/^self-asserted\b/i.test(trimmed)) {
    return "Self-asserted";
  }

  if (/^planned\b/i.test(trimmed)) {
    return "Planned";
  }

  if (/^active\b/i.test(trimmed)) {
    return "Active";
  }

  if (/^template\b/i.test(trimmed)) {
    return "Template only";
  }

  if (/not issued/i.test(trimmed)) {
    return "Not issued";
  }

  const firstClause = trimmed.split(/[—–]/)[0]?.trim() ?? trimmed;

  return firstClause.length > 48 ? `${firstClause.slice(0, 45)}…` : firstClause;
}

export function mapSecurityTrustPostureStatusToTagKind(statusLabel: string): EnterpriseStatusKind {
  const trimmed = statusLabel.trim().toLowerCase();

  if (trimmed.startsWith("self-asserted")) {
    return "neutral";
  }

  if (trimmed.startsWith("planned")) {
    return "in-progress";
  }

  if (trimmed.startsWith("active")) {
    return "in-progress";
  }

  if (trimmed.startsWith("template")) {
    return "neutral";
  }

  if (trimmed.includes("not issued")) {
    return "needs-attention";
  }

  return "neutral";
}

/** Qualifier text after the StatusTag when the status cell includes an em dash clause. */
export function resolveSecurityTrustPostureStatusQualifier(statusLabel: string): string | null {
  const parts = statusLabel.split(/[—–]/);

  if (parts.length < 2) {
    return null;
  }

  const qualifier = parts.slice(1).join("—").trim();

  return qualifier.length > 0 ? qualifier : null;
}

/** Late-stage buyer-safe rewrites after V1 label stripping and link resolution. */
export function finalizeSecurityTrustHelpPresentation(markdown: string): string {
  return promoteSecurityTrustPostureSection(
    markdown
      .replace(
        />\s*\*\*\[⬇ Download evidence pack \(ZIP\)\]\([^)]+\)\*\*/gi,
        "**[Download evidence pack (ZIP)](/help/security-trust#download-the-evidence-pack)** — use the header action for the anonymous ZIP.",
      )
      .replace(
        /\[scalability and load evidence\]\(#scalability-and-load-evidence\)/gi,
        "[Scalability and load evidence](/help/security-trust#scalability-and-load-evidence)",
      )
      .replace(/\[Assurance Status Canonical\]\(([^)]+)\)/gi, "[SOC 2 readiness roadmap]($1)")
      .replace(/\[Pen Test Summary Procurement Interim\]\(([^)]+)\)/gi, "[Procurement FAQ]($1)")
      .replace(/\[2026 Q2 Owner Conducted\]\(([^)]+)\)/gi, "[Owner-conducted pen-test summary]($1)")
      .replace(/\[2026 Q2 Sow\]\(([^)]+)\)/gi, "[Pen-test SoW template]($1)")
      .replace(/\[Soc2 Status Procurement\]\(([^)]+)\)/gi, "[SOC 2 procurement status]($1)")
      .replace(/\[Remediation Tracker\]\(([^)]+)\)/gi, "[Pen-test remediation tracker]($1)")
      .replace(
        /the http response carries an `etag`[\s\S]*?`304 not modified`\./gi,
        "The pack is regenerated from current repository sources on each download.",
      )
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd(),
  );
}
