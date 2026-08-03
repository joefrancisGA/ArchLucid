import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ProductLearningDashboardBundle } from "@/types/product-learning";

import type { ProductLearningTimeRangeKey } from "./product-learning-types";

/** Produced by {@link useProductLearningPage} after server hydration (demo builds redirect before paint). */
export type ProductLearningPageViewModel = {
  readonly range: ProductLearningTimeRangeKey;
  readonly setRange: Dispatch<SetStateAction<ProductLearningTimeRangeKey>>;
  readonly bundle: ProductLearningDashboardBundle | null;
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly load: () => Promise<void>;
};
