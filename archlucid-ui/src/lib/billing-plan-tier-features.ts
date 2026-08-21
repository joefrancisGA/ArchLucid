/**
 * Tier bullets for public marketing cards — qualitative packaging aligned with buyer-facing plans.
 * Currency figures on cards come from `public/pricing.json` (`planMonthlyUsd` or Custom).
 */
export const BILLING_TIER_FEATURE_BULLETS: Readonly<Record<string, readonly string[]>> = {
  architect: [
    "1 user · 1 workspace",
    "Monthly AI credit allowance (hard cap)",
    "Architecture creation and reviews",
    "Evidence graph, evidence Q&A, and review findings",
    "Basic exports and sample workspace",
  ],
  team: [
    "5 users · 1 workspace included",
    "Larger monthly AI allowance than Architect",
    "Basic governance for review findings",
    "Finalized review records and comparison reviews",
    "Self-service start — no procurement call required",
  ],
  professional: [
    "15 users · multiple workspaces",
    "Policy packs, audit exports, and review comparison",
    "Scorecards and guided trial onboarding",
    "Expanded AI allowance with clear overage options",
    "Architecture review practice packaging",
  ],
  enterprise: [
    "Custom users, workspaces, and deployment model",
    "SSO, procurement terms, and private deployment options",
    "Custom data handling and dedicated support",
    "Custom policy packs and enterprise workflow integrations",
    "Custom AI allowance and contract terms",
  ],
};
