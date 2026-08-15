import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const SIGNUP_CANONICAL_PATH = "/signup" as const;

/** Honest scope — calm procurement language; do not lead with absent CPA / pen-test as the visual climax. */
export const SIGNUP_CLAIM_DISCIPLINE =
  "This page starts an evaluation workspace request. Assurance downloads, SOC self-assessment status, and pen-test summaries live on Assurance status and Trust Center—not on this form. Do not treat signup copy as a sealed-review diligence Sources package.";

export const SIGNUP_SOURCES_INTRO =
  "Packaging and assurance links not covered in the form above.";

export const SIGNUP_SOURCES_HEADING = "Related";

export const SIGNUP_CLAIM_DISCIPLINE_HEADING = "What this page covers";


/**
 * Marketing Sources — no self-href to /signup.
 * One link each; omit Sample / Security / Getting started (hero, claim, or nav already cover them).
 * Product FAQ appears only here on-page (footer also links FAQ site-wide).
 */
export const SIGNUP_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Pricing", href: "/pricing" },
  { label: "Trust Center", href: "/trust" },
  { label: "Product FAQ", href: "/faq" },
] as const;
