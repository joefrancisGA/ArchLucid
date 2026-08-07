export const WHY_CANONICAL_PATH = "/why" as const;

export const WHY_CLAIM_DISCIPLINE =
  "This Why ArchLucid page compares product fit for evaluation — it is marketing differentiation orientation, not a signed-review diligence Sources package from your tenant, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status, Trust Center, or start an evaluation when you need live workspace evidence.";

export const WHY_SOURCES_INTRO =
  "Use these evaluation links when the comparison story turns into a sample proof, signup, or assurance review.";

export type WhySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to `/why`. */
export const WHY_SOURCES: readonly WhySourceLink[] = [
  { label: "See a sample review", href: "/see-it" },
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
] as const;
