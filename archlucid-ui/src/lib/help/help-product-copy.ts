import type { EvidenceSourceLink } from "@/lib/evidence-surface-copy";
import {
  howProductWorksTitle,
  localizeProductCopy,
  productLineDisplayName,
} from "@/lib/product-line/product-line-display-name";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

import type { HelpCenterDisplay } from "@/lib/help/help-center-catalog";
import type { HelpSearchPanelTopic } from "@/lib/help/help-search-panel-catalog";

/** Stable anchor — visible label is product-line-aware via {@link howProductWorksTitle}. */
export const HOW_PRODUCT_WORKS_HELP_ANCHOR = "how-archlucid-works" as const;

export function howProductWorksHelpHref(): string {
  return inAppHelpHref("getting-started", HOW_PRODUCT_WORKS_HELP_ANCHOR);
}

export function howProductWorksHelpSourceLink(productLineId: ProductLineId): EvidenceSourceLink {
  return {
    label: howProductWorksTitle(productLineId),
    href: howProductWorksHelpHref(),
  };
}

export function newToProductHelpCollapsedSummary(productLineId: ProductLineId): string {
  return `New to ${productLineDisplayName(productLineId)}?`;
}

export function evaluatingProductHelpSectionTitle(productLineId: ProductLineId): string {
  return `If you are evaluating ${productLineDisplayName(productLineId)}`;
}

export function useProductAsReviewDeskTitle(productLineId: ProductLineId): string {
  return `Use ${productLineDisplayName(productLineId)} as your review desk`;
}

/** Rewrites consumer product mentions in help UI copy for the active product line. */
export function localizeHelpCopy(productLineId: ProductLineId, text: string): string {
  return localizeProductCopy(productLineId, text);
}

export function localizeHelpCenterDisplay(
  display: HelpCenterDisplay,
  productLineId: ProductLineId,
): HelpCenterDisplay {
  return {
    title: display.title,
    summary: localizeHelpCopy(productLineId, display.summary),
  };
}

export function localizeHelpSearchPanelTopic(
  topic: HelpSearchPanelTopic,
  productLineId: ProductLineId,
): HelpSearchPanelTopic {
  if (productLineId === "architecture") {
    return topic;
  }

  const localizedTitle =
    topic.id === "how-archlucid-works" ? howProductWorksTitle(productLineId) : localizeHelpCopy(productLineId, topic.title);

  return {
    ...topic,
    title: localizedTitle,
    description: localizeHelpCopy(productLineId, topic.description),
  };
}

export function localizeHelpSearchPanelTopics(
  topics: readonly HelpSearchPanelTopic[],
  productLineId: ProductLineId,
): HelpSearchPanelTopic[] {
  if (productLineId === "architecture") {
    return [...topics];
  }

  return topics.map((topic) => localizeHelpSearchPanelTopic(topic, productLineId));
}
