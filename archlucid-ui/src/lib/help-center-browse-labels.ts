import { resolveProductDocumentationContentKind } from "@/lib/product-documentation-content-kinds";

export const HELP_BROWSE_GUIDE_LABEL = "Guide" as const;

export const HELP_BROWSE_DOCUMENTATION_LABEL = "Documentation" as const;

export type HelpBrowseLabel = typeof HELP_BROWSE_GUIDE_LABEL | typeof HELP_BROWSE_DOCUMENTATION_LABEL;

/** Maps registry slugs to the Guides vs Documentation label shown in browse and search UI. */
export function resolveHelpTopicBrowseLabel(helpSlug: string | null): HelpBrowseLabel | null {
  if (helpSlug === null || helpSlug.trim().length === 0) {
    return null;
  }

  const kind = resolveProductDocumentationContentKind(helpSlug);

  if (kind === "technical-documentation") {
    return HELP_BROWSE_DOCUMENTATION_LABEL;
  }

  if (kind === "product-help") {
    return HELP_BROWSE_GUIDE_LABEL;
  }

  return null;
}
