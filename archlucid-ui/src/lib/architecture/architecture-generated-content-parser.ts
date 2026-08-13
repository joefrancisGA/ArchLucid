import { normalizeArchitectureNarrativeSourceForParsing } from "@/lib/architecture/architecture-narrative-presentation";
import {
  ARCHITECTURE_STRUCTURED_SECTION_KEYS,
  ARCHITECTURE_STRUCTURED_SECTION_TITLES,
  type ArchitectureContentProvenance,
  type ArchitectureCreationUserAssertions,
  type ArchitectureStructuredEntity,
  type ArchitectureStructuredParseResult,
  type ArchitectureStructuredSection,
  type ArchitectureStructuredSectionKey,
} from "@/lib/architecture/architecture-structured-content-types";

type MutableSectionDraft = {
  narrativeLines: string[];
  entities: ArchitectureStructuredEntity[];
  provenance: ArchitectureContentProvenance;
};

const SECTION_ALIAS_ENTRIES: ReadonlyArray<{ readonly key: ArchitectureStructuredSectionKey; readonly aliases: readonly string[] }> = [
  { key: "executive-summary", aliases: ["executive summary", "summary", "overview", "architecture overview"] },
  { key: "business-outcome", aliases: ["business outcome", "outcome", "business purpose", "business goal"] },
  { key: "scope", aliases: ["scope", "in scope", "out of scope", "boundaries"] },
  {
    key: "users-and-stakeholders",
    aliases: ["users and stakeholders", "users", "stakeholders", "actors", "people", "personas"],
  },
  { key: "systems-and-services", aliases: ["systems and services", "systems", "services", "components", "major systems"] },
  {
    key: "external-integrations",
    aliases: ["external integrations", "integrations", "external systems", "third party", "third-party"],
  },
  { key: "data-flows", aliases: ["data flows", "data flow", "information flow", "data movement"] },
  { key: "trust-boundaries", aliases: ["trust boundaries", "trust boundary", "security boundaries", "security boundary"] },
  { key: "constraints", aliases: ["constraints", "non-functional requirements", "nfr", "important constraints"] },
  { key: "risks", aliases: ["risks", "risk", "risk register"] },
  { key: "assumptions", aliases: ["assumptions", "assumption"] },
  { key: "open-questions", aliases: ["open questions", "questions", "unknowns", "gaps", "follow-ups", "follow ups"] },
];

