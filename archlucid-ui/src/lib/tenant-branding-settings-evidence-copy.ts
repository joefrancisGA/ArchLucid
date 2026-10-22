import { inAppHelpHref } from "@/lib/product-documentation-registry";
import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";

export const TENANT_BRANDING_SETTINGS_CLAIM_DISCIPLINE =
  "Branding previews operator chrome — not a sealed diligence export or customer contract artifact. Activate only after reviewing logos and colors in context." as const;

export const TENANT_BRANDING_SETTINGS_FOLLOW_UPS_TITLE = "Where to go next" as const;

export const TENANT_BRANDING_SETTINGS_SOURCES_INTRO =
  "Use these follow-ups when branding work turns into workspace settings, trust posture, or pilot onboarding." as const;

export const TENANT_BRANDING_SETTINGS_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Workspace settings", href: "/administration/workspace-settings" },
  { label: "Security & Trust", href: "/administration/security-trust" },
  { label: "Trust Center", href: "/trust" },
  { label: "Enterprise onboarding", href: inAppHelpHref("enterprise-onboarding") },
  { label: "Administration hub", href: "/administration" },
] as const;
