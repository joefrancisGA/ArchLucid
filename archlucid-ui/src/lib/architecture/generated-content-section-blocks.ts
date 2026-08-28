import {
  appendEntity,
  ingestLinesIntoDraft,
  type MutableSectionDraft,
} from "@/lib/architecture/generated-content-line-parsers";
import {
  ARCHITECTURE_STRUCTURED_SECTION_KEYS,
  ARCHITECTURE_STRUCTURED_SECTION_TITLES,
  type ArchitectureCreationUserAssertions,
  type ArchitectureStructuredEntity,
  type ArchitectureStructuredSection,
  type ArchitectureStructuredSectionKey,
} from "@/lib/architecture/architecture-structured-content-types";

const SECTION_ALIAS_ENTRIES: ReadonlyArray<{ readonly key: ArchitectureStructuredSectionKey; readonly aliases: readonly string[] }> = [
  { key: "sponsor-report", aliases: ["sponsor report", "summary", "overview", "architecture overview"] },
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

export function resolveSectionKey(heading: string): ArchitectureStructuredSectionKey | null {
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

export function createEmptyDrafts(): Map<ArchitectureStructuredSectionKey, MutableSectionDraft> {
  const drafts = new Map<ArchitectureStructuredSectionKey, MutableSectionDraft>();

  for (const key of ARCHITECTURE_STRUCTURED_SECTION_KEYS) {
    drafts.set(key, { narrativeLines: [], entities: [], provenance: "inferred" });
  }

  return drafts;
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

export function splitSourceIntoSectionBlocks(sourceText: string): Array<{ readonly key: ArchitectureStructuredSectionKey | null; readonly lines: string[] }> {
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

export function mergeUserAssertions(
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
    const draft = drafts.get("sponsor-report");

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

export function finalizeSections(drafts: Map<ArchitectureStructuredSectionKey, MutableSectionDraft>): ArchitectureStructuredSection[] {
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

export function estimatePartialParseFailure(
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
