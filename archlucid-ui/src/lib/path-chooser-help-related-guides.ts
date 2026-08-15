import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

/** TB-1715 — at most three related help guides; Trust Center and procurement live in goal branches. */
export const PATH_CHOOSER_HELP_RELATED_GUIDES: readonly EvidenceSourceLink[] = [
  { label: "Getting started", href: inAppHelpHref("getting-started") },
  { label: "Your first architecture review", href: inAppHelpHref("first-architecture-review") },
  { label: "Security and trust", href: inAppHelpHref("security-trust") },
] as const;

export const PATH_CHOOSER_HELP_RELATED_HEADING = "Related help" as const;

export const PATH_CHOOSER_HELP_RELATED_TEST_ID = "help-path-chooser-related-next-steps";

/** Related guides for `/help/choose-your-next-step`. */
export function pathChooserHelpRelatedGuides(): readonly EvidenceSourceLink[] {
  return PATH_CHOOSER_HELP_RELATED_GUIDES;
}
