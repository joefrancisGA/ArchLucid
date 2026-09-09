import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { productLineDisplayName } from "@/lib/product-line/product-line-display-name";

export function resolveFindingWorkItemProductLineId(productLineId?: ProductLineId): ProductLineId {
  return productLineId ?? "architecture";
}

export function findingWorkItemProductName(productLineId?: ProductLineId): string {
  return productLineDisplayName(resolveFindingWorkItemProductLineId(productLineId));
}

export function findingWorkItemHeading(productLineId: ProductLineId | undefined, detail: string): string {
  return `${findingWorkItemProductName(productLineId)} Finding — ${detail}`;
}

export function findingWorkItemDefaultTitle(productLineId?: ProductLineId): string {
  return `${findingWorkItemProductName(productLineId)} finding`;
}

export function findingWorkItemExplainPageLinkLabel(productLineId?: ProductLineId): string {
  return `${findingWorkItemProductName(productLineId)} finding — explain page`;
}

export function findingWorkItemReviewLinkLabel(productLineId?: ProductLineId): string {
  return `${findingWorkItemProductName(productLineId)} review`;
}

export function findingWorkItemInspectorLinkLabel(productLineId?: ProductLineId): string {
  return `${findingWorkItemProductName(productLineId)} inspector link`;
}

export function findingWorkItemReviewInProductStep(productLineId?: ProductLineId): string {
  return `Review the finding in ${findingWorkItemProductName(productLineId)} using the inspector link below.`;
}
