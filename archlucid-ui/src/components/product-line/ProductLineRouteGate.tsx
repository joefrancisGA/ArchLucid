"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { isPathAllowedForProductLine } from "@/lib/product-line/product-line-path-access";
import { PRODUCT_LINE_LABELS } from "@/lib/product-line/product-line-copy";

export function ProductLineRouteGate(props: { readonly children: React.ReactNode }): React.JSX.Element {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  const { productLine, assignmentOverrides } = useProductLine();
  const allowed = isPathAllowedForProductLine(pathname, productLine, { assignmentOverrides });

  useEffect(() => {
    if (allowed) {
      return;
    }

    router.replace("/");
  }, [allowed, router]);

  if (allowed) {
    return <>{props.children}</>;
  }

  return (
    <p className={OPERATOR_TYPOGRAPHY.helper} data-testid="product-line-route-gate">
      This destination is not in the {PRODUCT_LINE_LABELS[productLine]} product. Returning to home.
    </p>
  );
}
