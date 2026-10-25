import { normalizeArchitectureNarrativeSourceForParsing } from "@/lib/architecture/architecture-narrative-presentation";
import type { ArchitectureCreationUserAssertions, ArchitectureStructuredParseResult } from "@/lib/architecture/architecture-structured-content-types";
import { ingestLinesIntoDraft, sanitizeSourceText } from "@/lib/architecture/generated-content-line-parsers";
import {
  createEmptyDrafts,
  estimatePartialParseFailure,
  finalizeSections,
  mergeUserAssertions,
  splitSourceIntoSectionBlocks,
} from "@/lib/architecture/generated-content-section-blocks";

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
    ingestLinesIntoDraft(drafts.get("sponsor-report")!, cleanedLines);
  } else {
    const hasKeyedBlock = blocks.some((block) => block.key !== null);

    for (const block of blocks) {
      if (block.key === null) {
        if (!hasKeyedBlock) {
          ingestLinesIntoDraft(drafts.get("sponsor-report")!, block.lines);
        }

        continue;
      }

      const draft = drafts.get(block.key)!;
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
