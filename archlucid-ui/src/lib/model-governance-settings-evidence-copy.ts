import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const MODEL_GOVERNANCE_SETTINGS_CANONICAL_PATH =
  "/administration/model-governance" as const;

export const MODEL_GOVERNANCE_SETTINGS_CLAIM_DISCIPLINE =
  "This AI and model governance page manages workspace execution profiles and model aliases - it is not a signed-review diligence Sources package. Open AI usage, Billing and plans, or Assurance status when you need spend signals, plan controls, or trust cites.";

export const MODEL_GOVERNANCE_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when profile or alias changes turn into spend monitoring, plan controls, or assurance cites.";


/** Operator Sources - no self-href to `/administration/model-governance`. */
export const MODEL_GOVERNANCE_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "AI usage and cost", href: "/administration/ai-usage" },
  { label: "Billing and plans help", href: inAppHelpHref("billing-and-plans") },
  { label: "Billing & plans", href: "/administration/billing" },
  { label: "How ArchLucid works", href: inAppHelpHref("getting-started", "how-archlucid-works") },
  { label: "Assurance status", href: "/security-trust" },
] as const;
