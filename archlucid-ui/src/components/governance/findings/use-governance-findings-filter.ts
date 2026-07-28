"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  readGroupByResourcePreference,
  writeGroupByResourcePreference,
} from "@/lib/governance-findings-group-by-resource-storage";
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

export function useGovernanceFindingsFilter() {
  const searchParams = useSearchParams();
  const [registerFilter, setRegisterFilter] = useState<RiskRegisterFilter>(() =>
    riskRegisterFilterFromQuery(searchParams.get("filter")),
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
    setRegisterFilter(riskRegisterFilterFromQuery(searchParams.get("filter")));
    setScopedRunId(scopedRunIdFromQuery(searchParams.get("runId")));
  }, [searchParams]);

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
