import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** TB-1382: at most three related guides that support the first-review job without dumping the help center. */
export const CORE_PILOT_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: "Evidence intake", href: inAppHelpHref("evidence-intake") },
  { label: "Pilot guide", href: inAppHelpHref("pilot-guide") },
  { label: "Troubleshooting", href: inAppHelpHref("troubleshooting") },
] as const;

/** Related guides for `/help/first-architecture-review`. */
export function corePilotHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return CORE_PILOT_HELP_RELATED_GUIDES;
}
