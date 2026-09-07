"use client";

import type { ReactNode } from "react";

import { SecurityProductHome } from "@/components/product-line/SecurityProductHome";
import { useProductLine } from "@/components/product-line/ProductLineProvider";

export function ProductLineHomeSwitch(props: { readonly architectureHome: ReactNode }): React.JSX.Element {
  const { productLine } = useProductLine();

  if (productLine === "security") {
    return <SecurityProductHome />;
  }

  return <>{props.architectureHome}</>;
}
