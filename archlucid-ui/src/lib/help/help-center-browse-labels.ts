import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

export const HELP_BROWSE_GUIDE_LABEL = "Guide" as const;

export const HELP_BROWSE_DOCUMENTATION_LABEL = "Documentation" as const;

export type HelpBrowseLabel = typeof HELP_BROWSE_GUIDE_LABEL | typeof HELP_BROWSE_DOCUMENTATION_LABEL;

/** Maps registry slugs to the Guides vs Documentation label shown in browse and search UI. */
export function resolveHelpTopicBrowseLabel(helpSlug: string | null): HelpBrowseLabel | null {
  if (helpSlug === null || helpSlug.trim().length === 0) {
    return null;
  }

  // TB-1739: callers may pass a retired alias slug (e.g. "how-it-works", "first-value-20-minutes")
  // that only exists as a permanent redirect. Those have no catalog row, so they earn no eyebrow —
  // and the label is decoration, so an unknown slug must not throw inside a drawer row render.
  // Live registry slugs still fail fast on a missing taxonomy mapping: the registry itself resolves
  // `contentKind` through `resolveProductDocumentationContentKind` when it is constructed.
  const entry = getProductDocumentationEntry(helpSlug);

  if (entry === null) {
    return null;
  }

  const kind = entry.contentKind;

  if (kind === "technical-documentation") {
    return HELP_BROWSE_DOCUMENTATION_LABEL;
  }

  if (kind === "product-help") {
    return HELP_BROWSE_GUIDE_LABEL;
  }

  return null;
}

/**
 * Browse label for the Help drawer, where nearly every row is a guide. Only the
 * exception (technical documentation) earns an eyebrow; a label repeated on every row
 * carries no information and costs a line of vertical space per topic.
 */
export function resolveHelpDrawerBrowseLabel(helpSlug: string | null): HelpBrowseLabel | null {
  const label = resolveHelpTopicBrowseLabel(helpSlug);

  return label === HELP_BROWSE_DOCUMENTATION_LABEL ? label : null;
}
