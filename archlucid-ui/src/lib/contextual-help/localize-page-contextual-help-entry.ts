import type { PageContextualHelpAction, PageContextualHelpEntry } from "@/lib/contextual-help/types";
import { localizeProductCopy } from "@/lib/product-line/product-line-display-name";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

function localizeAction(
  action: PageContextualHelpAction | undefined,
  productLineId: ProductLineId,
): PageContextualHelpAction | undefined {
  if (action === undefined) {
    return undefined;
  }

  return {
    ...action,
    label: localizeProductCopy(productLineId, action.label),
  };
}

function localizeOptionalCopy(text: string | undefined, productLineId: ProductLineId): string | undefined {
  if (text === undefined) {
    return undefined;
  }

  return localizeProductCopy(productLineId, text);
}

/** Rewrites consumer product and Teams labels in page-help drawer copy. */
export function localizePageContextualHelpEntry(
  entry: PageContextualHelpEntry,
  productLineId: ProductLineId,
): PageContextualHelpEntry {
  if (productLineId === "architecture") {
    return entry;
  }

  const localizedSteps = entry.taskSteps?.map((step) => localizeProductCopy(productLineId, step));

  return {
    ...entry,
    whatIsThisPage: localizeProductCopy(productLineId, entry.whatIsThisPage),
    whatToDoNext: localizeProductCopy(productLineId, entry.whatToDoNext),
    whyEmpty: localizeOptionalCopy(entry.whyEmpty, productLineId),
    whereToConfigurePrerequisite: localizeOptionalCopy(entry.whereToConfigurePrerequisite, productLineId),
    whatToDoNextAction: localizeAction(entry.whatToDoNextAction, productLineId),
    whereToConfigureAction: localizeAction(entry.whereToConfigureAction, productLineId),
    taskSteps: localizedSteps,
  };
}
