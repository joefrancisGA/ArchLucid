import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SIGNUP_CANONICAL_PATH = "/signup" as const;

/** Honest scope — calm procurement language; do not lead with absent CPA / pen-test as the visual climax. */
export const SIGNUP_CLAIM_DISCIPLINE =
  "This page starts an evaluation workspace request. Assurance downloads, SOC self-assessment status, and pen-test summaries live on Assurance status and Trust Center — not on this form. Do not treat signup copy as a full audit export.";

export const SIGNUP_SOURCES_INTRO =
  "Packaging and assurance links not covered in the form above.";

export const SIGNUP_CLAIM_DISCIPLINE_HEADING = "What this page covers";

/**
 * Marketing sources — no self-href to /signup.
 * Omit sample / FAQ / Trust Center when hero, claim, or nav already cover them.
 */
export const SIGNUP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Assurance status", href: "/assurance-status" },
] as const;
