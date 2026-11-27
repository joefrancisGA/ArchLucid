
import {
  secureNowAcceleratorCatalogRows,
  type SecureNowAcceleratorCatalogFamily,
} from "@/lib/product-line/securenow-accelerator-catalog-taxonomy";

export type SecureNowAcceleratorFamilyProgress = {
  readonly family: SecureNowAcceleratorCatalogFamily;
  readonly visited: number;
  readonly total: number;
};

export function computeSecureNowAcceleratorFamilyProgress(
  visitedHrefs: readonly string[],
): readonly SecureNowAcceleratorFamilyProgress[] {
  const visited = new Set(visitedHrefs.map((href) => href.split("#")[0] ?? href));
  const families = new Map<SecureNowAcceleratorCatalogFamily, { visited: number; total: number }>();

  for (const meta of secureNowAcceleratorCatalogRows()) {
    const baseHref = meta.href.split("#")[0] ?? meta.href;
    const bucket = families.get(meta.family) ?? { visited: 0, total: 0 };
    const nextTotal = bucket.total + 1;
    const nextVisited = bucket.visited + (visited.has(baseHref) ? 1 : 0);
    families.set(meta.family, { visited: nextVisited, total: nextTotal });
  }

  return [...families.entries()].map(([family, counts]) => ({
    family,
    visited: counts.visited,
    total: counts.total,
  }));
}
