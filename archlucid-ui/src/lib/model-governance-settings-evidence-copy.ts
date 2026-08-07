import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH =
  "/administration/model-governance" as const;

export const MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE =
  "This AI and model governance page manages workspace execution profiles and model aliases - it is not a signed-review diligence Sources package, a CPA SOC 2 attestation, or a published third-party pen-test report. Open AI usage, Billing and plans, or Assurance status when you need spend signals, plan controls, or trust cites.";

export const MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when profile or alias changes turn into spend monitoring, plan controls, or assurance cites.";

export type ModelGovernanceSettingsSourceLink = {
  readonly label: string;
  readonly href: string;
};

/** Operator Sources - no self-href to `/administration/model-governance`. */
export const MODEL_GOVERNANCE_SETTINGS_SOURCES: readonly ModelGovernanceSettingsSourceLink[] = [
  { label: "AI usage and cost", href: "/administration/ai-usage" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Billing & plans", href: "/administration/billing" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
