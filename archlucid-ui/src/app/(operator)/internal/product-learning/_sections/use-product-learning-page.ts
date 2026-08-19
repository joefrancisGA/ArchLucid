"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { fetchProductLearningDashboard } from "@/lib/api";
import type { ProductLearningDashboardBundle } from "@/types/product-learning";

import { sinceIsoForRange } from "./product-learning-page-helpers";
import type { ProductLearningTimeRangeKey } from "./product-learning-types";
import type { ProductLearningPageViewModel } from "./product-learning-view-model";

type UseProductLearningPageArgs = {
  readonly initialBundle: ProductLearningDashboardBundle | null;
  readonly initialFailure: ApiLoadFailureState | null;
};

export function useProductLearningPage(args: UseProductLearningPageArgs): ProductLearningPageViewModel {
  const [range, setRange] = useState<ProductLearningTimeRangeKey>("all");
  const [bundle, setBundle] = useState<ProductLearningDashboardBundle | null>(args.initialBundle);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(args.initialFailure);
  const skipInitialRangeFetchRef = useRef(true);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const since = sinceIsoForRange(range);
      const data = await fetchProductLearningDashboard({ since });

      setBundle(data);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
      setBundle(null);
    } finally {
      setLoading(false);
    }
  }, [range]);

  useEffect(() => {
    if (skipInitialRangeFetchRef.current) {
      skipInitialRangeFetchRef.current = false;

      return;
    }

    void load();
  }, [load]);

  return {
    range,
    setRange,
    bundle,
    loading,
    failure,
    load,
  };
}
