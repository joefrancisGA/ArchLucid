"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  persistFindingsVisibilityPreferences,
  readFindingsVisibilityFromStorage,
  resolveFindingsVisibilityFlag,
  subscribeFindingsVisibilityChanges,
  syncFindingsVisibilityFromServer,
} from "@/lib/findings/findings-visibility-preference";
import {
  governanceFindingsHideGenericHrefFromSearch,
  parseGovernanceFindingsHideGenericFromSearch,
} from "@/lib/governance/governance-findings-hide-generic-url";

export type GovernanceFindingsHideGenericState = {
  readonly hideGenericLowDensity: boolean;
  readonly setHideGenericLowDensity: (next: boolean) => void;
};

export function useGovernanceFindingsHideGenericState(): GovernanceFindingsHideGenericState {
  const router = useRouter();
  const pathname = usePathname() ?? "";
  const searchParams = useSearchParams();
  const urlHideGeneric = parseGovernanceFindingsHideGenericFromSearch(searchParams.get("hideGeneric"));
  const hasUrlHideGeneric = searchParams.has("hideGeneric");
  const accountPrefs = readFindingsVisibilityFromStorage();
  const [hideGenericLowDensity, setHideGenericLowDensityState] = useState(() =>
    resolveFindingsVisibilityFlag(hasUrlHideGeneric, urlHideGeneric, accountPrefs.hideGenericEnabled),
  );

  useEffect(() => {
    void syncFindingsVisibilityFromServer();
  }, []);

  useEffect(() => {
    return subscribeFindingsVisibilityChanges(() => {
      if (!hasUrlHideGeneric) {
        setHideGenericLowDensityState(readFindingsVisibilityFromStorage().hideGenericEnabled);
      }
    });
  }, [hasUrlHideGeneric]);

  useEffect(() => {
    if (hasUrlHideGeneric) {
      setHideGenericLowDensityState(urlHideGeneric);
    }
  }, [hasUrlHideGeneric, urlHideGeneric]);

  const setHideGenericLowDensity = useCallback(
    (next: boolean) => {
      setHideGenericLowDensityState(next);
      router.replace(governanceFindingsHideGenericHrefFromSearch(searchParams.toString(), next, pathname), {
        scroll: false,
      });
      void persistFindingsVisibilityPreferences({
        ...readFindingsVisibilityFromStorage(),
        hideGenericEnabled: next,
      });
    },
    [pathname, router, searchParams],
  );

  return {
    hideGenericLowDensity,
    setHideGenericLowDensity,
  };
}
