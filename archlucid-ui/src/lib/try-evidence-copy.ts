export const TRY_CANONICAL_PATH = "/try" as const;

export const TRY_CLAIM_DISCIPLINE =
  "This try page launches an illustrative sample review for evaluation — it is marketing frictionless trial orientation, not a signed-review diligence Sources package from your tenant, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const TRY_SOURCES_INTRO =
  "Use these evaluation links when the sample inspection turns into signup, assurance, or a guided first-run path.";

export type TrySourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to `/try`. */
export const TRY_SOURCES: readonly TrySourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Demo preview", href: "/demo/preview" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Product FAQ", href: "/faq" },
] as const;
