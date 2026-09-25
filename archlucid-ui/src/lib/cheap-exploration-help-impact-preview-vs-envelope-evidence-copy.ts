import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH } from "@/lib/cheap-exploration-help-impact-preview-vs-envelope-route";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CANONICAL_PATH =
  CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_PATH;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_TOPIC_LABEL =
  "Impact preview vs architecture envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_CLAIM_DISCIPLINE =
  "This topic compares two Working cheap envelopes on the architecture desk — neither path observes production systems or substitutes for runtime validation. Neither path is a sealed review record export. Open the live desk entry or Security & Trust before briefing sponsors." as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_POLICY_HEADING_ID =
  "help-impact-preview-vs-envelope-policy-cheap-envelope" as const;

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SAFETY_DESK_LINK: EvidenceSourceLink = {
  label: "Architecture reviews",
  href: REVIEWS_LIST_PATH,
};

export const CHEAP_EXPLORATION_HELP_IMPACT_PREVIEW_VS_ENVELOPE_SAFETY_SECURITY_TRUST_LINK: EvidenceSourceLink = {
  label: "Security & Trust",
  href: inAppHelpHref("security-trust"),
};
