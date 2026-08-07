import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const DECISION_REGISTER_CLAIM_DISCIPLINE =
  "This register lists architecture decisions recorded with signed reviews in the current workspace — browse and filter for operators, not a standalone diligence Sources package. Do not imply CPA SOC 2 attestation or a published third-party pen test from this page.";

export const DECISION_REGISTER_SOURCES_INTRO =
  "Open the related architecture review or findings when a decision needs follow-up; use Audit trail for activity context.";

export type DecisionRegisterSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources — no self-href to decision-register. */
export const DECISION_REGISTER_SOURCES: readonly DecisionRegisterSourceLink[] = [
  { label: "Architecture reviews", href: "/architecture/reviews" },
  { label: "Findings", href: "/governance/findings" },
  { label: "Audit trail", href: "/governance/audit" },
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
] as const;

export const DECISION_REGISTER_CANONICAL_PATH = "/governance/decision-register" as const;
