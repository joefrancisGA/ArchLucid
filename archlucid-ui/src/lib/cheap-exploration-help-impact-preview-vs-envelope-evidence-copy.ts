import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { HELP_HUB_CANONICAL_PATH } from "@/lib/help/help-hub-evidence-copy";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CANONICAL_PATH =
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TOPIC_LABEL =
  "Impact preview vs architecture envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE =
  "This topic compares two Working cheap envelopes on the architecture desk — neither path observes production systems or substitutes for runtime validation. Neither path is a sealed-review diligence Sources package. Open the live desk entry or Security & Trust before briefing sponsors." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID =
  "help-impact-preview-vs-envelope-policy-cheap-envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SOURCES: readonly EvidenceSourceLink[] = [
  { label: "Help index", href: HELP_HUB_CANONICAL_PATH },
  { label: "Impact preview", href: inAppHelpHref("impact-preview") },
  { label: "Sketch a change", href: inAppHelpHref("sketch-a-change") },
  { label: "Architecture desk", href: inAppHelpHref("architecture-desk") },
  { label: "Security & Trust", href: inAppHelpHref("security-trust") },
] as const;
