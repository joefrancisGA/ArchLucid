/**
 * Tier bullets aligned with `docs/go-to-market/PRICING_PHILOSOPHY.md` §3 (packaging + feature gates).
 * Currency figures on cards come from `public/pricing.json`; this file captures qualitative packaging only.
 */
export const BILLING_TIER_FEATURE_BULLETS: Readonly<Record<string, readonly string[]>> = {
  team: [
    "1 workspace · up to 5 architect seats",
    "20 architecture reviews / month included ($10 / review overage)",
    "Golden manifests, comparison reviews, all 10 finding engines",
    "Basic governance checkpoint for configured high-risk changes",
    "90-day audit retention · Entra ID · community / email support",
  ],
  professional: [
    "Up to 5 workspaces · up to 20 architect seats",
    "100 reviews / month included ($8 / review overage)",
    "Full governance — approvals, policy packs, segregation of duties",
    "Audit export (CSV), DOCX consulting export, webhooks / CloudEvents",
    "1-year audit retention · business-hours email + onboarding call",
  ],
  enterprise: [
    "Unlimited workspaces and named architects (annual contract)",
    "Unlimited reviews — 2,000 / month fair-use soft cap",
    "Full governance + custom policy pack support · Service Bus",
    "Custom audit retention + export · Entra ID + generic OIDC (roadmap)",
    "Dedicated CSM · priority response · custom SLA terms",
  ],
};
