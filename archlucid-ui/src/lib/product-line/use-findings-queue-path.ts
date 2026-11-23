"use client";

import { usePathname } from "next/navigation";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { findingsQueuePathFromPathname } from "@/lib/product-line/securenow-compliance-routes";

/** Canonical findings queue path for URL sync from the active route namespace and product line. */
export function useFindingsQueuePath(): string {
  const pathname = usePathname();
  const { productLine } = useProductLine();

  return findingsQueuePathFromPathname(pathname, productLine);
}
