import type { CurrentPrincipal } from "@/lib/current-principal";
import { principalCanAccessHelpTopic } from "@/lib/product-documentation-access";
import type { ProductDocumentationEntry } from "@/lib/product-documentation-registry";

export function canDownloadHelpTopicPdf(
  entry: ProductDocumentationEntry,
  principal: CurrentPrincipal,
  hasInboundAuthorization: boolean,
): boolean {
  if (entry.pdfStatus === null) {
    return false;
  }

  if (entry.pdfStatus === "public") {
    return true;
  }

  if (!hasInboundAuthorization) {
    return false;
  }

  if (!principalCanAccessHelpTopic(entry, principal)) {
    return false;
  }

  if (!principal.hasRecognizedArchLucidRole) {
    return false;
  }

  return entry.pdfStatus === "customer" || entry.pdfStatus === "internal";
}
