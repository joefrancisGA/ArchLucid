import { resolveSecureNowEditionId } from "@/lib/editions/resolve-securenow-edition-id";
import type { ProductLineId } from "@/lib/product-line/product-line-id";
import {
  productLineDocumentTitle,
  productLineTitleTemplate,
} from "@/lib/product-line/product-line-display-name";

/** Browser tab title. UHG names the edition so the local generic and UHG windows are distinct. */
export function resolveSecureNowWorkspaceDocumentTitle(productLineId: ProductLineId): string {
  if (resolveSecureNowEditionId() === "uhg") {
    return "SecureNow UHG workspace";
  }

  return productLineDocumentTitle(productLineId);
}

export function resolveSecureNowWorkspaceTitleTemplate(productLineId: ProductLineId): string {
  if (resolveSecureNowEditionId() === "uhg") {
    return "%s · SecureNow UHG";
  }

  return productLineTitleTemplate(productLineId);
}
