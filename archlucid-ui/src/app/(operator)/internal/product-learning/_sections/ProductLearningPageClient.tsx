"use client";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ProductLearningDashboardBundle } from "@/types/product-learning";

import { ProductLearningPageView } from "./ProductLearningPageView";
import { useProductLearningPage } from "./use-product-learning-page";

type ProductLearningPageClientProps = {
  readonly initialBundle: ProductLearningDashboardBundle | null;
  readonly initialFailure: ApiLoadFailureState | null;
};

export function ProductLearningPageClient(props: ProductLearningPageClientProps) {
  const model = useProductLearningPage({
    initialBundle: props.initialBundle,
    initialFailure: props.initialFailure,
  });

  return <ProductLearningPageView model={model} />;
}
