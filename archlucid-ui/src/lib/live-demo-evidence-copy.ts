export const LIVE_DEMO_CANONICAL_PATH = "/live-demo" as const;

export const LIVE_DEMO_CLAIM_DISCIPLINE =
  "This live demo is a guided, read-only walkthrough of a fabricated sample architecture review — it is marketing evaluation orientation, not a signed-review diligence Sources package from your tenant, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Security & trust or start an evaluation when you need live workspace evidence.";

export const LIVE_DEMO_SOURCES_INTRO =
  "Use these evaluation links when the sample walkthrough turns into signup, assurance, or a deeper product tour.";

export type LiveDemoSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Marketing Sources — no self-href to `/live-demo`. */
export const LIVE_DEMO_SOURCES: readonly LiveDemoSourceLink[] = [
  { label: "Start evaluation", href: "/signup" },
  { label: "Get started", href: "/get-started" },
  { label: "Demo preview", href: "/demo/preview" },
  { label: "Security & trust", href: "/security-trust" },
  { label: "Product FAQ", href: "/faq" },
] as const;
