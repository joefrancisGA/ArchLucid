import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
export const PILOT_OUTCOMES_CANONICAL_PATH = "/insights/pilot-outcomes" as const;

export const PILOT_OUTCOMES_HELP_CANONICAL_PATH = "/help/pilot-outcomes" as const;

export const PILOT_OUTCOMES_HELP_TOPIC_LABEL = "How pilot outcomes work";

export const PILOT_OUTCOMES_CLAIM_DISCIPLINE =
  "Pilot outcomes summarize finalized reviews, findings, and governance activity for the selected period — they are not a signed-review diligence Sources package by themselves. Open Evidence trail or Trust Center before treating this report as procurement evidence.";

export const PILOT_OUTCOMES_SOURCES_INTRO =
  "Use these follow-ups when pilot outcomes need a fuller evidence trail, ROI methodology, or sponsor packaging.";

export const PILOT_OUTCOMES_HELP_CLAIM_DISCIPLINE =
  "This guide explains how to read pilot outcomes — it is not a signed review record or procurement diligence package.";

export const PILOT_OUTCOMES_HELP_FOLLOW_UPS_TITLE = "Where to go next";

export const PILOT_OUTCOMES_HELP_SOURCES_INTRO = PILOT_OUTCOMES_SOURCES_INTRO;

/** Operator Sources — no self-href to `/insights/pilot-outcomes`. */
export const PILOT_OUTCOMES_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Executive value report", href: "/insights/executive-summary" },
  { label: "ROI summary", href: "/insights/roi-summary" },
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Pilot guide", href: "/help/pilot-guide" },
  { label: "Assurance status", href: "/security-trust" },
] as const;

export const PILOT_OUTCOMES_HELP_SOURCES: readonly EvidenceSourceLink[] = [
  ...PILOT_OUTCOMES_SOURCES,
  { label: "Executive summary help", href: "/help/executive-summary" },
  { label: "Pilot outcomes", href: PILOT_OUTCOMES_CANONICAL_PATH },
] as const;
