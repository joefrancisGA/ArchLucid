import { isInAppHelpFollowUpHref } from "@/lib/help/help-follow-up-link-label";

/** Follow-up index when every link stays inside `/help/...`. */
export const RELATED_GUIDES_FOLLOW_UPS_TITLE = "Related guides" as const;

/** Follow-up index when links mix in-app help topics and operator product routes. */
export const RELATED_RESOURCES_FOLLOW_UPS_TITLE = "Related resources" as const;

/** @deprecated Use {@link RELATED_GUIDES_FOLLOW_UPS_TITLE}. */
export const RELATED_GUIDES_HELP_SECTION_TITLE = RELATED_GUIDES_FOLLOW_UPS_TITLE;

export type RelatedFollowUpsTitle =
  | typeof RELATED_GUIDES_FOLLOW_UPS_TITLE
  | typeof RELATED_RESOURCES_FOLLOW_UPS_TITLE;

/** Pick Guides vs Resources from the destinations in a follow-up link list. */
export function resolveRelatedFollowUpsTitle(links: readonly { href: string }[]): RelatedFollowUpsTitle {
  const hasHelpLink = links.some((link) => isInAppHelpFollowUpHref(link.href));
  const hasNonHelpLink = links.some((link) => !isInAppHelpFollowUpHref(link.href));

  if (hasHelpLink && hasNonHelpLink) {
    return RELATED_RESOURCES_FOLLOW_UPS_TITLE;
  }

  return RELATED_GUIDES_FOLLOW_UPS_TITLE;
}

/** Help-only Related Guides strips omit Read/Open link prefixes — the heading already implies help topics. */
export function isHelpOnlyRelatedFollowUpsTitle(title: string): boolean {
  return title === RELATED_GUIDES_FOLLOW_UPS_TITLE;
}
