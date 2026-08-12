import { countMarkdownH2Sections } from "@/lib/architecture/architecture-narrative-presentation";

export const ARCHITECTURE_NARRATIVE_PREVIEW_WORD_LIMIT = 200;

const WORD_SPLIT_PATTERN = /\s+/;

export function countWords(text: string): number {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return 0;
  }

  return trimmed.split(WORD_SPLIT_PATTERN).filter((word) => word.length > 0).length;
}

function splitMarkdownH2Sections(text: string): readonly string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  const lines = normalized.split("\n");
  const sections: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (/^##\s+/.test(line) && !/^###\s+/.test(line)) {
      if (current.length > 0) {
        sections.push(current.join("\n").trim());
        current = [];
      }
    }

    current.push(line);
  }

  if (current.length > 0) {
    sections.push(current.join("\n").trim());
  }

  return sections.filter((section) => section.length > 0);
}

function accumulateSectionsWithinWordLimit(sections: readonly string[], wordLimit: number): string {
  let preview = "";
  let words = 0;

  for (const section of sections) {
    const sectionWords = countWords(section);

    if (words > 0 && words + sectionWords > wordLimit) {
      break;
    }

    preview = preview.length > 0 ? `${preview}\n\n${section}` : section;
    words += sectionWords;

    if (words >= wordLimit) {
      break;
    }
  }

  return preview;
}

function accumulateParagraphsWithinWordLimit(text: string, wordLimit: number): string {
  const paragraphs = text.split(/\n\s*\n/).map((part) => part.trim()).filter((part) => part.length > 0);
  let preview = "";
  let words = 0;

  for (const paragraph of paragraphs) {
    const paragraphWords = countWords(paragraph);

    if (words > 0 && words + paragraphWords > wordLimit) {
      break;
    }

    preview = preview.length > 0 ? `${preview}\n\n${paragraph}` : paragraph;
    words += paragraphWords;

    if (words >= wordLimit) {
      break;
    }
  }

  return preview;
}

/** Truncate narrative preview without collapsing markdown line structure into one paragraph. */
export function truncateMarkdownPreservingStructure(
  text: string,
  wordLimit: number,
): { readonly preview: string; readonly truncated: boolean } {
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return { preview: "", truncated: false };
  }

  if (countWords(trimmed) <= wordLimit) {
    return { preview: trimmed, truncated: false };
  }

  const h2Sections = splitMarkdownH2Sections(trimmed);

  if (h2Sections.length > 1) {
    const sectionPreview = accumulateSectionsWithinWordLimit(h2Sections, wordLimit);

    if (sectionPreview.length > 0 && countWords(sectionPreview) < countWords(trimmed)) {
      return { preview: sectionPreview, truncated: true };
    }
  }

  const paragraphPreview = accumulateParagraphsWithinWordLimit(trimmed, wordLimit);

  if (paragraphPreview.length > 0 && countWords(paragraphPreview) < countWords(trimmed)) {
    return { preview: paragraphPreview, truncated: true };
  }

  return { preview: trimmed, truncated: false };
}

/** @deprecated Prefer {@link truncateMarkdownPreservingStructure} for markdown narratives. */
export function truncateToWordLimit(
  text: string,
  wordLimit: number,
): { readonly preview: string; readonly truncated: boolean } {
  return truncateMarkdownPreservingStructure(text, wordLimit);
}

export function shouldUseSectionLevelNarrativeDisclosure(text: string, wordLimit: number): boolean {
  return countMarkdownH2Sections(text) >= 3 && countWords(text) > wordLimit;
}
