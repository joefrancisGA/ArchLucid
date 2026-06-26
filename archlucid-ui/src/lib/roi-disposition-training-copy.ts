/** Operator-facing microcopy for disposition-aware ROI headline semantics (V1 §2.8). */
export const ROI_DISPOSITION_TRAINING_TOOLTIP_LABEL = "Executive ROI savings basis";

export const ROI_DISPOSITION_TRAINING_TOOLTIP_HINT =
  "Headline savings follow finding dispositions — for example, accepted risk and waived items are excluded from realized value. Portfolio totals deduplicate overlapping findings by stable FindingId. Per-system rows are pre-disposition snapshots and do not add up to the portfolio headline because of shared infrastructure and overlapping findings.";

export const ROI_HEADLINE_MATH_TOOLTIP_LABEL = "Portfolio headline savings";

export const ROI_HEADLINE_MATH_TOOLTIP_HINT =
  "Headline savings are disposition-aware: accepted risk, waived, deferred, and not-applicable findings are excluded from realized totals. Open and needs-evidence amounts deduplicate overlapping findings by stable FindingId so shared infrastructure is not counted twice.";

export const ROI_SYSTEM_ROW_MATH_TOOLTIP_LABEL = "Per-system estimated savings";

export const ROI_SYSTEM_ROW_MATH_TOOLTIP_HINT =
  "Each row is a pre-disposition snapshot from that system's latest committed review. Row amounts do not sum to the portfolio headline because headline totals apply disposition rules and deduplicate overlapping findings by FindingId.";
