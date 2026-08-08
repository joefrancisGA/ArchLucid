import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const OPERATOR_HOME_CANONICAL_PATH = "/";

export const OPERATOR_HOME_CLAIM_DISCIPLINE =
  "Overview is the operator command-center launcher for next actions, recent reviews, and directional ROI — it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open Architecture reviews, Evidence trail, or Trust Center when you need sponsor-safe trails.";

export const OPERATOR_HOME_SOURCES_INTRO =
  "Use these follow-ups when Overview next-actions need review packages, findings triage, executive ROI, or first-run guidance.";

export type OperatorHomeSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to Overview `/`. */
export const OPERATOR_HOME_SOURCES: readonly OperatorHomeSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Start review", href: "/architecture/reviews/new" },
  { label: "Executive dashboard", href: "/architecture/executive-dashboard" },
  { label: "Governance findings", href: "/governance/findings" },
  { label: "First architecture review help", href: inAppHelpHref("first-architecture-review") },
] as const;
