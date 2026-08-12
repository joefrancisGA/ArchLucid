import { EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/executive/executive-summary-pilot-roi-measurement-help";
import { coerceFinitePositiveHours, isPilotRoiBaselineComplete } from "@/lib/pilot-roi-baseline-completeness";

export type BaselineSettingsStatus = "not-set" | "partial" | "complete";

export type BaselineRoiModelLabel = "Conservative defaults" | "Workspace-specific baseline";

export type TenantBaselineSnapshot = {
  readonly manualPrepHoursPerReview: number | null;
  readonly peoplePerReview: number | null;
  readonly capturedUtc: string | null;
  readonly baselineReviewCycleHours: number | null;
  readonly baselineReviewCycleSource: string | null;
  readonly baselineReviewCycleCapturedUtc: string | null;
};

export const BASELINE_SETTINGS_USED_IN_SURFACES = [
  "Value report",
  "Executive dashboard",
  "ROI summary",
] as const;

export const BASELINE_SETTINGS_PAGE_SUBTITLE =
  "Set conservative baseline assumptions used to estimate time saved and sponsor-report value. You can skip this now and update it later." as const;

export const BASELINE_SETTINGS_CONSERVATIVE_DEFAULTS_NOTE =
  "If you leave these fields blank, ArchLucid uses conservative modeled defaults until measured review-cycle deltas are available." as const;

export const BASELINE_SETTINGS_METHODOLOGY_HELP_HREF = EXECUTIVE_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF;

const REVIEW_CYCLE_HOURS_WARN_ABOVE = 200;
const MANUAL_PREP_HOURS_WARN_ABOVE = 80;
const PEOPLE_PER_REVIEW_WARN_ABOVE = 25;

export type BaselineFieldValidation = {
  readonly error: string | null;
  readonly warning: string | null;
};

export function hasAnyWorkspaceBaselineValue(data: TenantBaselineSnapshot): boolean {
  return (
    coerceFinitePositiveHours(data.baselineReviewCycleHours) !== null ||
    coerceFinitePositiveHours(data.manualPrepHoursPerReview) !== null ||
    coerceFinitePositiveHours(data.peoplePerReview) !== null
  );
}

export function resolveBaselineSettingsStatus(data: TenantBaselineSnapshot): BaselineSettingsStatus {
  if (isPilotRoiBaselineComplete(data)) {
    return "complete";
  }

  if (!hasAnyWorkspaceBaselineValue(data)) {
    return "not-set";
  }

  return "partial";
}

export function resolveBaselineRoiModelLabel(data: TenantBaselineSnapshot): BaselineRoiModelLabel {
  if (hasAnyWorkspaceBaselineValue(data)) {
    return "Workspace-specific baseline";
  }

  return "Conservative defaults";
}

export function resolveBaselineLastUpdatedUtc(data: TenantBaselineSnapshot): string | null {
  const candidates = [data.baselineReviewCycleCapturedUtc, data.capturedUtc].filter(
    (value): value is string => typeof value === "string" && value.trim().length > 0,
  );

  if (candidates.length === 0) {
    return null;
  }

  return candidates.sort().at(-1) ?? null;
}

export function formatBaselineLastUpdated(isoUtc: string | null): string {
  if (isoUtc === null) {
    return "Not saved yet";
  }

  const parsed = new Date(isoUtc);

  if (Number.isNaN(parsed.getTime())) {
    return "Not saved yet";
  }

  return parsed.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function validateBaselineReviewCycleHours(raw: string): BaselineFieldValidation {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { error: null, warning: null };
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return { error: "Enter a positive number or leave blank.", warning: null };
  }

  if (value <= 0 || value > 10_000) {
    return { error: "Hours must be between 0 and 10,000 (exclusive of zero).", warning: null };
  }

  if (value > REVIEW_CYCLE_HOURS_WARN_ABOVE) {
    return {
      error: null,
      warning: "This is unusually high — double-check the estimate so sponsor reports stay credible.",
    };
  }

  return { error: null, warning: null };
}

export function validateBaselineManualPrepHours(raw: string): BaselineFieldValidation {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { error: null, warning: null };
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return { error: "Enter a positive number or leave blank.", warning: null };
  }

  if (value <= 0 || value > 10_000) {
    return { error: "Hours must be between 0 and 10,000 (exclusive of zero).", warning: null };
  }

  if (value > MANUAL_PREP_HOURS_WARN_ABOVE) {
    return {
      error: null,
      warning: "This is unusually high — confirm the estimate reflects typical preparation effort.",
    };
  }

  return { error: null, warning: null };
}

export function validateBaselinePeoplePerReview(raw: string): BaselineFieldValidation {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return { error: null, warning: null };
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return { error: "Enter a positive number or leave blank.", warning: null };
  }

  if (value <= 0 || value > 10_000) {
    return { error: "People involved must be between 1 and 10,000.", warning: null };
  }

  if (value > PEOPLE_PER_REVIEW_WARN_ABOVE) {
    return {
      error: null,
      warning: "Large team counts can inflate value estimates — use a typical core review group.",
    };
  }

  return { error: null, warning: null };
}

export type BaselineSaveDraft = {
  readonly manualPrepHoursPerReview: number | null;
  readonly peoplePerReview: number | null;
  readonly baselineReviewCycleHours: number | null;
};

export function resolveBaselineSaveToastMessage(draft: BaselineSaveDraft): string {
  const hasReview = coerceFinitePositiveHours(draft.baselineReviewCycleHours) !== null;
  const hasPrep = coerceFinitePositiveHours(draft.manualPrepHoursPerReview) !== null;
  const hasPeople = coerceFinitePositiveHours(draft.peoplePerReview) !== null;

  if (!hasReview && !hasPrep && !hasPeople) {
    return "Using conservative defaults.";
  }

  if (isPilotRoiBaselineComplete(draft)) {
    return "Baseline settings saved.";
  }

  return "Partial baseline saved. Missing values will use conservative defaults.";
}

export function baselineSettingsStatusLabel(status: BaselineSettingsStatus): string {
  switch (status) {
    case "complete":
      return "Complete";
    case "partial":
      return "Partially set";
    case "not-set":
      return "Not set";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}
