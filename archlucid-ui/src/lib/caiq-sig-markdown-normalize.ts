import type { HelpMarkdownHeading } from "@/lib/help/help-markdown-headings";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";

export type HelpTopicTocGroup = {
  readonly id: string;
  readonly label: string;
  readonly headings: readonly HelpMarkdownHeading[];
};

export const CAIQ_SIG_RESPONSE_LITE_PART_HEADING = "CAIQ Lite (subset)" as const;

export const CAIQ_SIG_RESPONSE_SIG_PART_HEADING =
  "SIG Core (family summary index, not a full row checklist)" as const;

export const CAIQ_SIG_RESPONSE_LITE_SCOPE =
  "Pre-filled CAIQ Lite themes mapped to in-repo evidence — not a completed STAR / CCM workbook submission." as const;

export const CAIQ_SIG_RESPONSE_SIG_SCOPE =
  "SIG Core control families summarized for RFP appendix drafts — not a complete SIG row checklist." as const;

const CAIQ_SECTION_PREFIXES = ["Governance", "Human resources", "Information management", "Operations", "Application security"] as const;

const SIG_FAMILY_HEADING_PREFIX = "Control family ";

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

  return trimmed;
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
