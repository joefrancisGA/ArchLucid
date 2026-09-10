"use client";

import { useMemo } from "react";

import { useProductLine } from "@/components/product-line/ProductLineProvider";
import { localizeProductCopy } from "@/lib/product-line/product-line-display-name";

/** Binds {@link localizeProductCopy} to the active product line in client surfaces. */
export function useLocalizedProductCopy(): {
  readonly productLine: ReturnType<typeof useProductLine>["productLine"];
  readonly localize: (text: string) => string;
} {
  const { productLine } = useProductLine();

  return useMemo(
    () => ({
      productLine,
      localize: (text: string) => localizeProductCopy(productLine, text),
    }),
    [productLine],
  );
}
