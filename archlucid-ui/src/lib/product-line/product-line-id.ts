/** Two operator product shells sharing one Next.js app and one API host. */
export const PRODUCT_LINE_IDS = ["architecture", "security"] as const;

export type ProductLineId = (typeof PRODUCT_LINE_IDS)[number];

export const DEFAULT_PRODUCT_LINE_ID: ProductLineId = "architecture";

export function isProductLineId(value: string | null | undefined): value is ProductLineId {
  if (value === null || value === undefined) {
    return false;
  }

  return PRODUCT_LINE_IDS.some((id) => id === value);
}
