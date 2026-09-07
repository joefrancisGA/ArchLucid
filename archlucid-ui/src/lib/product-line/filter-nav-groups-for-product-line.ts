import type { NavGroupConfig, NavLinkItem } from "@/lib/nav-config.types";
import { productLineAssignmentIncludes, type ProductLineAssignment } from "@/lib/product-line/product-line-assignment";
import { resolveProductLineAssignmentForPath } from "@/lib/product-line/product-line-path-access";
import type { ProductLineId } from "@/lib/product-line/product-line-id";

export type ProductLineNavGroupRow = {
  readonly group: NavGroupConfig;
  visibleLinks: NavLinkItem[];
};

export type FilterNavGroupsForProductLineOptions = {
  readonly assignmentOverrides?: Readonly<Record<string, ProductLineAssignment>>;
};

/**
 * Drops sidebar rows that are not assigned to the active product.
 * Unlisted hrefs default to Architecture, so the Architecture shell keeps the full catalog
 * until a href is explicitly moved to `security`.
 */
export function filterNavGroupsForProductLine(
  rows: readonly ProductLineNavGroupRow[],
  productLine: ProductLineId,
  options: FilterNavGroupsForProductLineOptions = {},
): ProductLineNavGroupRow[] {
  return rows
    .map((row) => ({
      group: row.group,
      visibleLinks: row.visibleLinks.filter((link) => {
        const assignment = resolveProductLineAssignmentForPath(link.href, options.assignmentOverrides);

        return productLineAssignmentIncludes(assignment, productLine);
      }),
    }))
    .filter((row) => row.visibleLinks.length > 0);
}

export function productLineSkipsReviewLifecycleNavShaping(productLine: ProductLineId): boolean {
  return productLine === "security";
}
