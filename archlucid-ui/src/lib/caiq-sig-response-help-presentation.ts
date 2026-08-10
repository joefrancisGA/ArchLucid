import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import type { HelpMarkdownHeading } from "@/lib/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help-markdown-presentation";

export const CAIQ_SIG_RESPONSE_LITE_PART_HEADING = "CAIQ Lite (subset)" as const;

export const CAIQ_SIG_RESPONSE_SIG_PART_HEADING =
  "SIG Core (family summary index, not a full row checklist)" as const;

export const CAIQ_SIG_RESPONSE_LITE_SCOPE =
  "Pre-filled CAIQ Lite themes mapped to in-repo evidence — not a completed STAR / CCM workbook submission." as const;

export const CAIQ_SIG_RESPONSE_SIG_SCOPE =
  "SIG Core control families summarized for RFP appendix drafts — not a complete SIG row checklist." as const;

export type CaiqSigPostureStatus = "Strong" | "Partial" | "Planned" | "Inherited";

export type CaiqSigResponsePostureCounts = Readonly<Record<CaiqSigPostureStatus, number>>;

export type CaiqSigEvidenceAffordanceKind = "linked-artifact" | "inherited-provider" | "nda-on-request" | "prose-only";

export type CaiqSigEvidenceAffordance = {
  readonly kind: CaiqSigEvidenceAffordanceKind;
  readonly qualifier: string;
};

export type HelpTopicTocGroup = {
  readonly id: string;
  readonly label: string;
  readonly headings: readonly HelpMarkdownHeading[];
};

const CAIQ_SECTION_PREFIXES = ["Governance", "Human resources", "Information management", "Operations", "Application security"] as const;

const SIG_FAMILY_HEADING_PREFIX = "Control family ";

const EMPTY_POSTURE_COUNTS: CaiqSigResponsePostureCounts = {
  Strong: 0,
  Partial: 0,
  Planned: 0,
  Inherited: 0,
};

export function isCaiqSigResponseHelpTopic(helpTopicSlug: string | undefined): boolean {
  return helpTopicSlug === "caiq-sig-response";
}

function stripMarkdownSection(markdown: string, sectionTitle: string): string {
  const lines = markdown.split("\n");
  const result: string[] = [];
  let omitSection = false;

  for (const line of lines) {
    if (line.startsWith("## ") && !line.startsWith("###")) {
      const title = line.slice(3).trim();

      omitSection = title.toLowerCase() === sectionTitle.toLowerCase();
    }

    if (!omitSection) {
      result.push(line);
    }
  }

  return result.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd();
}

function stripCaiqSigRelatedSections(markdown: string): string {
  let result = markdown;

  while (result.toLowerCase().includes("\n## related")) {
    result = stripMarkdownSection(result, "Related");
  }

  return result;
}

function splitCaiqSigHalves(markdown: string): { readonly lite: string; readonly sig: string } {
  const separator = "\n\n---\n\n";
  const separatorIndex = markdown.indexOf(separator);

  if (separatorIndex < 0) {
    const sigMarker = markdown.indexOf("\n## Control family ");

    if (sigMarker < 0) {
      return { lite: markdown, sig: "" };
    }

    return {
      lite: markdown.slice(0, sigMarker).trimEnd(),
      sig: markdown.slice(sigMarker).trimStart(),
    };
  }

  return {
    lite: markdown.slice(0, separatorIndex).trimEnd(),
    sig: markdown.slice(separatorIndex + separator.length).trimStart(),
  };
}

function stripLeadingTitleAndPreamble(half: string): string {
  const lines = half.split("\n");
  const result: string[] = [];
  let skippedTitle = false;

  for (const line of lines) {
    if (!skippedTitle && line.startsWith("# ") && !line.startsWith("##")) {
      skippedTitle = true;
      continue;
    }

    if (!skippedTitle && line.trimStart().startsWith(">")) {
      continue;
    }

    if (!skippedTitle && line.trim().length === 0) {
      continue;
    }

    if (
      !skippedTitle &&
      (line.startsWith("**Source alignment:**") ||
        line.startsWith("**Dry-run note") ||
        line.startsWith("**Product context:**"))
    ) {
      continue;
    }

    result.push(line);
  }

  return result.join("\n").trimStart();
}

function normalizeSigStatusCell(statusCell: string): string {
  const trimmed = statusCell.trim();

  if (/^partial\s*[—–-]/i.test(trimmed)) {
    return "Partial";
  }

  return trimmed.replace(/\s*\(engineering\)\s*$/i, "").trim();
}

