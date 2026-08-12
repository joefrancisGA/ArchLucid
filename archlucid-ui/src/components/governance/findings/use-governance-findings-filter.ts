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
import {
  riskRegisterFilterFromQuery,
  scopedRunIdFromQuery,
  type RiskRegisterFilter,
} from "@/lib/architecture-risk-register-page";

import {
  GOVERNANCE_FINDINGS_FILTER_PRESET_LABELS,
  loadGovernanceFindingsFilterPresets,
  saveGovernanceFindingsFilterPresets,
  type GovernanceFindingsFilterPreset,
} from "@/components/governance/findings/governance-findings-filter-presets";

function initialRegisterFilterFromUrlOrStorage(rawFilter: string | null): RiskRegisterFilter {
  if (rawFilter !== null && rawFilter.trim().length > 0) {
    return riskRegisterFilterFromQuery(rawFilter);
  }

  return readGovernanceFindingsQueueFacets().registerFilter;
}

export function useGovernanceFindingsFilter() {
  const searchParams = useSearchParams();
  const [registerFilter, setRegisterFilterState] = useState<RiskRegisterFilter>(() =>
    initialRegisterFilterFromUrlOrStorage(searchParams.get("filter")),
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
      patchGovernanceFindingsQueueFacets({ registerFilter: fromUrl });
    }

    setScopedRunId(scopedRunIdFromQuery(searchParams.get("runId")));
  }, [searchParams]);

  const setRegisterFilter = useCallback((next: RiskRegisterFilter): void => {
    setRegisterFilterState(next);
    patchGovernanceFindingsQueueFacets({ registerFilter: next });
  }, []);

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
