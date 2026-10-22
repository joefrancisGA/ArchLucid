import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { fetchProductLearningDashboard } from "@/lib/api";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import type { ProductLearningDashboardBundle } from "@/types/product-learning";

import { sinceIsoForRange } from "./product-learning-page-helpers";

export type ProductLearningPageServerLoad =
  | { kind: "redirect-demo" }
  | {
      kind: "ready";
      bundle: ProductLearningDashboardBundle | null;
      failure: ApiLoadFailureState | null;
    };

export async function loadProductLearningPageData(): Promise<ProductLearningPageServerLoad> {
  if (isNextPublicDemoMode()) {
    return { kind: "redirect-demo" };
  }

  try {
    const since = sinceIsoForRange("all");
    const bundle: ProductLearningDashboardBundle = await fetchProductLearningDashboard({ since });

    return { kind: "ready", bundle, failure: null };
  } catch (e: unknown) {
    return { kind: "ready", bundle: null, failure: toApiLoadFailure(e) };
  }
}
