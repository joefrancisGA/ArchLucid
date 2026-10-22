import type { ProductLineId } from "@/lib/product-line/product-line-id";

/**
 * Where a destination belongs.
 *
 * - `architecture` — Architecture review product only
 * - `security` — Security / infrastructure product only
 * - `both` — shared platform surface (visible in both shells)
 *
 * Move a feature by changing its assignment in `product-line-catalog.ts` or in the
 * Internal product-line playground (localStorage overlay).
 */
export const PRODUCT_LINE_ASSIGNMENTS = ["architecture", "security", "both"] as const;

export type ProductLineAssignment = (typeof PRODUCT_LINE_ASSIGNMENTS)[number];

export const DEFAULT_PRODUCT_LINE_ASSIGNMENT: ProductLineAssignment = "architecture";

export function isProductLineAssignment(value: string | null | undefined): value is ProductLineAssignment {
  if (value === null || value === undefined) {
    return false;
  }

  return PRODUCT_LINE_ASSIGNMENTS.some((assignment) => assignment === value);
}

export function productLineAssignmentIncludes(
  assignment: ProductLineAssignment,
  productLine: ProductLineId,
): boolean {
  if (assignment === "both") {
    return true;
  }

  return assignment === productLine;
}
