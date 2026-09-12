import { SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING } from "@/lib/system-not-job-impact-preview-envelope-entry";

/** CE-020 — help: impact preview vs architecture sketch envelope. */
export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SLUG =
  "impact-preview-vs-architecture-envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TITLE =
  "Impact preview vs architecture envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_OVERVIEW = [
  `${SYSTEM_NOT_JOB_IMPACT_PREVIEW_POLICY_ENVELOPE_HEADING} re-simulates policy packs on a finalized baseline — review-time policy analysis, not an architecture sketch.`,
  "Sketch a change (clone from snapshot) is the architecture desk cheap envelope — Rehearsal-stamped until you execute a Record review.",
  "Neither path is draft-to-draft Compare; Career proof still needs two committed manifests (R12).",
].join(" ") as const;