function normalizeSigTableRow(row: string): string {
  if (!row.trimStart().startsWith("|")) {
    return row;
  }

  const cells = row
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

  if (cells.length < 3) {
    return row;
  }

  const statusIndex = cells.findIndex((cell) =>
    /^(strong|partial|planned|inherited)/i.test(cell.replace(/\s*\(engineering\)\s*$/i, "")),
  );

  if (statusIndex < 0) {
    return row;
  }

  const statusCell = cells[statusIndex] ?? "";
  const normalizedStatus = normalizeSigStatusCell(statusCell);

  if (normalizedStatus === statusCell.trim()) {
    return row;
  }

  const evidenceIndex = statusIndex + 1;
  const evidenceCell = cells[evidenceIndex] ?? "";
  cells[statusIndex] = normalizedStatus;

  if (/^partial\s*[—–-]/i.test(statusCell)) {
    const narrative = statusCell.replace(/^partial\s*[—–-]\s*/i, "").trim();

    if (narrative.length > 0) {
      const mergedEvidence =
        evidenceCell.length > 0
          ? `${narrative} ${evidenceCell}`
          : `${narrative} **Evidence kind:** Available under NDA on request.`;

      cells[evidenceIndex] = mergedEvidence;
    }
  }

  return `| ${cells.join(" | ")} |`;
}

function normalizeSigStatusRows(markdown: string): string {
  return markdown
    .split("\n")
    .map((line) => normalizeSigTableRow(line))
    .join("\n");
}

type ParsedSigRow = {
  readonly familyLabel: string;
  readonly controlIntent: string;
  readonly status: string;
  readonly evidence: string;
};

