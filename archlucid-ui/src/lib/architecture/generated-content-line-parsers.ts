import type {
  ArchitectureContentProvenance,
  ArchitectureStructuredEntity,
} from "@/lib/architecture/architecture-structured-content-types";

export type MutableSectionDraft = {
  narrativeLines: string[];
  entities: ArchitectureStructuredEntity[];
  provenance: ArchitectureContentProvenance;
};

const MODEL_ARTIFACT_LINE_PATTERN =
  /^\[(?:actor|inferred):|^(?:you are|as an ai|system prompt|assistant:|user:)/i;

const PIPE_DELIMITED_ROW_PATTERN = /^[^|\n]+\|[^|\n]+(?:\|[^|\n]+)*$/;

const MARKDOWN_TABLE_SEPARATOR_PATTERN = /^\|?[\s|:-]+\|?$/;

export function isModelArtifactLine(line: string): boolean {
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

export function isMarkdownTableSeparator(line: string): boolean {
  return MARKDOWN_TABLE_SEPARATOR_PATTERN.test(line.trim()) && line.includes("-");
}

export function parsePipeDelimitedRow(line: string): ArchitectureStructuredEntity | null {
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

export function parseBulletEntity(line: string): ArchitectureStructuredEntity | null {
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

export function appendNarrative(draft: MutableSectionDraft, line: string): void {
  const trimmed = line.trim();

  if (trimmed.length === 0) {
    return;
  }

  draft.narrativeLines.push(trimmed);
}

export function appendEntity(draft: MutableSectionDraft, entity: ArchitectureStructuredEntity): void {
  const exists = draft.entities.some(
    (existing) => existing.label.toLowerCase() === entity.label.toLowerCase() && existing.detail === entity.detail,
  );

  if (!exists) {
    draft.entities.push(entity);
  }
}

export function ingestLinesIntoDraft(draft: MutableSectionDraft, lines: readonly string[]): void {
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

export function sanitizeSourceText(sourceText: string): { readonly cleanedLines: string[]; readonly suppressedCount: number } {
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
