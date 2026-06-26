/**
 * Buyer-first labels for the Core Pilot checklist (“architecture review” in operator chrome).
 */
export const CORE_PILOT_FIRST_REVIEW_HEADING = "Create a governed architecture review package";

export const CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT = "First review checklist";

export const CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON = "Show first review checklist";

/** Right-rail heading when a run exists — shortcuts into the curated sample package. */
export const OPERATOR_SAMPLE_PACKAGE_SHORTCUTS_HEADING = "Sample package shortcuts";

/** High-level flow; technical terms (manifest, run ID) stay in step bodies and tooltips. */
export const CORE_PILOT_WORKFLOW_SUMMARY_LINE =
  "Start review → Execute → Finalize → Upload ZIP → ROI & audit proof";

/**
 * Four plain steps for default first-session copy (no manifest / Operate jargon). Shown in collapsed diagnostics on Home
 * and aligned with {@link CORE_PILOT_WORKFLOW_SUMMARY_LINE}.
 */
export const CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS: readonly string[] = [
  "Start from New review or the sample showcase — capture goals, constraints, and what you want reviewed.",
  "Let the assessment finish on review detail before you finalize the review package.",
  "Upload your Azure extractor ZIP after commit so ROI and cost findings cite measured inventory.",
  "Open the dashboard ROI summary and export run-scoped audit CSV from Artifacts & exports for your proof packet.",
  "Read governed findings and sponsor exports on review detail when you are ready to share internally.",
];

/**
 * Progressive disclosure: advanced surfaces stay available in the shell but are not part of the default four-step path.
 */
export const CORE_PILOT_ADVANCED_TOOLS_DEFERRAL_NOTE =
  "Compare, Replay, Graph, extended governance, alerts, and policy packs stay in the sidebar under Show more — use them after your first finalized review package, not as prerequisites.";

/** @deprecated Prefer {@link CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS} in UI lists. */
export const CORE_PILOT_FIRST_SESSION_GUIDANCE = CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS.join(" ");
