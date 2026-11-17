"use client";

import { usePathname } from "next/navigation";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { resolvePolicyPacksHubPath } from "@/lib/product-line/securenow-compliance-routes";

/** Resolves the policy packs hub for links from the active route namespace and product line. */
export function usePolicyPacksHubPath(): string {
  const pathname = usePathname();
  const { productLine } = useProductLine();

  return resolvePolicyPacksHubPath(pathname, productLine);
}