function parseSigFamilySection(sectionMarkdown: string): readonly ParsedSigRow[] {
  const headingMatch = sectionMarkdown.match(/^## Control family ([^\n]+)/m);

  if (headingMatch === null || headingMatch[1] === undefined) {
    return [];
  }

  const familyLabel = headingMatch[1].trim();
  const tableLines = sectionMarkdown.split("\n").filter((line) => line.trimStart().startsWith("|"));
  const dataRows = tableLines.filter((line) => {
    const trimmed = line.trim();

    if (!trimmed.startsWith("|")) {
      return false;
    }

    if (/^[\s|:-]+$/.test(trimmed)) {
      return false;
    }

    if (trimmed.toLowerCase().includes("control intent")) {
      return false;
    }

    return true;
  });

  const rows: ParsedSigRow[] = [];

  for (const dataRow of dataRows) {
    const rowCells = dataRow
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (rowCells.length < 3) {
      continue;
    }

    rows.push({
      familyLabel,
      controlIntent: rowCells[0] ?? "",
      status: rowCells[1] ?? "",
      evidence: rowCells[2] ?? "",
    });
  }

  return rows;
}

function extractSigFamilySections(sigHalf: string): readonly ParsedSigRow[] {
  const chunks = sigHalf.split(/\n(?=## Control family )/);
  const rows: ParsedSigRow[] = [];

  for (const chunk of chunks) {
    if (!chunk.trimStart().startsWith("## Control family ")) {
      continue;
    }

    rows.push(...parseSigFamilySection(chunk));
  }

  return rows;
}

function stripSigFamilySections(sigHalf: string): string {
  return sigHalf.replace(/\n## Control family [\s\S]*?(?=\n## Control family |\n### SIG Core|$)/g, "").trimEnd();
}

function consolidateSigCoreTables(sigHalf: string): string {
  const rows = extractSigFamilySections(sigHalf);

  if (rows.length === 0) {
    return sigHalf;
  }

  const tableBody = rows
    .map(
      (row) =>
        `| ${row.familyLabel} | ${row.controlIntent} | ${normalizeSigStatusCell(row.status)} | ${row.evidence} |`,
    )
    .join("\n");

  const consolidatedTable = [
    "### SIG Core control families",
    "",
    "| Family | Control intent | Status | Evidence |",
    "|--------|----------------|--------|----------|",
    tableBody,
  ].join("\n");

  const withoutFamilySections = stripSigFamilySections(sigHalf);

  return `${withoutFamilySections}\n\n${consolidatedTable}`.trimEnd();
}

function wrapLiteHalf(liteHalf: string): string {
  const body = stripLeadingTitleAndPreamble(liteHalf);

  return [
    `## ${CAIQ_SIG_RESPONSE_LITE_PART_HEADING}`,
    "",
    CAIQ_SIG_RESPONSE_LITE_SCOPE,
    "",
    body,
  ].join("\n");
}

function wrapSigHalf(sigHalf: string): string {
  const body = stripLeadingTitleAndPreamble(sigHalf);
  const normalized = normalizeSigStatusRows(body);
  const consolidated = consolidateSigCoreTables(normalized);

  return [
    `## ${CAIQ_SIG_RESPONSE_SIG_PART_HEADING}`,
    "",
    CAIQ_SIG_RESPONSE_SIG_SCOPE,
    "",
    consolidated,
  ].join("\n");
}

export function structureCaiqSigResponseHelpMarkdown(markdown: string): string {
  const withoutRelated = stripCaiqSigRelatedSections(markdown);
  const { lite, sig } = splitCaiqSigHalves(withoutRelated);
  const parts: string[] = [];

  if (lite.trim().length > 0) {
    parts.push(wrapLiteHalf(lite));
  }

  if (sig.trim().length > 0) {
    parts.push(wrapSigHalf(sig));
  }

  return parts.join("\n\n").trimEnd();
}

export function prepareCaiqSigResponseHelpMarkdown(markdown: string, sourceDocPath: string): string {
  const prepared = prepareHelpMarkdownForPresentation(markdown, sourceDocPath, {
    helpTopicSlug: "caiq-sig-response",
  });

  return structureCaiqSigResponseHelpMarkdown(prepared);
}

function normalizePostureToken(raw: string): CaiqSigPostureStatus | null {
  const token = raw.trim().replace(/\s*\(engineering\)\s*$/i, "");

  if (/^strong/i.test(token)) {
    return "Strong";
  }

  if (/^partial/i.test(token)) {
    return "Partial";
  }

  if (/^planned/i.test(token)) {
    return "Planned";
  }

  if (/^inherited/i.test(token)) {
    return "Inherited";
  }

  return null;
}

function incrementPostureCount(
  counts: CaiqSigResponsePostureCounts,
  status: CaiqSigPostureStatus,
): CaiqSigResponsePostureCounts {
  return {
    ...counts,
    [status]: counts[status] + 1,
  };
}

function countPostureInTableRow(
  row: string,
  statusColumnIndex: number | null,
  responseColumnIndex: number | null,
): CaiqSigPostureStatus | null {
  const cells = row
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

  // Prefer Status (SIG Core). Never promote CAIQ Lite "Yes" to Strong — that label is not
  // rendered as a Strong StatusTag, so counting it here would break the posture rollup.
  if (statusColumnIndex !== null && statusColumnIndex >= 0 && cells[statusColumnIndex] !== undefined) {
    return normalizePostureToken(cells[statusColumnIndex] ?? "");
  }

  if (responseColumnIndex !== null && responseColumnIndex >= 0 && cells[responseColumnIndex] !== undefined) {
    const response = cells[responseColumnIndex] ?? "";

    // CAIQ Lite Response cells may say Partial; Yes/No stay out of Strong/Planned/Inherited.
    if (/^partial\b/i.test(response)) {
      return "Partial";
    }
  }

  return null;
}

export function computeCaiqSigResponsePostureCounts(preparedMarkdown: string): CaiqSigResponsePostureCounts {
  let counts: CaiqSigResponsePostureCounts = { ...EMPTY_POSTURE_COUNTS };
  const lines = preparedMarkdown.split("\n");
  let statusColumnIndex: number | null = null;
  let responseColumnIndex: number | null = null;
  let inTable = false;

  for (const line of lines) {
    if (!line.trimStart().startsWith("|")) {
      inTable = false;
      statusColumnIndex = null;
      responseColumnIndex = null;
      continue;
    }

    if (/^[\s|:-]+$/.test(line.trim())) {
      continue;
    }

    const cells = line
      .split("|")
      .map((cell) => cell.trim())
      .filter((cell) => cell.length > 0);

    if (!inTable) {
      statusColumnIndex = cells.findIndex((cell) => /^status$/i.test(cell));
      responseColumnIndex = cells.findIndex((cell) => /^response/i.test(cell));
      inTable = true;
      continue;
    }

    const posture = countPostureInTableRow(line, statusColumnIndex, responseColumnIndex);

    if (posture !== null) {
      counts = incrementPostureCount(counts, posture);
    }
  }

  return counts;
}

export function mapCaiqSigStatusLabelToTagKind(statusLabel: string): EnterpriseStatusKind {
  const normalized = normalizePostureToken(statusLabel);

  switch (normalized) {
    case "Strong":
      return "ready";
    case "Partial":
      return "needs-attention";
    case "Planned":
      return "in-progress";
    case "Inherited":
      return "approved-with-monitoring";
    default: {
      if (/^yes\b/i.test(statusLabel.trim())) {
        return "ready";
      }

      if (/^no\b/i.test(statusLabel.trim())) {
        return "blocked";
      }

      return "neutral";
    }
  }
}

export function resolveCaiqSigStatusTagLabel(statusLabel: string): string {
  const normalized = normalizePostureToken(statusLabel);

  if (normalized !== null) {
    return normalized;
  }

  const trimmed = statusLabel.trim();

  if (/^yes\b/i.test(trimmed)) {
    return "Yes";
  }

  if (/^no\b/i.test(trimmed)) {
    return "No";
  }

  return trimmed;
}

const MARKDOWN_LINK_PATTERN = /\[[^\]]+\]\(([^)]+)\)/;

export function resolveCaiqSigEvidenceAffordance(
  evidenceCell: string,
  statusCell?: string,
): CaiqSigEvidenceAffordance {
  const trimmed = evidenceCell.trim();
  const statusNormalized = statusCell !== undefined ? normalizePostureToken(statusCell) : null;

  if (statusNormalized === "Inherited") {
    return {
      kind: "inherited-provider",
      qualifier: "Inherited from cloud provider",
    };
  }

  if (/nda|under request|on request/i.test(trimmed)) {
    return {
      kind: "nda-on-request",
      qualifier: "Available under NDA on request",
    };
  }

  if (MARKDOWN_LINK_PATTERN.test(trimmed) || /^\[[^\]]+\]\(\/help\//.test(trimmed) || /\/help\//.test(trimmed)) {
    return {
      kind: "linked-artifact",
      qualifier: "Linked in-app artifact",
    };
  }

  if (/^links?$/i.test(trimmed) || /^iac$/i.test(trimmed) || /in-repo api test suite/i.test(trimmed)) {
    return {
      kind: "linked-artifact",
      qualifier: "Linked in-app artifact",
    };
  }

  return {
    kind: "prose-only",
    qualifier: "Assertion without in-app link",
  };
}

function isCaiqLiteSectionHeading(title: string): boolean {
  return CAIQ_SECTION_PREFIXES.some((prefix) => title.startsWith(prefix));
}

function isSigFamilyHeading(title: string): boolean {
  return title.startsWith(SIG_FAMILY_HEADING_PREFIX) || title === "SIG Core control families";
}

export function buildCaiqSigResponseTocGroups(headings: readonly HelpMarkdownHeading[]): readonly HelpTopicTocGroup[] {
  const liteHeadings: HelpMarkdownHeading[] = [];
  const sigHeadings: HelpMarkdownHeading[] = [];
  let activePart: "lite" | "sig" | null = null;

  for (const heading of headings) {
    if (heading.title === CAIQ_SIG_RESPONSE_LITE_PART_HEADING) {
      activePart = "lite";
      continue;
    }

    if (heading.title === CAIQ_SIG_RESPONSE_SIG_PART_HEADING) {
      activePart = "sig";
      continue;
    }

    if (heading.title.toLowerCase() === "related") {
      continue;
    }

    if (activePart === "lite" || isCaiqLiteSectionHeading(heading.title)) {
      liteHeadings.push(heading);
      activePart = "lite";
      continue;
    }

    if (activePart === "sig" || isSigFamilyHeading(heading.title)) {
      sigHeadings.push(heading);
      activePart = "sig";
    }
  }

  const groups: HelpTopicTocGroup[] = [];

  if (liteHeadings.length > 0) {
    groups.push({
      id: "caiq-lite-part",
      label: CAIQ_SIG_RESPONSE_LITE_PART_HEADING,
      headings: liteHeadings,
    });
  }

  if (sigHeadings.length > 0) {
    groups.push({
      id: "sig-core-part",
      label: CAIQ_SIG_RESPONSE_SIG_PART_HEADING,
      headings: sigHeadings,
    });
  }

  return groups;
}

export function resolveCaiqSigHelpTableCaption(partLabel: string, sectionTitle: string): string {
  return `${partLabel} — ${sectionTitle} reference table`;
}
