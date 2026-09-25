import type { RunDetail } from "@/types/authority";

/** Mirrors `RunDetailBuyerMapper` — buyer-summary must not ship snapshot subgraphs or agent results. */
export function toMockBuyerRunDetailSummary(full: RunDetail): RunDetail {
  const buyerSafe = { ...full };
  delete buyerSafe.results;
  delete buyerSafe.contextSnapshot;
  delete buyerSafe.graphSnapshot;
  delete buyerSafe.findingsSnapshot;
  delete buyerSafe.goldenManifest;
  delete buyerSafe.artifactBundle;
  delete buyerSafe.decisionTrace;

  const run = full.run;
  const goldenManifestId = run.goldenManifestId?.trim() || undefined;

  const findingSummaries =
    full.results?.flatMap((result) =>
      (result.findings ?? []).map((finding) => ({
        findingId: finding.findingId,
        title: finding.message ?? finding.category ?? finding.findingId,
        category: finding.category,
        severity: finding.severity,
        policyRuleId: undefined,
      })),
    ) ?? [];

  return {
    ...buyerSafe,
    findingSummaries,
    run: {
      runId: run.runId,
      projectId: run.projectId,
      scopeProjectId: run.scopeProjectId,
      description: run.description,
      createdUtc: run.createdUtc,
      structuralExecutionMode: run.structuralExecutionMode ?? "Simulator",
      goldenManifestId,
    },
  } as unknown as RunDetail;
}
