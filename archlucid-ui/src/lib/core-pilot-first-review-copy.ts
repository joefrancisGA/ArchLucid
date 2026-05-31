/**
 * Buyer-first labels for the Core Pilot checklist (“architecture review” in operator chrome).
 */
export const CORE_PILOT_FIRST_REVIEW_HEADING = "Create a governed architecture review package";

export const CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT =
  "First-review checklist";

export const CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON = "Show first-review checklist";

/** Right-rail heading when a run exists — shortcuts into the curated sample package. */
export const OPERATOR_SAMPLE_PACKAGE_SHORTCUTS_HEADING = "Sample package shortcuts";

/** High-level flow; technical terms (manifest, run ID) stay in step bodies and tooltips. */
export const CORE_PILOT_WORKFLOW_SUMMARY_LINE =
  "Create architecture review → Assessment runs → Finalize → Review package";

/**
 * Four plain steps for default first-session copy (no manifest / Operate jargon). Shown in collapsed diagnostics on Home
 * and aligned with {@link CORE_PILOT_WORKFLOW_SUMMARY_LINE}.
 */
export const CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS: readonly string[] = [
  "Create an architecture review from New review (wizard) — capture goals, constraints, and what you want reviewed.",
  "Let the assessment finish — stay on review detail or the wizard until processing settles (no Graph, Compare, or Replay needed yet).",
  "Finalize when the UI says the package is ready — this locks your review package and turns on exports and deeper tools.",
  "Open your review package on review detail — read the summary and findings, then use downloads when you are ready to share internally.",
];

/**
 * Progressive disclosure: advanced surfaces stay available in the shell but are not part of the default four-step path.
 */
export const CORE_PILOT_ADVANCED_TOOLS_DEFERRAL_NOTE =
  "Compare, Replay, Graph, extended governance, alerts, and policy packs stay in the sidebar under Show more — use them after your first finalized review package, not as prerequisites.";

/** @deprecated Prefer {@link CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS} in UI lists. */
export const CORE_PILOT_FIRST_SESSION_GUIDANCE = CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS.join(" ");
