export const DEMO_EXPLAIN_CANONICAL_PATH = "/demo/explain" as const;

export const DEMO_EXPLAIN_CLAIM_DISCIPLINE =
  "This page shows an example provenance graph and citations-bound explanation for a seeded demo review — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open live Reviews, Provenance, or Security & trust when you need workspace packages or assurance claims.";

export const DEMO_EXPLAIN_SOURCES_INTRO =
  "Use these follow-ups when demo explain turns into starting a real review, validating provenance, or opening buyer/demo orientation.";

export type DemoExplainSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to `/demo/explain`. */
export const DEMO_EXPLAIN_SOURCES: readonly DemoExplainSourceLink[] = [
  { label: "Start a review", href: "/architecture/reviews/new" },
  { label: "Validate review", href: "/replay" },
  { label: "Evidence trail help", href: "/help/evidence-trail" },
  { label: "Why ArchLucid", href: "/why-archlucid" },
  { label: "Demo preview", href: "/demo/preview" },
  { label: "Security & trust", href: "/security-trust" },
] as const;
