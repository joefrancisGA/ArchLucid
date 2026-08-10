import { CLOUD_NEUTRAL_PRIMARY_COPY } from "@/lib/cloud-neutral-primary-copy";

/**
 * Buyer-first labels for the Core Pilot checklist (“architecture review” in operator chrome).
 */
export const CORE_PILOT_FIRST_REVIEW_HEADING = "Create a governed architecture review";

export const CORE_PILOT_FIRST_REVIEW_HEADING_COMPACT = "First review checklist";

export const CORE_PILOT_FIRST_REVIEW_MINIMIZED_BUTTON = "Show first review checklist";

/** Right-rail heading when a run exists — shortcuts into the curated sample review. */
export const OPERATOR_SAMPLE_PACKAGE_SHORTCUTS_HEADING = "Sample review shortcuts";

/** High-level flow; technical terms (manifest, run ID) stay in step bodies and tooltips. */
export const CORE_PILOT_WORKFLOW_SUMMARY_LINE =
  "New architecture review → Analyze → Finalize → Upload ZIP → ROI & audit proof";

/**
 * Four plain steps for default first-session copy (no manifest / Operate jargon). Shown in collapsed diagnostics on Home
 * and aligned with {@link CORE_PILOT_WORKFLOW_SUMMARY_LINE}.
 */
export const CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS: readonly string[] = [
  "Start from New architecture review or the sample showcase — capture goals, constraints, and what you want reviewed.",
  "Let the assessment finish on review detail before you finalize the architecture review.",
  CLOUD_NEUTRAL_PRIMARY_COPY.corePilotFirstSessionInventoryBullet,
  "Open the dashboard ROI summary and export audit CSV from Deliverables & exports for your proof packet.",
  "Read governed findings and sponsor exports on review detail when you are ready to share internally.",
];

/**
 * Progressive disclosure: advanced surfaces stay available in the shell but are not part of the default four-step path.
 */
export const CORE_PILOT_ADVANCED_TOOLS_DEFERRAL_NOTE =
  "Compare, Replay, Graph, extended governance, alerts, and policy packs stay in the sidebar under Show more — use them after your first finalized review, not as prerequisites.";

/** @deprecated Prefer {@link CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS} in UI lists. */
export const CORE_PILOT_FIRST_SESSION_GUIDANCE = CORE_PILOT_FIRST_SESSION_GUIDANCE_BULLETS.join(" ");
