import { SECURENOW_HELP_HUB_CONTEXTUAL_HELP_ENTRY } from "@/lib/contextual-help/help-topic-rows-operator";
import { SECURENOW_HOME_CONTEXTUAL_HELP_ENTRY } from "@/lib/contextual-help/securenow-home-contextual-help-rows";
import type { PageContextualHelpEntry } from "@/lib/contextual-help/types";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

/** SecureNow product-line contextual help overrides (Security shell only). */
export function resolveSecureNowContextualHelpEntry(
  prefix: string,
  productLineId: ProductLineId,
): PageContextualHelpEntry | null {
  if (productLineId !== "security") {
    return null;
  }

  if (prefix === "/") {
    return SECURENOW_HOME_CONTEXTUAL_HELP_ENTRY;
  }

  if (prefix === "/help") {
    return SECURENOW_HELP_HUB_CONTEXTUAL_HELP_ENTRY;
  }

  return null;
}
