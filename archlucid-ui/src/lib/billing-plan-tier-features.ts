/**
 * Tier bullets aligned with `docs/go-to-market/PRICING_PHILOSOPHY.md` §3 (packaging + feature gates).
 * Currency figures on cards come from `public/pricing.json`; this file captures qualitative packaging only.
 */
export const BILLING_TIER_FEATURE_BULLETS: Readonly<Record<string, readonly string[]>> = {
  team: [
    "1 workspace · up to 5 architect seats",
    "20 architecture runs / month included ($10 / run overage)",
    "Golden manifests, comparison runs, all 10 finding engines",
    "Basic governance — pre-commit gate",
    "90-day audit retention · Entra ID · community / email support",
  ],
  professional: [
    "Up to 5 workspaces · up to 20 architect seats",
    "100 runs / month included ($8 / run overage)",
    "Full governance — approvals, policy packs, segregation of duties",
    "Audit export (CSV), DOCX consulting export, webhooks / CloudEvents",
    "1-year audit retention · business-hours email + onboarding call",
  ],
  enterprise: [
    "Unlimited workspaces and named architects (annual contract)",
    "Unlimited runs — 2,000 / month fair-use soft cap",
    "Full governance + custom policy pack support · Service Bus · SCIM (roadmap)",
    "Custom audit retention + export · Entra ID + generic OIDC (roadmap)",
    "Dedicated CSM · priority response · custom SLA with credits",
  ],
};
