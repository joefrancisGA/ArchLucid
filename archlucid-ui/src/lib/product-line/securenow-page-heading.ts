import type { ProductLineId } from "@/lib/product-line/product-line-id";
import { SECURENOW_NAV_LABELS } from "@/lib/product-line/securenow-nav-labels";
import { secureNowTitleCase } from "@/lib/product-line/securenow-title-case";

/** SecureNow page chrome titles — sidebar labels win when a nav href is known. */
export function resolveSecureNowPageHeading(
  productLineId: ProductLineId,
  architectureHeading: string,
  secureNowNavHref?: string,
): string {
  if (productLineId !== "security") {
    return architectureHeading;
  }

  if (secureNowNavHref !== undefined) {
    const navLabel = SECURENOW_NAV_LABELS[secureNowNavHref];

    if (navLabel !== undefined) {
      return navLabel;
    }
  }

  return secureNowTitleCase(architectureHeading);
}
