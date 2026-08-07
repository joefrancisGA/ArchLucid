"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useNavCallerAuthorityRank } from "@/components/OperatorNavAuthorityProvider";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { fetchRoiSummaryPageState } from "./fetch-roi-summary-page-state";
import type { RoiSummaryPageServerLoad } from "./load-roi-summary-page-data";
import type { RoiSummaryPageState } from "./roi-summary-page-types";
import type { RoiSummaryPageViewModel } from "./roi-summary-page-view-model";

export function useRoiSummaryPage(loaded: RoiSummaryPageServerLoad): RoiSummaryPageViewModel {
  const rank = useNavCallerAuthorityRank();
  const isAdmin = rank >= AUTHORITY_RANK.AdminAuthority;
  const demo = loaded.mode === "demo";

  const [state, setState] = useState<RoiSummaryPageState>(() =>
    demo ? { status: "loading" } : loaded.initialState,
  );

  const skipInitialClientFetchRef = useRef(loaded.mode === "live");

  const load = useCallback(async () => {
    setState({ status: "loading" });

    const next = await fetchRoiSummaryPageState();

    setState(next);
  }, []);

  useEffect(() => {
    if (demo) {
      return;
    }

    if (skipInitialClientFetchRef.current) {
      skipInitialClientFetchRef.current = false;

      return;
    }

    void load();
  }, [demo, load]);

  return {
    demo,
    isAdmin,
    state,
    load,
  };
}
