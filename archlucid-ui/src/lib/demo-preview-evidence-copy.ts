export const DEMO_PREVIEW_CANONICAL_PATH = "/demo/preview" as const;

export const DEMO_PREVIEW_CLAIM_DISCIPLINE =
  "This demo preview shows a sample finalized architecture review for evaluation — it is not a signed-review diligence Sources package from your tenant, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Assurance status or start an evaluation when you need live workspace evidence.";

export const DEMO_PREVIEW_SOURCES_INTRO =
  "Use these evaluation links when the sample review turns into signup, assurance, or a live product tour.";

export type DemoPreviewSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to `/demo/preview`. */
export const DEMO_PREVIEW_SOURCES: readonly DemoPreviewSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Product FAQ", href: "/faq" },
  { label: "Assurance status", href: "/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Pricing", href: "/pricing" },
] as const;
