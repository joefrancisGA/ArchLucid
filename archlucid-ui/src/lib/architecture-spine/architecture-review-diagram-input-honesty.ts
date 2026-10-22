/**
 * AS-003 honesty phrases — marketing/operator copy must not claim raster diagrams are analyzed
 * unless structured extract or opt-in vision succeeded.
 *
 * @see docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md
 */

export const ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT_RELATIVE_PATH =
  "docs/library/ARCHITECTURE_REVIEW_DIAGRAM_INPUT_CONTRACT.md";

/** False unless structured extract or opt-in vision explicitly succeeded. */
export const ARCHITECTURE_REVIEW_DIAGRAM_INPUT_FALSE_ANALYZED_CLAIMS = [
  "attached PNG is analyzed",
  "attached png is analyzed",
  "we analyze your diagram image",
  "screenshot topology is on the decide path",
] as const;

export function findArchitectureReviewDiagramInputHonestyViolations(source: string): string[] {
  const violations: string[] = [];
  const lower = source.toLowerCase();

  for (const phrase of ARCHITECTURE_REVIEW_DIAGRAM_INPUT_FALSE_ANALYZED_CLAIMS) {
    if (lower.includes(phrase.toLowerCase())) {
      violations.push(phrase);
    }
  }

  return violations;
}
