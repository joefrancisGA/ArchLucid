export type ArchitectureIntelligenceProductLinks = {
  readonly reviewHref: string;
  readonly findingsHref: string;
  readonly advisoryHref: string;
};

/** Product surfaces to open after ArchitectureIntelligence publish for a run. */
export function buildArchitectureIntelligenceProductLinks(
  runId: string | null | undefined,
): ArchitectureIntelligenceProductLinks | null {
  const trimmed = runId?.trim() ?? "";

  if (trimmed.length === 0) {
    return null;
  }

  const encoded = encodeURIComponent(trimmed);

  return {
    reviewHref: `/architecture/reviews/${encoded}`,
    findingsHref: `/governance/findings?runId=${encoded}`,
    advisoryHref: `/governance/advisory-scans?runId=${encoded}`,
  };
}
