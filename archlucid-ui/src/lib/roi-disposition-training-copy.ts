import manifest from "@/lib/data/roi-sponsor-facing-scope-labels.v1.json";

/** Operator-facing microcopy for disposition-aware ROI headline semantics (V1 §2.8). */
export const ROI_DISPOSITION_TRAINING_TOOLTIP_LABEL = "Sponsor ROI savings basis";

export const ROI_DISPOSITION_TRAINING_TOOLTIP_HINT = manifest.operatorHints.dispositionTraining;

export const ROI_HEADLINE_MATH_TOOLTIP_LABEL = "Portfolio headline savings";

export const ROI_HEADLINE_MATH_TOOLTIP_HINT = manifest.operatorHints.headlineMath;

export const ROI_SYSTEM_ROW_MATH_TOOLTIP_LABEL = "Per-system estimated savings";

export const ROI_SYSTEM_ROW_MATH_TOOLTIP_HINT = manifest.operatorHints.systemRowMath;
