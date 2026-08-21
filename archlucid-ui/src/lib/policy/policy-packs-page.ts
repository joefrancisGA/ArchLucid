export const POLICY_PACKS_PAGE_TITLE = "Policy packs";

export const POLICY_PACKS_PAGE_SUBTITLE =
  "Review the policy pack currently applied to this workspace and the rules enforced for this review.";

export const BUYER_POLICY_PACKS_PAGE_SUBTITLE =
  "See the active pack and rules enforced for reviews in this workspace.";

export const POLICY_PACKS_PAGE_SUBTITLE_OPERATOR =
  "Policy packs bundle rules and scope defaults. Assign them to workspaces to enforce governance.";

export function policyPacksPageSubtitle(buyerPolishedShell: boolean): string {
  return buyerPolishedShell ? BUYER_POLICY_PACKS_PAGE_SUBTITLE : POLICY_PACKS_PAGE_SUBTITLE_OPERATOR;
}

export const POLICY_PACKS_LAST_REFRESHED_PREFIX = "Last refreshed" as const;

export const POLICY_PACKS_ACTION_REFRESH = "Refresh" as const;

export const POLICY_PACKS_ACTION_REFRESHING = "Refreshing…" as const;

export const POLICY_PACKS_LAYER_GUIDANCE_TRIGGER = "About policy packs" as const;

export const POLICY_PACKS_SCOPE_DETAILS_TRIGGER = "About policy packs" as const;

export const POLICY_PACKS_RESOLUTION_LINK_LABEL = "How conflicts are resolved" as const;

/** Deep-link into the Policy packs help topic conflicts section (not Standards & rules). */
export const POLICY_PACKS_HELP_PATH = "/help/policy-packs" as const;

export const POLICY_PACKS_RESOLUTION_LINK_HREF =
  "/help/policy-packs#how-conflicts-are-resolved" as const;

export const POLICY_PACK_BASIS_BANNER_TITLE = "Policy pack basis";

export const POLICY_PACK_BASIS_BANNER_BODY = "Governance guardrails referenced by this review.";

export const POLICY_PACK_BASIS_VIEW_SIGNED_RECORD = "View finalized review record";

export const POLICY_PACK_BASIS_VIEW_EVIDENCE_TRAIL = "View evidence trail";

export const POLICY_PACK_BASIS_VIEW_AUDIT_TRAIL = "View audit trail";

export const POLICY_PACKS_ACTIVE_PACK_CARD_TITLE = "Active policy pack";

export const POLICY_PACKS_ENFORCED_RULES_TITLE = "Rules applied to this review";

export const POLICY_PACKS_VIEW_EXPLANATION_SUMMARY =
  "Policy packs define the standards and checks applied to reviews in this workspace.";

export const POLICY_PACKS_VIEW_EXPLANATION_NEXT_ACTION =
  "Inspect the active pack, review enforced rules, or open the catalog to compare available packs.";
