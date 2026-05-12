"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { fetchProductLearningDashboard } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import type { ProductLearningDashboardBundle } from "@/types/product-learning";

import { sinceIsoForRange } from "./product-learning-page-helpers";
import type { ProductLearningTimeRangeKey } from "./product-learning-types";
import type { ProductLearningPageViewModel } from "./product-learning-view-model";

export function useProductLearningPage(): ProductLearningPageViewModel {
  const router = useRouter();
  const demoMode = isNextPublicDemoMode();
  const [range, setRange] = useState<ProductLearningTimeRangeKey>("all");
  const [bundle, setBundle] = useState<ProductLearningDashboardBundle | null>(null);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);

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
    if (!demoMode) {
      return;
    }

    router.replace("/");
  }, [demoMode, router]);

  useEffect(() => {
    if (demoMode) {
      return;
    }

    void load();
  }, [demoMode, load]);

  return {
    demoMode,
    range,
    setRange,
    bundle,
    loading,
    failure,
    load,
  };
}
