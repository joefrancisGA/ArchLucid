import type { Dispatch, SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import type { ProductLearningDashboardBundle } from "@/types/product-learning";

import type { ProductLearningTimeRangeKey } from "./product-learning-types";

export type ProductLearningPageViewModel = {
  readonly demoMode: boolean;
  readonly range: ProductLearningTimeRangeKey;
  readonly setRange: Dispatch<SetStateAction<ProductLearningTimeRangeKey>>;
  readonly bundle: ProductLearningDashboardBundle | null;
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly load: () => Promise<void>;
};
