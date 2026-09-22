"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  parseRemediationFactoryUrlStateFromSearch,
  remediationFactoryHrefFromSearch,
  remediationFactoryUrlStateToSearchParams,
  type RemediationFactoryUrlState,
} from "@/lib/remediation-factory/remediation-factory-url-state";

export function useRemediationFactoryUrlState(): {
  readonly state: RemediationFactoryUrlState;
  readonly replaceState: (patch: Partial<RemediationFactoryUrlState>) => void;
} {
  const router = useRouter();
  const pathname = usePathname() ?? "/governance/remediation-factory";
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const state = useMemo(
    () => parseRemediationFactoryUrlStateFromSearch(search),
    [search],
  );

  const replaceState = useCallback(
    (patch: Partial<RemediationFactoryUrlState>) => {
      const nextState: RemediationFactoryUrlState = {
        ...state,
        ...patch,
      };

      const params = remediationFactoryUrlStateToSearchParams(nextState, search);

      router.replace(remediationFactoryHrefFromSearch(pathname, params.toString()), { scroll: false });
    },
    [pathname, router, search, state],
  );

  return { state, replaceState };
}
