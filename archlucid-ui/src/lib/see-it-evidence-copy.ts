export const SEE_IT_CANONICAL_PATH = "/see-it" as const;

export const SEE_IT_CLAIM_DISCIPLINE =
  "This see-it page shows a fabricated sample finalized review for evaluation — it is marketing proof orientation, not a signed-review diligence Sources package from your tenant, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const SEE_IT_SOURCES_INTRO =
  "Use these evaluation links when the sample proof turns into signup, assurance, or a deeper walkthrough.";

export type SeeItSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to `/see-it`. */
export const SEE_IT_SOURCES: readonly SeeItSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Live demo", href: "/live-demo" },
  { label: "Demo preview", href: "/demo/preview" },
  { label: "Assurance status", href: "/security-trust" },
] as const;
