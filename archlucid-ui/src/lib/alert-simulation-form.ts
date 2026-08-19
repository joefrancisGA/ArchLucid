import { resolveAdvisoryRunProjectSlug } from "@/lib/advisory-schedule-form";

/** Empty — zero-GUID placeholder theater removed (TB-1592). */
export const ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER = "";

export const ALERT_SIMULATION_REVIEW_ID_HELPER =
  "Optional. Paste a review ID to evaluate one review instead of the recent list.";

export const ALERT_SIMULATION_COMPARED_REVIEW_ID_HELPER =
  "Optional. Paste a baseline review ID when the rule compares two reviews.";

/** Shown when compared-to is disabled because no specific review ID is set (P0-1). */
export const ALERT_SIMULATION_COMPARED_REVIEW_DISABLED_HELPER =
  "Available only when a specific review ID is set — baseline comparison requires both reviews.";

/** Precedence for specific review ID vs recent window and compared-to (P0-1). */
export const ALERT_SIMULATION_REVIEW_ID_PRECEDENCE =
  "When a specific review ID is set, it replaces the recent-review window; compared-to applies only with that ID.";

/** One-line note when specific review ID disables recent window controls (P0-1). */
export const ALERT_SIMULATION_SPECIFIC_REVIEW_REPLACES_WINDOW_NOTE =
  "A specific review ID replaces the recent-review window.";

export const ALERT_SIMULATION_RECENT_COUNT_LABEL = "Recent review count";

export const ALERT_SIMULATION_RECENT_COUNT_HELPER = "Sample size for the recent-review window (1–50).";

/** Readiness when recent count is missing or outside 1–50 (P0-2). */
export const ALERT_SIMULATION_READINESS_RECENT_COUNT =
  "Enter a recent review count between 1 and 50.";

/** Readiness when threshold is cleared or invalid (P0-2). */
export const ALERT_SIMULATION_READINESS_THRESHOLD = "Enter a threshold value.";

/** Readiness when neither historical window nor specific review ID is set (P0-2). */
export const ALERT_SIMULATION_READINESS_REVIEW_SCOPE =
  "Select Use historical window or enter a specific review ID.";

/** Outcome table — no rows after a simulation with zero matches (P0-3). */
export const ALERT_SIMULATION_OUTCOMES_TABLE_EMPTY =
  "No per-review outcomes for this simulation — adjust inputs above and simulate again.";

export const ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER = "Current project";

export const ALERT_SIMULATION_PROJECT_SLUG_HELPER =
  "Leave blank to use the current project. Override only when simulating a different project slug.";

/** Shared native `<select>` styling for alert simulation/tuning forms (TB-1590; pairs composite **TB-1580**). */
export const ALERT_TOOLING_FORM_SELECT_CLASS =
  "mt-1 block w-full rounded-md border border-neutral-300 bg-white p-2 dark:border-neutral-600 dark:bg-neutral-950";

/** Nested simulation mode tabs — operator labels, not wire/API keys (TB-1591). */
export const ALERT_SIMULATION_MODE_TABS = [
  { id: "simple", label: "Simple rule" },
  { id: "composite", label: "Advanced rule" },
  { id: "compare", label: "Compare thresholds" },
] as const;

export type AlertSimulationModeTabId = (typeof ALERT_SIMULATION_MODE_TABS)[number]["id"];

/** Getting-started steps for the simulated-outcome column before any simulation (P0-3). */
export const ALERT_SIMULATION_BEHAVIOR_EMPTY_GETTING_STARTED = {
  heading: "Get simulation results",
  steps: [
    "Pick Simple or Advanced rule, enter a review ID that has finalized findings.",
    "Adjust thresholds if needed, then choose Simulate — per-review outcomes explain match, suppression, and dedupe.",
    "Use Compare thresholds to diff two rule variants before promoting changes.",
  ],
} as const;

/** True when recent count is a whole number in the API clamp range (P0-2). */
export function isAlertSimulationRecentCountValid(recentCount: number): boolean {
  return Number.isInteger(recentCount) && recentCount >= 1 && recentCount <= 50;
}

/** True when threshold is a finite number (cleared inputs become NaN) (P0-2). */
export function isAlertSimulationThresholdValid(threshold: number): boolean {
  return Number.isFinite(threshold);
}

/**
 * Resolves the authority run-list project key for simulation/tuning APIs (TB-1592).
 * Typed override wins; otherwise derive from session (GUID/empty → authority `default` on the wire only).
 */
export function resolveAlertSimulationRunProjectSlug(
  typedSlug: string | null | undefined,
  sessionProjectId: string | null | undefined,
): string {
  const typed = typedSlug?.trim() ?? "";

  if (typed.length > 0) {
    return typed;
  }

  return resolveAdvisoryRunProjectSlug(sessionProjectId);
}
