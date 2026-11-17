"use client";

import { usePathname } from "next/navigation";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  findingsPathForProductLine,
  isFindingsRoutePath,
} from "@/lib/product-line/securenow-compliance-routes";

/** Canonical findings queue path for URL sync from the active route namespace and product line. */
export function useFindingsQueuePath(): string {
  const pathname = usePathname();
  const { productLine } = useProductLine();

  if (isFindingsRoutePath(pathname)) {
    const bare = pathname?.split("?", 1)[0];

    if (bare !== undefined && bare.length > 0) {
      return bare;
    }
  }

  return findingsPathForProductLine(productLine);
}
