"use client";

import { useCallback, useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/OperatorNavAuthorityProvider";
import {
  type PricingQuoteAgingDashboard,
  fetchPricingQuoteAgingDashboard,
} from "@/lib/pricing-quote-aging";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import type { PricingQuoteAgingPageServerLoad } from "./load-pricing-quote-aging-page-data";

export type PricingQuoteAgingPageSurface = "demo" | "authority_loading" | "forbidden" | "admin";

export type PricingQuoteAgingPageViewModel = {
  readonly surface: PricingQuoteAgingPageSurface;
  readonly loading: boolean;
  readonly data: PricingQuoteAgingDashboard | null;
  readonly error: string | null;
  readonly refresh: () => Promise<void>;
};

function resolveSurface(
  isDemo: boolean,
  isAuthorityLoading: boolean,
  isAdmin: boolean,
): PricingQuoteAgingPageSurface {
  if (isDemo) {
    return "demo";
  }

  if (isAuthorityLoading) {
    return "authority_loading";
  }

  if (!isAdmin) {
    return "forbidden";
  }

  return "admin";
}

export function usePricingQuoteAgingPage(
  loaded: PricingQuoteAgingPageServerLoad,
): PricingQuoteAgingPageViewModel {
  const isDemo = loaded.demo;
  const { callerAuthorityRank, isAuthorityLoading } = useOperatorNavAuthority();
  const isAdmin = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const surface = resolveSurface(isDemo, isAuthorityLoading, isAdmin);

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PricingQuoteAgingDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const next = await fetchPricingQuoteAgingDashboard();

      if (next === null) {
        setData(null);
        setError("Admin access required for pricing quote aging.");

        return;
      }

      setData(next);
    } catch {
      setData(null);
      setError("Could not load pricing quote aging.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isDemo || !isAdmin) {
      return;
    }

    void refresh();
  }, [isAdmin, isDemo, refresh]);

  return {
    surface,
    loading,
    data,
    error,
    refresh,
  };
}
