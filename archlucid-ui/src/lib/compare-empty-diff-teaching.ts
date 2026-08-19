/**
 * TB-2227 — buyer-facing teaching when a compare result is empty.
 * Explains why the comparison has nothing to show and what to try next
 * (architecture review / findings / decisions / evidence — not engineering jargon).
 */

export const COMPARE_EMPTY_DIFF_REASON_IDS = [
  "no-run-level-diffs",
  "missing-comparison-block",
  "empty-manifest-diffs",
] as const;

export type CompareEmptyDiffReasonId = (typeof COMPARE_EMPTY_DIFF_REASON_IDS)[number];

export type CompareEmptyDiffTeaching = {
  readonly reasonId: CompareEmptyDiffReasonId;
  readonly title: string;
  readonly body: string;
  readonly nextSteps: readonly string[];
};

const SHARED_NEXT_STEPS = [
  "Try a different baseline and updated pair.",
  "Compare architecture reviews that actually changed between reviews.",
  "Open a sample comparison when available to see how differences appear.",
] as const;

const TEACHING_BY_REASON: Readonly<Record<CompareEmptyDiffReasonId, CompareEmptyDiffTeaching>> = {
  "no-run-level-diffs": {
    reasonId: "no-run-level-diffs",
    title: "No differences between these architecture reviews",
    body:
      "These two finalized reviews look the same at the review level — findings, decisions, and evidence did not change between baseline and updated.",
    nextSteps: SHARED_NEXT_STEPS,
  },
  "missing-comparison-block": {
    reasonId: "missing-comparison-block",
    title: "Architecture review comparison unavailable",
    body:
      "This pair did not include a review-level comparison, so there are no findings, decisions, or evidence deltas to show for these reviews.",
    nextSteps: SHARED_NEXT_STEPS,
  },
  "empty-manifest-diffs": {
    reasonId: "empty-manifest-diffs",
    title: "Review comparison found no changes",
    body:
      "A comparison was produced, but findings, decisions, and evidence match between baseline and updated — nothing material changed in the architecture review.",
    nextSteps: SHARED_NEXT_STEPS,
  },
};

/**
 * Short line for CompareVerdictSummary when totalChanges === 0 (same vocabulary as empty diffs).
 */
export const COMPARE_VERDICT_ZERO_CHANGES_TEACHING =
  "These architecture reviews show no material changes in findings, decisions, or evidence. Try a different baseline and updated pair, or open a sample comparison when available." as const;

/**
 * Builds title, body, and next-step teaching for one empty-compare reason.
 */
export function buildCompareEmptyDiffTeaching(
  reasonId: CompareEmptyDiffReasonId,
): CompareEmptyDiffTeaching {
  return TEACHING_BY_REASON[reasonId];
}

/** Matrix of all empty-compare teaching rows (stable order). */
export function listCompareEmptyDiffTeachings(): readonly CompareEmptyDiffTeaching[] {
  return COMPARE_EMPTY_DIFF_REASON_IDS.map((reasonId) => buildCompareEmptyDiffTeaching(reasonId));
}
