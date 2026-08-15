/** TB-2343 batch 49 — golden CI budgets surfaced for operator copy (matches Application policy constants). */
export const ARCHITECTURE_INTELLIGENCE_GOLDEN_FALSE_POSITIVE_BUDGET_COPY = {
  perDimensionMax:
    "Golden incomplete fixture: up to 5 measured false positives per quality dimension in CI.",
  totalMax: "Golden incomplete fixture: up to 12 measured false positives total in CI.",
  heldOutExtraction:
    "Held-out extraction microcases are scored separately from visible training microcases; average recall floor 0.25.",
} as const;
