"use client";

import { usePathname } from "next/navigation";

import { ProductLineRouteBlockedView } from "@/components/product-line/ProductLineRouteBlockedView";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { isPathAllowedForProductLine } from "@/lib/product-line/product-line-path-access";

export function ProductLineRouteGate(props: { readonly children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const { productLine, assignmentOverrides } = useProductLine();
  const allowed = isPathAllowedForProductLine(pathname, productLine, { assignmentOverrides });

  if (allowed) {
    return <>{props.children}</>;
  }

  return <ProductLineRouteBlockedView pathname={pathname} />;
}
