import type { Metadata } from "next";

import { ProductLinePlaygroundClient } from "@/components/product-line/ProductLinePlaygroundClient";
import { PRODUCT_LINE_PLAYGROUND_TITLE } from "@/lib/product-line/product-line-copy";

export const metadata: Metadata = {
  title: PRODUCT_LINE_PLAYGROUND_TITLE,
};

export default function ProductLinePlaygroundPage() {
  return <ProductLinePlaygroundClient />;
}
