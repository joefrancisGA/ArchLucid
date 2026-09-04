"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { fetchProductLearningDashboard } from "@/lib/api";
import {
  parseProductLearningRangeFromSearch,
  productLearningRangeHrefFromSearch,
} from "@/lib/internal/product-learning-range-url";
import { PRODUCT_LEARNING_PATH } from "@/lib/product-learning-route";
import type { ProductLearningDashboardBundle } from "@/types/product-learning";

import { sinceIsoForRange } from "./product-learning-page-helpers";
import type { ProductLearningTimeRangeKey } from "./product-learning-types";
import type { ProductLearningPageViewModel } from "./product-learning-view-model";

type UseProductLearningPageArgs = {
  readonly initialBundle: ProductLearningDashboardBundle | null;
  readonly initialFailure: ApiLoadFailureState | null;
};

export function useProductLearningPage(args: UseProductLearningPageArgs): ProductLearningPageViewModel {
  const router = useRouter();
  const pathname = usePathname() ?? PRODUCT_LEARNING_PATH;
  const searchParams = useSearchParams();
  const urlRange = parseProductLearningRangeFromSearch(searchParams.get("range"));
  const [range, setRangeState] = useState<ProductLearningTimeRangeKey>(urlRange);
  const [bundle, setBundle] = useState<ProductLearningDashboardBundle | null>(args.initialBundle);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(args.initialFailure);
  const skipInitialRangeFetchRef = useRef(true);

  useEffect(() => {
    setRangeState(urlRange);
  }, [urlRange]);

  const setRange: Dispatch<SetStateAction<ProductLearningTimeRangeKey>> = useCallback(
    (value) => {
      setRangeState((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        router.replace(productLearningRangeHrefFromSearch(searchParams.toString(), next, pathname), { scroll: false });

        return next;
      });
    },
    [pathname, router, searchParams],
  );

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

      if (range === "all") {
        return;
      }
    }

    void load();
  }, [load, range]);

  return {
    range,
    setRange,
    bundle,
    loading,
    failure,
    load,
  };
}
