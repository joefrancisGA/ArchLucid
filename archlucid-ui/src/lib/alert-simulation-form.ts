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
