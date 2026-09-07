import { inAppHelpHref } from "@/lib/product-documentation-registry";

export type RunDetailGovernanceSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Inline help cites on create-home Governance tab before finalize (REG). */
export const RUN_DETAIL_GOVERNANCE_PRE_COMMIT_HELP_CITES: readonly RunDetailGovernanceSourceLink[] = [
  { label: "Approval help", href: inAppHelpHref("governance-approval") },
  { label: "Audit trail help", href: inAppHelpHref("audit-trail") },
] as const;

export const RUN_DETAIL_GOVERNANCE_PRE_COMMIT_CLAIM_DISCIPLINE =
  "This create-home tab orients assessment before finalize. It is not the committed approval decision surface.";