const MODEL_ARTIFACT_LINE_PATTERN =
  /^\[(?:actor|inferred):|^(?:you are|as an ai|system prompt|assistant:|user:)|^\{[\s"]|^\[[\s"]/i;

const PIPE_DELIMITED_ROW_PATTERN = /^[^|\n]+\|[^|\n]+(?:\|[^|\n]+)*$/;

const MARKDOWN_TABLE_SEPARATOR_PATTERN = /^\|?[\s|:-]+\|?$/;

const INLINE_SECTION_LABEL_PATTERN =
  /^(#{1,3}\s*)?(\*{1,2})?([A-Za-z][A-Za-z0-9 /&'-]{1,60}?)(\*{1,2})?\s*:\s*(.*)$/;

function normalizeHeading(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/^\d+[\).\s-]+/, "")
    .replace(/[*_`#]/g, "")
    .replace(/\s+/g, " ");
}

function resolveSectionKey(heading: string): ArchitectureStructuredSectionKey | null {
  const normalized = normalizeHeading(heading);

  for (const entry of SECTION_ALIAS_ENTRIES) {
    for (const alias of entry.aliases) {
      if (normalized === alias || normalized.startsWith(`${alias} `) || normalized.endsWith(` ${alias}`)) {
        return entry.key;
      }
    }
  }

  return null;
}

function createEmptyDrafts(): Map<ArchitectureStructuredSectionKey, MutableSectionDraft> {
  const drafts = new Map<ArchitectureStructuredSectionKey, MutableSectionDraft>();

  for (const key of ARCHITECTURE_STRUCTURED_SECTION_KEYS) {
    drafts.set(key, { narrativeLines: [], entities: [], provenance: "inferred" });
  }

  return drafts;
}

function isModelArtifactLine(line: string): boolean {
  const trimmed = line.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (MODEL_ARTIFACT_LINE_PATTERN.test(trimmed)) {
    return true;
  }

  if ((trimmed.startsWith("{") && trimmed.endsWith("}")) || (trimmed.startsWith("[") && trimmed.endsWith("]"))) {
    try {
      JSON.parse(trimmed);
      return true;
    } catch {
      /* not json */
    }
  }

  return false;
}

function isMarkdownTableSeparator(line: string): boolean {
  return MARKDOWN_TABLE_SEPARATOR_PATTERN.test(line.trim()) && line.includes("-");
}

function parsePipeDelimitedRow(line: string): ArchitectureStructuredEntity | null {
  const trimmed = line.trim();

  if (!PIPE_DELIMITED_ROW_PATTERN.test(trimmed) || isMarkdownTableSeparator(trimmed)) {
    return null;
  }

  const cells = trimmed
    .split("|")
    .map((cell) => cell.trim())
    .filter((cell) => cell.length > 0);

  if (cells.length < 2) {
    return null;
  }

  const [label, ...rest] = cells;

  if (label === undefined || label.length === 0) {
    return null;
  }

  return {
    label,
    detail: rest.join(" · "),
    provenance: "inferred",
  };
}

function parseBulletEntity(line: string): ArchitectureStructuredEntity | null {
  const match = /^(?:[-*+]|\d+[.)])\s+(.+)$/.exec(line.trim());

  if (match === null) {
    return null;
  }

  const body = match[1]?.trim() ?? "";

  if (body.length === 0) {
    return null;
  }

  const labelDetail = /^([^:–—-]{2,80})[:–—-]\s+(.+)$/.exec(body);

  if (labelDetail !== null) {
    return {
      label: labelDetail[1]?.trim() ?? body,
      detail: labelDetail[2]?.trim() ?? null,
      provenance: "inferred",
    };
  }

  return {
    label: body,
    detail: null,
    provenance: "inferred",
  };
}

function appendNarrative(draft: MutableSectionDraft, line: string): void {
  const trimmed = line.trim();

  if (trimmed.length === 0) {
    return;
  }

  draft.narrativeLines.push(trimmed);
}

function appendEntity(draft: MutableSectionDraft, entity: ArchitectureStructuredEntity): void {
  const exists = draft.entities.some(
    (existing) => existing.label.toLowerCase() === entity.label.toLowerCase() && existing.detail === entity.detail,
  );

  if (!exists) {
    draft.entities.push(entity);
  }
}

function ingestLinesIntoDraft(draft: MutableSectionDraft, lines: readonly string[]): void {
  let index = 0;

  while (index < lines.length) {
    const line = lines[index] ?? "";
    const trimmed = line.trim();

    if (trimmed.length === 0) {
      index++;
      continue;
    }

    if (isMarkdownTableSeparator(trimmed)) {
      index++;
      continue;
    }

    const pipeEntity = parsePipeDelimitedRow(trimmed);

    if (pipeEntity !== null) {
      appendEntity(draft, pipeEntity);
      index++;
      continue;
    }

    const bulletEntity = parseBulletEntity(trimmed);

    if (bulletEntity !== null) {
      appendEntity(draft, bulletEntity);
      index++;
      continue;
    }

    appendNarrative(draft, trimmed);
    index++;
  }
}

function extractMarkdownHeading(line: string): { readonly heading: string; readonly inlineBody: string | null } | null {
  const hashMatch = /^(#{1,3})\s+(.+)$/.exec(line.trim());

  if (hashMatch !== null) {
    const rawHeading = hashMatch[2]?.trim() ?? "";
    const inlineBody = rawHeading.includes(":") ? rawHeading.split(":").slice(1).join(":").trim() : null;
    const heading = rawHeading.includes(":") ? (rawHeading.split(":")[0]?.trim() ?? rawHeading) : rawHeading;

    return {
      heading,
      inlineBody: inlineBody !== null && inlineBody.length > 0 ? inlineBody : null,
    };
  }

  const boldMatch = /^\*\*([^*]+)\*\*\s*:?\s*(.*)$/.exec(line.trim());

  if (boldMatch !== null) {
    const heading = boldMatch[1]?.trim() ?? "";
    const inlineBody = boldMatch[2]?.trim() ?? "";

    return {
      heading,
      inlineBody: inlineBody.length > 0 ? inlineBody : null,
    };
  }

  const labelMatch = INLINE_SECTION_LABEL_PATTERN.exec(line.trim());

  if (labelMatch !== null) {
    const heading = labelMatch[3]?.trim() ?? "";
    const inlineBody = labelMatch[5]?.trim() ?? "";

    if (resolveSectionKey(heading) !== null) {
      return {
        heading,
        inlineBody: inlineBody.length > 0 ? inlineBody : null,
      };
    }
  }

  return null;
}

function splitSourceIntoSectionBlocks(sourceText: string): Array<{ readonly key: ArchitectureStructuredSectionKey | null; readonly lines: string[] }> {
  const normalized = sourceText.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const blocks: Array<{ readonly key: ArchitectureStructuredSectionKey | null; readonly lines: string[] }> = [];
  let currentKey: ArchitectureStructuredSectionKey | null = null;
  let currentLines: string[] = [];

  const flush = (): void => {
    if (currentLines.length > 0) {
      blocks.push({ key: currentKey, lines: [...currentLines] });
      currentLines = [];
    }
  };

  for (const line of lines) {
    const heading = extractMarkdownHeading(line);

    if (heading !== null) {
      const sectionKey = resolveSectionKey(heading.heading);

      if (sectionKey !== null) {
        flush();
        currentKey = sectionKey;

        if (heading.inlineBody !== null) {
          currentLines.push(heading.inlineBody);
        }

        continue;
      }
    }

    currentLines.push(line);
  }

  flush();
  return blocks;
}

function sanitizeSourceText(sourceText: string): { readonly cleanedLines: string[]; readonly suppressedCount: number } {
  const lines = sourceText.replace(/\r\n/g, "\n").split("\n");
  const cleanedLines: string[] = [];
  let suppressedCount = 0;
  let inFence = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed.startsWith("```")) {
      inFence = !inFence;
      suppressedCount++;
      continue;
    }

    if (inFence) {
      suppressedCount++;
      continue;
    }

    if (isModelArtifactLine(line)) {
      suppressedCount++;
      continue;
    }

    cleanedLines.push(line);
  }

  return { cleanedLines, suppressedCount };
}

function mergeUserAssertions(
  drafts: Map<ArchitectureStructuredSectionKey, MutableSectionDraft>,
  assertions: ArchitectureCreationUserAssertions | null,
): void {
  if (assertions === null) {
    return;
  }

  const overview = assertions.architectureOverview.trim();
  const outcome = assertions.businessOutcome.trim();
  const name = assertions.architectureName.trim();

  if (overview.length > 0) {
    const draft = drafts.get("executive-summary");

    if (draft !== undefined) {
      draft.narrativeLines.unshift(overview);
      draft.provenance = "asserted";
    }

    const scopeDraft = drafts.get("scope");

    if (scopeDraft !== undefined && scopeDraft.narrativeLines.length === 0 && scopeDraft.entities.length === 0) {
      scopeDraft.narrativeLines.push(overview);
      scopeDraft.provenance = "asserted";
    }
  }

  if (outcome.length > 0) {
    const draft = drafts.get("business-outcome");

    if (draft !== undefined) {
      draft.narrativeLines = [outcome];
      draft.provenance = "asserted";
    }
  }

  for (const entry of assertions.peopleAndSystems) {
    const label = entry.label.trim();
    const kind = entry.kind.trim();

    if (label.length === 0) {
      continue;
    }

    const entity: ArchitectureStructuredEntity = {
      label,
      detail: kind.length > 0 ? kind : null,
      provenance: "asserted",
    };

    if (kind === "Human" || kind === "Both") {
      appendEntity(drafts.get("users-and-stakeholders")!, entity);
      drafts.get("users-and-stakeholders")!.provenance = "asserted";
    }

    if (kind === "Machine" || kind === "Both") {
      appendEntity(drafts.get("systems-and-services")!, entity);
      drafts.get("systems-and-services")!.provenance = "asserted";
      appendEntity(drafts.get("external-integrations")!, entity);
    }
  }

  if (name.length > 0 && name.toLowerCase() !== "untitled architecture") {
    const systemsDraft = drafts.get("systems-and-services")!;

    if (!systemsDraft.entities.some((entity) => entity.label.toLowerCase() === name.toLowerCase())) {
      appendEntity(systemsDraft, { label: name, detail: "Primary system", provenance: "asserted" });
      systemsDraft.provenance = "asserted";
    }
  }
}

function finalizeSections(drafts: Map<ArchitectureStructuredSectionKey, MutableSectionDraft>): ArchitectureStructuredSection[] {
  const sections: ArchitectureStructuredSection[] = [];

  for (const key of ARCHITECTURE_STRUCTURED_SECTION_KEYS) {
    const draft = drafts.get(key)!;
    const narrativeMarkdown = draft.narrativeLines.join("\n\n").trim();

    if (narrativeMarkdown.length === 0 && draft.entities.length === 0) {
      continue;
    }

    sections.push({
      key,
      title: ARCHITECTURE_STRUCTURED_SECTION_TITLES[key],
      narrativeMarkdown: narrativeMarkdown.length > 0 ? narrativeMarkdown : null,
      entities: draft.entities,
      provenance: draft.provenance,
    });
  }

  return sections;
}

function estimatePartialParseFailure(
  sourceText: string,
  cleanedText: string,
  sections: readonly ArchitectureStructuredSection[],
  suppressedCount: number,
): boolean {
  const trimmed = sourceText.trim();

  if (trimmed.length === 0) {
    return false;
  }

  if (sections.length === 0) {
    return true;
  }

  const structuredCharCount = sections.reduce((total, section) => {
    const narrativeLength = section.narrativeMarkdown?.length ?? 0;
    const entityLength = section.entities.reduce((entityTotal, entity) => entityTotal + entity.label.length + (entity.detail?.length ?? 0), 0);

    return total + narrativeLength + entityLength;
  }, 0);

  const coverageRatio = structuredCharCount / Math.max(trimmed.length, 1);
  const pipeHeavy = (trimmed.match(/\|/g)?.length ?? 0) >= 6 && sections.every((section) => section.entities.length === 0);

  const strippedRatio = cleanedText.length / Math.max(trimmed.length, 1);

  return (
    sections.length === 0 ||
    (suppressedCount > 0 && strippedRatio < 0.75) ||
    pipeHeavy ||
    (sections.length === 1 && coverageRatio < 0.2)
  );
}

export function parseArchitectureGeneratedContent(
  sourceText: string,
  assertions: ArchitectureCreationUserAssertions | null = null,
): ArchitectureStructuredParseResult {
  const trimmedSource = sourceText.trim();
  const normalizedSource = normalizeArchitectureNarrativeSourceForParsing(trimmedSource);
  const { cleanedLines, suppressedCount } = sanitizeSourceText(normalizedSource);
  const cleanedText = cleanedLines.join("\n").trim();
  const drafts = createEmptyDrafts();
  const blocks = splitSourceIntoSectionBlocks(cleanedText);

  if (blocks.length === 0 && cleanedText.length > 0) {
    ingestLinesIntoDraft(drafts.get("executive-summary")!, cleanedLines);
  } else {
    for (const block of blocks) {
      const targetKey = block.key ?? "executive-summary";
      const draft = drafts.get(targetKey)!;
      ingestLinesIntoDraft(draft, block.lines);
    }
  }

  mergeUserAssertions(drafts, assertions);
  const sections = finalizeSections(drafts);
  const hasPartialParseFailure = estimatePartialParseFailure(normalizedSource, cleanedText, sections, suppressedCount);

  return {
    sections,
    hasPartialParseFailure,
    suppressedArtifactCount: suppressedCount,
    sourceText: trimmedSource,
  };
}
