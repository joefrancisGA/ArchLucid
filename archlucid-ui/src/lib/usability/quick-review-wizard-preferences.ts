import type { CtoDemoReviewExecutionMode } from "@/components/cto-demo/CtoDemoReviewModeCallout";
import type { QuickReviewProofScopeId } from "@/components/usability/QuickReviewProofScopeField";

const STORAGE_KEY = "archlucid_quick_review_wizard_prefs_v1";

const VALID_PROOF_SCOPE: readonly QuickReviewProofScopeId[] = ["cost", "compliance", "topology"];
const VALID_EXECUTION_MODES: readonly CtoDemoReviewExecutionMode[] = ["simulator", "live"];

export type QuickReviewWizardPreferences = {
  readonly proofScope: QuickReviewProofScopeId[];
  readonly executionMode: CtoDemoReviewExecutionMode;
  readonly advancedConfigExpanded: boolean;
};

function isProofScopeId(value: unknown): value is QuickReviewProofScopeId {
  return typeof value === "string" && VALID_PROOF_SCOPE.includes(value as QuickReviewProofScopeId);
}

function isExecutionMode(value: unknown): value is CtoDemoReviewExecutionMode {
  return typeof value === "string" && VALID_EXECUTION_MODES.includes(value as CtoDemoReviewExecutionMode);
}

function normalizeExecutionMode(value: unknown): CtoDemoReviewExecutionMode {
  if (value === "real") {
    return "live";
  }

  if (isExecutionMode(value)) {
    return value;
  }

  return "simulator";
}

function parseStoredPreferences(raw: string | null): QuickReviewWizardPreferences | null {
  if (raw === null || raw.trim().length === 0) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<QuickReviewWizardPreferences>;

    if (!Array.isArray(parsed.proofScope) || parsed.proofScope.length === 0) {
      return null;
    }

    const proofScope = parsed.proofScope.filter(isProofScopeId);

    if (proofScope.length === 0) {
      return null;
    }

    const executionMode = normalizeExecutionMode(parsed.executionMode);
    const advancedConfigExpanded = parsed.advancedConfigExpanded === true;

    return {
      proofScope,
      executionMode,
      advancedConfigExpanded,
    };
  } catch {
    return null;
  }
}

export function readQuickReviewWizardPreferences(): QuickReviewWizardPreferences | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return parseStoredPreferences(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

export function persistQuickReviewWizardPreferences(prefs: QuickReviewWizardPreferences): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    /* private mode */
  }
}
