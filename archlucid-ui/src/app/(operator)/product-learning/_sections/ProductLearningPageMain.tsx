"use client";

import { ProductLearningPageView } from "./ProductLearningPageView";
import { useProductLearningPage } from "./use-product-learning-page";

/** Client root for product learning; `page.tsx` stays a thin server wrapper. */
export function ProductLearningPageMain() {
  const model = useProductLearningPage();

  return <ProductLearningPageView model={model} />;
}
