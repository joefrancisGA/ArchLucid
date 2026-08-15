import type { EnterpriseStatusKind } from "@/lib/design-tokens";
import { SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF } from "@/lib/sponsor-report-pilot-roi-measurement-help";
import { formatInstantForLocale } from "@/lib/locale-datetime";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor/sponsor-dashboard-route";
import { coerceFinitePositiveHours, isPilotRoiBaselineComplete } from "@/lib/pilot-roi-baseline-completeness";
import {
  SPONSOR_REPORT_PATH,
  SPONSOR_REPORT_ROI_SUMMARY_PATH,
} from "@/lib/sponsor-report-navigation";

export type BaselineSettingsStatus = "not-set" | "partial" | "complete";

export type BaselineRoiModelLabel = "Conservative defaults" | "Partly modeled" | "Workspace-specific baseline";

export type BaselineUsedInSurface = {
  readonly label: string;
  readonly href: string;
};

export type TenantBaselineSnapshot = {
  readonly manualPrepHoursPerReview: number | null;
  readonly peoplePerReview: number | null;
  readonly capturedUtc: string | null;
  readonly baselineReviewCycleHours: number | null;
  readonly baselineReviewCycleSource: string | null;
  readonly baselineReviewCycleCapturedUtc: string | null;
};

export const BASELINE_SETTINGS_PAGE_TITLE = "Baseline settings — ROI measurement" as const;

export const BASELINE_SETTINGS_USED_IN_SURFACES: readonly BaselineUsedInSurface[] = [
  { label: "Value report", href: SPONSOR_REPORT_PATH },
  { label: "Sponsor dashboard", href: SPONSOR_DASHBOARD_HREF },
  { label: "ROI summary", href: SPONSOR_REPORT_ROI_SUMMARY_PATH },
];

export const BASELINE_MODELED_DEFAULTS_HELPER =
  "Blanks the fields below so reports use conservative modeled defaults." as const;

/**
 * Shown once a baseline is saved. PUT /v1/tenant/baseline ignores a body whose values are all null,
 * so the UI must not offer to remove a stored baseline it cannot actually remove.
 */
export const BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER =
  "Your saved baseline stays in reports. Removing a saved baseline is not available in this release — update the values below instead." as const;

export const BASELINE_REVIEW_NOTE_REQUIRES_HOURS_HELPER =
  "Enter median review-cycle hours to record how you estimated them." as const;

export const BASELINE_REVIEW_NOTE_SAVE_READINESS =
  "Enter median review-cycle hours before saving your estimate note." as const;

export const BASELINE_SETTINGS_PAGE_SUBTITLE =
  "Set conservative baseline assumptions used to estimate time saved and sponsor-report value. You can skip this now and update it later." as const;

export const BASELINE_SETTINGS_CONSERVATIVE_DEFAULTS_NOTE =
  "If you leave these fields blank, ArchLucid uses conservative modeled defaults until measured review-cycle deltas are available." as const;

export const BASELINE_SETTINGS_METHODOLOGY_HELP_HREF = SPONSOR_SUMMARY_PILOT_ROI_MEASUREMENT_HELP_HREF;

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
  const status = resolveBaselineSettingsStatus(data);

  switch (status) {
    case "complete":
      return "Workspace-specific baseline";
    case "partial":
      return "Partly modeled";
    case "not-set":
      return "Conservative defaults";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
}

export function resolveBaselineReviewSourceNoteDisplay(source: string | null | undefined): string | null {
  if (source === null || source === undefined) {
    return null;
  }

  const trimmed = source.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const marker = "baseline_settings";

  if (trimmed.toLowerCase() === marker) {
    return null;
  }

  const prefix = `${marker}:`;

  if (trimmed.toLowerCase().startsWith(prefix)) {
    const tail = trimmed.slice(prefix.length).trim();

    return tail.length === 0 ? null : tail;
  }

  return trimmed;
}

export function hasSavedBaselineReviewSourceNote(data: TenantBaselineSnapshot): boolean {
  const display = resolveBaselineReviewSourceNoteDisplay(data.baselineReviewCycleSource);

  return display !== null;
}

export function hasSavedWorkspaceBaseline(data: TenantBaselineSnapshot): boolean {
  return hasAnyWorkspaceBaselineValue(data) || hasSavedBaselineReviewSourceNote(data);
}

export function baselineFieldHasOwnerEstimate(raw: string): boolean {
  return coerceFinitePositiveHours(parseBaselineFieldNumber(raw)) !== null;
}

function parseBaselineFieldNumber(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return null;
  }

  return value;
}

export function baselineFieldProvenanceLabel(hasOwnerEstimate: boolean): string {
  return hasOwnerEstimate ? "Your estimate" : "Modeled default";
}

export function baselineFieldProvenanceKind(hasOwnerEstimate: boolean): EnterpriseStatusKind {
  return hasOwnerEstimate ? "in-progress" : "neutral";
}

export function baselineSettingsStatusTagKind(status: BaselineSettingsStatus): EnterpriseStatusKind {
  switch (status) {
    case "complete":
      return "ready";
    case "partial":
      return "needs-attention";
    case "not-set":
      return "neutral";
    default: {
      const exhaustive: never = status;

      return exhaustive;
    }
  }
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
