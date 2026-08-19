"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  readGroupByResourcePreference,
  writeGroupByResourcePreference,
} from "@/lib/governance/governance-findings-group-by-resource-storage";
import {
  patchGovernanceFindingsQueueFacets,
  readGovernanceFindingsQueueFacets,
} from "@/lib/governance/governance-findings-queue-facets-storage";
import type { GovernanceFindingsQueueMode } from "@/lib/governance/governance-findings-queue-mode";
import {
  riskRegisterFilterFromQuery,
  scopedRunIdFromQuery,
  type RiskRegisterFilter,
} from "@/lib/architecture/architecture-risk-register-page";

import {
  GOVERNANCE_FINDINGS_FILTER_PRESET_LABELS,
  loadGovernanceFindingsFilterPresets,
  saveGovernanceFindingsFilterPresets,
  type GovernanceFindingsFilterPreset,
} from "@/components/governance/findings/governance-findings-filter-presets";

function initialRegisterFilterFromUrlOrStorage(
  rawFilter: string | null,
  mode: GovernanceFindingsQueueMode,
): RiskRegisterFilter {
  if (rawFilter !== null && rawFilter.trim().length > 0) {
    return riskRegisterFilterFromQuery(rawFilter);
  }

  return readGovernanceFindingsQueueFacets(mode).registerFilter;
}

export type UseGovernanceFindingsFilterOptions = {
  readonly mode?: GovernanceFindingsQueueMode;
};

export function useGovernanceFindingsFilter(options?: UseGovernanceFindingsFilterOptions) {
  const mode = options?.mode ?? "tenant";
  const searchParams = useSearchParams();
  const [registerFilter, setRegisterFilterState] = useState<RiskRegisterFilter>(() =>
    initialRegisterFilterFromUrlOrStorage(searchParams.get("filter"), mode),
  );
  const [scopedRunId, setScopedRunId] = useState<string | null>(() =>
    scopedRunIdFromQuery(searchParams.get("runId")),
  );
  const [savedPresets, setSavedPresets] = useState<GovernanceFindingsFilterPreset[]>(() =>
    loadGovernanceFindingsFilterPresets(),
  );
  const [groupByResource, setGroupByResource] = useState(false);

  useEffect(() => {
    setGroupByResource(readGroupByResourcePreference());
  }, []);

  useEffect(() => {
    const rawFilter = searchParams.get("filter");

    if (rawFilter !== null && rawFilter.trim().length > 0) {
      const fromUrl = riskRegisterFilterFromQuery(rawFilter);

      setRegisterFilterState(fromUrl);
      patchGovernanceFindingsQueueFacets({ registerFilter: fromUrl }, mode);
    }

    setScopedRunId(scopedRunIdFromQuery(searchParams.get("runId")));
  }, [mode, searchParams]);

  const setRegisterFilter = useCallback((next: RiskRegisterFilter): void => {
    setRegisterFilterState(next);
    patchGovernanceFindingsQueueFacets({ registerFilter: next }, mode);
  }, [mode]);

  const saveCurrentFilterAsPreset = useCallback((): void => {
    if (registerFilter === "all") {
      return;
    }

    const label = GOVERNANCE_FINDINGS_FILTER_PRESET_LABELS[registerFilter];
    const alreadySaved = savedPresets.some((preset) => preset.filter === registerFilter);

    if (alreadySaved) {
      return;
    }

    const newPreset: GovernanceFindingsFilterPreset = {
      id: `${registerFilter}-${Date.now()}`,
      label,
      filter: registerFilter,
    };
    const updated = [...savedPresets, newPreset];

    setSavedPresets(updated);
    saveGovernanceFindingsFilterPresets(updated);
  }, [registerFilter, savedPresets]);

  const removePreset = useCallback((id: string): void => {
    setSavedPresets((current) => {
      const updated = current.filter((preset) => preset.id !== id);

      saveGovernanceFindingsFilterPresets(updated);

      return updated;
    });
  }, []);

  const toggleGroupByResource = useCallback((): void => {
    setGroupByResource((current) => {
      const next = !current;

      writeGroupByResourcePreference(next);

      return next;
    });
  }, []);

  return {
    registerFilter,
    setRegisterFilter,
    scopedRunId,
    savedPresets,
    saveCurrentFilterAsPreset,
    removePreset,
    groupByResource,
    toggleGroupByResource,
  };
}
