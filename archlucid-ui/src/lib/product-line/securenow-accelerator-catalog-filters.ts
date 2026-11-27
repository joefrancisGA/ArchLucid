
import type { SecureNowHomeDestinationRow } from "@/lib/product-line/securenow-home-destination-rows";
import {
  resolveSecureNowAcceleratorCatalogMeta,
  type SecureNowAcceleratorCatalogTag,
} from "@/lib/product-line/securenow-accelerator-catalog-taxonomy";

export function filterSecureNowAcceleratorRowsByCatalogTag(
  rows: readonly SecureNowHomeDestinationRow[],
  tag: SecureNowAcceleratorCatalogTag,
): readonly SecureNowHomeDestinationRow[] {
  if (tag === "all") return rows;

  return rows.filter((row) => resolveSecureNowAcceleratorCatalogMeta(row.href).family === tag);
}
