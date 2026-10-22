"use client";

import { listRunsByProjectPaged } from "@/lib/api";
import { createOperatorQueryHook } from "@/lib/query/create-operator-query-hook";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";

export type NewRunWizardCommittedProbeResult = {
  readonly hasCommittedManifest: boolean;
};

type UseNewRunWizardCommittedProbeQueryOptions = {
  readonly enabled?: boolean;
};

export function useNewRunWizardCommittedProbeQuery(options?: UseNewRunWizardCommittedProbeQueryOptions) {
  return createOperatorQueryHook<NewRunWizardCommittedProbeResult>({
    queryKey: operatorQueryKeys.newRunWizardCommittedProbe,
    queryFn: async () => {
      const page = await listRunsByProjectPaged("default", 1, 50);

      return {
        hasCommittedManifest: page.items.some((run) => run.hasGoldenManifest === true),
      };
    },
    enabled: options?.enabled ?? true,
  });
}
