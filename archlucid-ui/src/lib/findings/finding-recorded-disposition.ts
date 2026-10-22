import type { QuickDecisionFinding } from "@/lib/quick-decision-summary-derive";

/** True when the finding wire carries a non-empty `latestDisposition` (same rule as governance queue rows). */
export function quickDecisionFindingHasRecordedDisposition(finding: QuickDecisionFinding): boolean {
  try {
    const parsed: unknown = JSON.parse(finding.aiReasoning.wireJson);

    if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
      return false;
    }

    const disposition = (parsed as { latestDisposition?: unknown }).latestDisposition;

    return typeof disposition === "string" && disposition.trim().length > 0;
  } catch {
    return false;
  }
}
