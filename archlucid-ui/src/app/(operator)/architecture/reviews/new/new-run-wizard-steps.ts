/** Step tables and step-index arithmetic for the full guided review wizard. */

export const WIZARD_MODE_STORAGE_KEY = "archlucid_new_run_wizard_mode_v1";

export const WIZARD_STEP_DEFINITIONS_FULL = [
  { label: "Choose starting point", description: "Template, import, or blank" },
  { label: "Evidence (optional)", description: "Brief, docs, IaC, cloud export, or demo" },
  { label: "Identity & goals", description: "System, environment & requirements" },
  { label: "Constraints", description: "Limits & capabilities" },
  { label: "Optional enrichment", description: "Cloud inventory or supporting files — optional" },
  { label: "Advanced", description: "Optional context" },
  { label: "Baseline metrics (optional)", description: "ROI reporting inputs" },
  { label: "Review", description: "Confirm & create" },
  { label: "Pipeline", description: "Track progress" },
] as const;

/** Pilot-baseline entry point: same slides, but step 1 asks for a baseline inventory instead. */
export const WIZARD_STEP_DEFINITIONS_BASELINE = [
  WIZARD_STEP_DEFINITIONS_FULL[0],
  { label: "Add evidence", description: "Optional cloud inventory or sample review evidence" },
  WIZARD_STEP_DEFINITIONS_FULL[2],
  WIZARD_STEP_DEFINITIONS_FULL[3],
  WIZARD_STEP_DEFINITIONS_FULL[4],
  WIZARD_STEP_DEFINITIONS_FULL[5],
  WIZARD_STEP_DEFINITIONS_FULL[6],
  WIZARD_STEP_DEFINITIONS_FULL[7],
  WIZARD_STEP_DEFINITIONS_FULL[8],
] as const;

/** High-level phases (four sponsor-visible milestones across internal wizard slides). */
export const MACRO_WIZARD_STEP_DEFINITIONS = [
  { label: "Request brief", description: "Starting point through architecture brief" },
  { label: "Depth & evidence", description: "Constraints and advanced inputs" },
  { label: "Review & submit", description: "Confirm before creation" },
  { label: "Pipeline", description: "Execution visibility" },
] as const;

export const REVIEW_STEP_INDEX = 7;
export const TRACK_STEP_INDEX = 8;

/**
 * Which sponsor-visible milestone a wizard slide belongs to.
 *
 * The mapping is shared by both step tables: the pilot-baseline table only swaps the *content* of
 * step 1, not its phase.
 */
export function macroWizardStepIndex(stepIndex: number): number {
  if (stepIndex <= 2) {
    return 0;
  }

  if (stepIndex <= 5) {
    return 1;
  }

  if (stepIndex <= REVIEW_STEP_INDEX) {
    return 2;
  }

  return 3;
}

/** Milestones already behind the operator, for the stepper's completed markers. */
export function macroCompletedSteps(stepIndex: number): number[] {
  const macro = macroWizardStepIndex(stepIndex);

  return Array.from({ length: macro }, (_, index) => index);
}

const SAMPLE_RUN_GUID_RE =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$|^[0-9a-fA-F]{32}$/;

/** Accepts a run id from the query string in dashed or bare-hex form, or null when it is not one. */
export function tryParseSampleRunQuery(raw: string | null): string | null {
  if (raw === null) {
    return null;
  }

  const trimmed = raw.trim();

  if (trimmed.length === 0 || !SAMPLE_RUN_GUID_RE.test(trimmed)) {
    return null;
  }

  if (trimmed.includes("-")) {
    return trimmed;
  }

  const n = trimmed.toLowerCase();

  return `${n.slice(0, 8)}-${n.slice(8, 12)}-${n.slice(12, 16)}-${n.slice(16, 20)}-${n.slice(20, 32)}`;
}
