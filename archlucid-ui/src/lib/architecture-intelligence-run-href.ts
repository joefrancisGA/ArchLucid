export type ArchitectureIntelligenceFrom = "reviews" | "findings" | "direct";

export type BuildArchitectureIntelligenceRunHrefInput = {
  readonly runId?: string | null;
  readonly from?: ArchitectureIntelligenceFrom;
};

/** Builds `/architecture-intelligence` deep links from reviews / findings entry points. */
export function buildArchitectureIntelligenceRunHref(
  input: BuildArchitectureIntelligenceRunHrefInput = {},
): string {
  const params = new URLSearchParams();
  const runId = input.runId?.trim() ?? "";

  if (runId.length > 0) {
    params.set("runId", runId);
  }

  if (input.from !== undefined && input.from !== "direct") {
    params.set("from", input.from);
  }

  const query = params.toString();

  return query.length > 0 ? `/architecture-intelligence?${query}` : "/architecture-intelligence";
}
