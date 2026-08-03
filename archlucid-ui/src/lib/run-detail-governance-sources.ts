import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type RunDetailGovernanceSourceLink = {
  readonly label: string;
  readonly href: string;
};

/**
 * Create-home Governance tab Sources — sponsor-safe cites before finalize.
 * Twin committed surface is `reviewTab=decisions-remediation`, not this archTab.
 */
export const RUN_DETAIL_GOVERNANCE_PRE_COMMIT_SOURCES: readonly RunDetailGovernanceSourceLink[] = [
  { label: "Governance approval help", href: inAppHelpHref("governance-approval") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
  { label: "Findings queue", href: "/governance/findings" },
  { label: "Search review evidence", href: "/insights/search-review-evidence" },
  { label: "Compare two reviews", href: "/insights/compare-two-reviews" },
  { label: "Open audit trail", href: GOVERNANCE_AUDIT_PATH },
] as const;

export const RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE =
  "This create-home tab orients assessment before finalize. It is not the committed governance decision surface and does not imply CPA SOC 2 attestation or a published third-party pen test.";
