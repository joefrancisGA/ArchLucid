import type { ClosedLoopReasoningSourceText } from "@/lib/architecture/architecture-intelligence-api-types";

const DEFAULT_ARCHITECTURE_FILE_NAME = "architecture-description.txt";
const DEFAULT_CONTENT_TYPE = "text/plain";

export function primaryDescriptionFromSources(sources: readonly ClosedLoopReasoningSourceText[]): string {
  const descriptionSource =
    sources.find((source) => source.fileName === DEFAULT_ARCHITECTURE_FILE_NAME) ?? sources[0];

  return descriptionSource?.content?.trim() ?? "";
}

/**
 * Builds closed-loop source texts from architecture draft form fields so operators can refine
 * before a product review exists.
 */
export function buildArchitectureIntelligenceSourcesFromDraftFields(fields: {
  readonly freeTextIntent: string;
  readonly businessOutcome: string;
  readonly systemName: string;
}): ClosedLoopReasoningSourceText[] {
  const systemName = fields.systemName.trim();
  const overview = fields.freeTextIntent.trim();
  const outcome = fields.businessOutcome.trim();

  const lines: string[] = [];

  if (systemName.length > 0) {
    lines.push(`System: ${systemName}`);
  }

  if (overview.length > 0) {
    lines.push(overview);
  }

  if (outcome.length > 0) {
    lines.push(`Business outcome: ${outcome}`);
  }

  if (lines.length === 0) {
    return [];
  }

  return [
    {
      fileName: DEFAULT_ARCHITECTURE_FILE_NAME,
      contentType: DEFAULT_CONTENT_TYPE,
      content: lines.join("\n\n"),
    },
  ];
}
