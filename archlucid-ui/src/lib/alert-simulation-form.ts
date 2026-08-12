import { resolveAdvisoryRunProjectSlug } from "@/lib/advisory-schedule-form";

/** Empty — zero-GUID placeholder theater removed (TB-1592). */
export const ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER = "";

export const ALERT_SIMULATION_REVIEW_ID_HELPER =
  "Optional. Paste a review ID to evaluate one review instead of the recent list.";

export const ALERT_SIMULATION_COMPARED_REVIEW_ID_HELPER =
  "Optional. Paste a baseline review ID when the rule compares two reviews.";

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
