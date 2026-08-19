"use client";



import { useQuery } from "@tanstack/react-query";



import { getPilotScorecard } from "@/lib/api/pilots-marketing";

import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

import {

  OPERATOR_QUERY_GC_MS,

  OPERATOR_QUERY_STALE_MS,

} from "@/lib/query/operator-query-stale-time";

import type { PilotScorecardJson } from "@/types/pilot-scorecard";



type UsePilotScorecardQueryOptions = {

  readonly enabled?: boolean;

  readonly initialData?: PilotScorecardJson | null;

  /** When true, failed reads throw so surfaces can show API errors instead of null. */

  readonly throwOnError?: boolean;

};



export function usePilotScorecardQuery(options?: UsePilotScorecardQueryOptions) {

  const throwOnError = options?.throwOnError === true;

  const hasInitialData = options?.initialData !== undefined;



  return useQuery<PilotScorecardJson | null>({

    queryKey: operatorQueryKeys.pilotScorecard,

    queryFn: async () => {

      if (throwOnError) {

        return await getPilotScorecard();

      }



      try {

        return await getPilotScorecard();

      } catch {

        return null;

      }

    },

    initialData: options?.initialData,

    enabled: options?.enabled ?? true,

    staleTime: hasInitialData ? 0 : OPERATOR_QUERY_STALE_MS,

    gcTime: OPERATOR_QUERY_GC_MS,

    retry: false,

  });

}

