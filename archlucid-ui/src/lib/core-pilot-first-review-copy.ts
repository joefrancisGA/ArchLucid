/**
 * Buyer-first labels for the Core Pilot checklist (“architecture review” in operator chrome).
 */
export const CORE_PILOT_FIRST_REVIEW_HEADING = "Create a governed architecture review package";

export const CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT =
  "First-review checklist";

export const CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON = "Show first-review checklist";

/** High-level flow; technical terms (manifest, run ID) stay in step bodies and tooltips. */
export const CORE_PILOT_WORKFLOW_SUMMARY_LINE =
  "Create architecture review → Pipeline runs → Finalize → Review package";

/**
 * Short first-session bullets (replaces the old paragraph wall). Keep wording aligned with
 * {@link CORE_PILOT_WORKFLOW_SUMMARY_LINE}; deeper terms stay in step bodies.
 */
export const CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS: readonly string[] = [
  "Create and submit one architecture review request from the new-request wizard, then watch the pipeline on review detail until it settles.",
  "When the pipeline is ready, finalize to lock the governed manifest—you will get the manifest summary, findings, and artifacts as one review package.",
  "Defer Compare, Replay, Graph, and exports until that package exists; when you export, read the gated sections in the output before circulating outside your team.",
];

/** @deprecated Prefer {@link CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS} in UI lists. */
export const CORE_PILOT_FIRST_SESSION_GUIDANCE = CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS.join(" ");
