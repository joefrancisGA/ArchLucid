import {
  HELP_APP_GUIDED_TOPIC_SLUGS,
  HELP_MARKDOWN_WITH_LAYOUT_TOPIC_SLUGS,
} from "@/lib/help/help-topic-content-loader";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

/** Dedicated `Help*GuideView` modules — kept in sync with `HELP_APP_GUIDED_TOPIC_SLUGS` (TB-2238). */
export const HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS = HELP_APP_GUIDED_TOPIC_SLUGS;

/** Explicit enriched `HelpTopicMarkdownView` branches — not bare Print/PDF fallthrough (TB-1601). */
export const HELP_TOPIC_ENRICHED_MARKDOWN_DISPATCH_SLUGS = HELP_MARKDOWN_WITH_LAYOUT_TOPIC_SLUGS;

export type HelpTopicBareMarkdownFallthroughAllowlistEntry = {
  slug: string;
  backlogId: string;
};

/** Residual bare markdown exceptions — each row must cite an open specialty backlog owner (TB-1601). */
export const HELP_TOPIC_BARE_MARKDOWN_FALLTHROUGH_ALLOWLIST: ReadonlyArray<HelpTopicBareMarkdownFallthroughAllowlistEntry> =
  [];

export type HelpTopicCatchAllDispatchKind =
  | "specialty-guide"
  | "enriched-markdown"
  | "bare-markdown-allowlisted";

export function resolveHelpTopicCatchAllDispatchKind(
  entry: Pick<ProductDocumentationEntry, "slug" | "contentKind">,
): HelpTopicCatchAllDispatchKind | null {
  const slug = entry.slug;

  if ((HELP_TOPIC_SPECIALTY_GUIDE_DISPATCH_SLUGS as readonly string[]).includes(slug)) {
    return "specialty-guide";
  }

  if ((HELP_TOPIC_ENRICHED_MARKDOWN_DISPATCH_SLUGS as readonly string[]).includes(slug)) {
    return "enriched-markdown";
  }

  if (HELP_TOPIC_BARE_MARKDOWN_FALLTHROUGH_ALLOWLIST.some((item) => item.slug === slug)) {
    return "bare-markdown-allowlisted";
  }

  return null;
}

/** Fail closed when a buyer/product slug would silently hit bare markdown fallthrough (TB-1601). */
export function assertHelpTopicCatchAllFallthroughAllowed(
  entry: Pick<ProductDocumentationEntry, "slug" | "contentKind">,
): void {
  if (entry.contentKind === "internal-runbook") {
    return;
  }

  const kind = resolveHelpTopicCatchAllDispatchKind(entry);

  if (kind === "bare-markdown-allowlisted") {
    return;
  }

  throw new Error(
    `Help topic "${entry.slug}" (${entry.contentKind}) reached bare HelpTopicMarkdownView fallthrough without an explicit TB-1601 allowlist entry.`,
  );
}
