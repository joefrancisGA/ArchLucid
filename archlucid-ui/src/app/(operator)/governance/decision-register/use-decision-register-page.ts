"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useArchitectureDecisionRegisterQuery } from "@/hooks/use-architecture-decision-register-query";
import type {
  ArchitectureDecisionRegisterEntry,
  ArchitectureDecisionRegisterFilters,
} from "@/lib/api/governance-stickiness-api";
import { getEffectiveBrowserProxyScopeHeaders } from "@/lib/operator/operator-scope-storage";
import { projectIdFromScopeHeaders } from "@/lib/operator/operator-resource-scope";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { GOVERNANCE_DECISION_REGISTER_PATH } from "@/lib/governance/governance-route-paths";
import {
  decisionRegisterCategoryHrefFromSearch,
  parseDecisionRegisterCategoryFromSearch,
  parseDecisionRegisterConfidenceBasisFromSearch,
} from "@/lib/governance/decision-register-advanced-filters-url";
import {
  decisionRegisterMaxConfidenceHrefFromSearch,
  decisionRegisterMinConfidenceHrefFromSearch,
  parseDecisionRegisterMaxConfidenceFromSearch,
  parseDecisionRegisterMinConfidenceFromSearch,
} from "@/lib/governance/decision-register-confidence-band-url";
import { parseDecisionRegisterDatePresetFromSearch } from "@/lib/governance/decision-register-date-range-url";
import {
  decisionRegisterCustomDateHrefFromSearch,
  parseDecisionRegisterCustomDateFromSearch,
} from "@/lib/governance/decision-register-custom-date-url";
import { parseDecisionRegisterViewModeFromSearch } from "@/lib/governance/decision-register-view-url";
import {
  resolveDecisionRegisterFilterEmphasizedStepId,
  resolveDecisionRegisterFilterSteps,
} from "@/lib/decision-register-filter-checklist";
import { resolveContinueLastDecisionRegisterEntry } from "@/lib/resolve-continue-last-decision-register-entry";

import {
  DEFAULT_DECISION_REGISTER_DATE_PRESET,
  resolveDecisionRegisterDateRange,
} from "./decision-register-date-range";
import { deriveDecisionRegisterSummary } from "./decision-register-summary";

function matchesDecisionRegisterRunScope(
  decision: ArchitectureDecisionRegisterEntry,
  scopedRunId: string | null,
): boolean {
  if (scopedRunId === null || scopedRunId.trim().length === 0) {
    return true;
  }

  return decision.runId.trim() === scopedRunId.trim();
}

export function useDecisionRegisterPage() {
  const buyerPolishedShell = isBuyerPolishedOperatorShellEnv();
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.toString();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const datePreset = parseDecisionRegisterDatePresetFromSearch(searchParams.get("range"));
  const viewMode = parseDecisionRegisterViewModeFromSearch(searchParams.get("view"));
  const urlCategory = parseDecisionRegisterCategoryFromSearch(searchParams.get("category"));
  const urlConfidenceBasis = parseDecisionRegisterConfidenceBasisFromSearch(searchParams.get("basis"));
  const urlMinConfidence = parseDecisionRegisterMinConfidenceFromSearch(searchParams.get("minConfidence"));
  const urlMaxConfidence = parseDecisionRegisterMaxConfidenceFromSearch(searchParams.get("maxConfidence"));
  const urlFromUtc = parseDecisionRegisterCustomDateFromSearch(searchParams.get("from"));
  const urlToUtc = parseDecisionRegisterCustomDateFromSearch(searchParams.get("to"));
  const initialDateRange = useMemo(() => {
    if (urlFromUtc.length > 0 || urlToUtc.length > 0) {
      return {
        recordedAfter: urlFromUtc,
        recordedBefore: urlToUtc,
      };
    }

    return resolveDecisionRegisterDateRange(datePreset);
  }, [datePreset, urlFromUtc, urlToUtc]);
  const projectId = useMemo(
    () => projectIdFromScopeHeaders(getEffectiveBrowserProxyScopeHeaders()),
    [],
  );
  const [category, setCategory] = useState(urlCategory);
  const [recordedAfter, setRecordedAfter] = useState(initialDateRange.recordedAfter);
  const [recordedBefore, setRecordedBefore] = useState(initialDateRange.recordedBefore);
  const [minConfidence, setMinConfidence] = useState(urlMinConfidence);
  const [maxConfidence, setMaxConfidence] = useState(urlMaxConfidence);
  const [confidenceBasis, setConfidenceBasis] = useState(urlConfidenceBasis);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    setCategory(urlCategory);
  }, [urlCategory]);

  useEffect(() => {
    setConfidenceBasis(urlConfidenceBasis);
  }, [urlConfidenceBasis]);

  useEffect(() => {
    setMinConfidence(urlMinConfidence);
  }, [urlMinConfidence]);

  useEffect(() => {
    setMaxConfidence(urlMaxConfidence);
  }, [urlMaxConfidence]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      let nextHref = decisionRegisterMinConfidenceHrefFromSearch(searchParams.toString(), minConfidence);
      nextHref = decisionRegisterMaxConfidenceHrefFromSearch(
        nextHref.includes("?") ? nextHref.split("?")[1] ?? "" : "",
        maxConfidence,
      );

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [maxConfidence, minConfidence, router, searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = decisionRegisterCategoryHrefFromSearch(searchParams.toString(), category);

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [category, router, searchParams]);

  useEffect(() => {
    const urlFrom = parseDecisionRegisterCustomDateFromSearch(searchParams.get("from"));
    const urlTo = parseDecisionRegisterCustomDateFromSearch(searchParams.get("to"));

    if (urlFrom.length === 0 && urlTo.length === 0) {
      return;
    }

    setRecordedAfter(urlFrom);
    setRecordedBefore(urlTo);
  }, [searchParams]);

  useEffect(() => {
    const urlFrom = parseDecisionRegisterCustomDateFromSearch(searchParams.get("from"));
    const urlTo = parseDecisionRegisterCustomDateFromSearch(searchParams.get("to"));

    if (urlFrom.length > 0 || urlTo.length > 0) {
      return;
    }

    const range = resolveDecisionRegisterDateRange(datePreset);
    setRecordedAfter(range.recordedAfter);
    setRecordedBefore(range.recordedBefore);
  }, [datePreset, searchParams]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const nextHref = decisionRegisterCustomDateHrefFromSearch(
        searchParams.toString(),
        recordedAfter,
        recordedBefore,
      );

      if (`${window.location.pathname}${window.location.search}` !== nextHref) {
        router.replace(nextHref, { scroll: false });
      }
    }, 250);

    return () => {
      window.clearTimeout(handle);
    };
  }, [recordedAfter, recordedBefore, router, searchParams]);

  const retryLoad = useCallback(() => {
    setReloadToken((value) => value + 1);
  }, []);

  const filters = useMemo((): ArchitectureDecisionRegisterFilters => {
    const parsed: ArchitectureDecisionRegisterFilters = {};

    if (category.trim().length > 0) {
      parsed.category = category.trim();
    }

    if (recordedAfter.trim().length > 0) {
      parsed.recordedAfterUtc = new Date(recordedAfter).toISOString();
    }

    if (recordedBefore.trim().length > 0) {
      parsed.recordedBeforeUtc = new Date(recordedBefore).toISOString();
    }

    if (minConfidence.trim().length > 0) {
      parsed.minConfidence = Number(minConfidence);
    }

    if (maxConfidence.trim().length > 0) {
      parsed.maxConfidence = Number(maxConfidence);
    }

    if (confidenceBasis.trim().length > 0) {
      parsed.buyerConfidenceSource = confidenceBasis.trim();
    }

    return parsed;
  }, [category, confidenceBasis, maxConfidence, minConfidence, recordedAfter, recordedBefore]);

  const workspaceQuery = useArchitectureDecisionRegisterQuery(projectId ?? "");
  const filteredQuery = useArchitectureDecisionRegisterQuery(projectId ?? "", filters);

  useEffect(() => {
    if (reloadToken === 0) {
      return;
    }

    void workspaceQuery.refetch();
    void filteredQuery.refetch();
  }, [filteredQuery, reloadToken, workspaceQuery]);

  const workspaceDecisions = useMemo(
    () => [...(workspaceQuery.data?.decisions ?? [])] as ArchitectureDecisionRegisterEntry[],
    [workspaceQuery.data?.decisions],
  );
  const scopedWorkspaceDecisions = useMemo(
    () => workspaceDecisions.filter((decision) => matchesDecisionRegisterRunScope(decision, scopedRunId)),
    [scopedRunId, workspaceDecisions],
  );
  const filteredDecisions = useMemo((): ArchitectureDecisionRegisterEntry[] => {
    const decisions = [...(filteredQuery.data?.decisions ?? [])] as ArchitectureDecisionRegisterEntry[];

    return decisions.filter((decision) => matchesDecisionRegisterRunScope(decision, scopedRunId));
  }, [filteredQuery.data?.decisions, scopedRunId]);
  const loadError = workspaceQuery.isError
    ? (workspaceQuery.error instanceof Error ? workspaceQuery.error.message : "Failed to load decision register.")
    : filteredQuery.isError
      ? (filteredQuery.error instanceof Error ? filteredQuery.error.message : "Failed to load decision register.")
      : null;
  const loadingWorkspace = workspaceQuery.isPending;
  const loadingFiltered = filteredQuery.isPending;

  const summary = useMemo(
    () => deriveDecisionRegisterSummary(scopedWorkspaceDecisions),
    [scopedWorkspaceDecisions],
  );
  const continueLastDecision = useMemo(
    () => resolveContinueLastDecisionRegisterEntry(scopedWorkspaceDecisions),
    [scopedWorkspaceDecisions],
  );
  const collapseAdvancedFilters = scopedWorkspaceDecisions.length === 0;
  const loading = loadingWorkspace || loadingFiltered;
  const hasWorkspaceDecisions = scopedWorkspaceDecisions.length > 0;
  const hasFilteredResults = filteredDecisions.length > 0;
  const filtersExcludeMatches = hasWorkspaceDecisions && !hasFilteredResults && !loading && loadError === null;
  const filtersConfigured =
    category.trim().length > 0 ||
    minConfidence.trim().length > 0 ||
    maxConfidence.trim().length > 0 ||
    confidenceBasis.trim().length > 0 ||
    datePreset !== DEFAULT_DECISION_REGISTER_DATE_PRESET;
  const decisionRegisterFilterChecklistSteps = resolveDecisionRegisterFilterSteps({
    reviewPicked: scopedRunFilterActive,
    filtersConfigured,
    registerReviewed: scopedRunFilterActive && hasFilteredResults && !loading,
  });
  const decisionRegisterFilterChecklistEmphasizedStepId = resolveDecisionRegisterFilterEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    filtersConfigured,
    registerReviewed: scopedRunFilterActive && hasFilteredResults && !loading,
  });

  const onPickReviewForFiltering = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("runId", trimmed);
      router.replace(`${GOVERNANCE_DECISION_REGISTER_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const resetFilters = useCallback(() => {
    const range = resolveDecisionRegisterDateRange(DEFAULT_DECISION_REGISTER_DATE_PRESET);
    setCategory("");
    setRecordedAfter(range.recordedAfter);
    setRecordedBefore(range.recordedBefore);
    setMinConfidence("");
    setMaxConfidence("");
    setConfidenceBasis("");

    const params = new URLSearchParams(searchParams.toString());
    params.delete("range");
    params.delete("category");
    params.delete("basis");
    params.delete("from");
    params.delete("to");
    const nextQuery = params.toString();
    router.replace(
      nextQuery.length === 0 ? GOVERNANCE_DECISION_REGISTER_PATH : `${GOVERNANCE_DECISION_REGISTER_PATH}?${nextQuery}`,
      { scroll: false },
    );
  }, [router, searchParams]);

  const clearCustomDatePreset = useCallback(() => {
    const range = resolveDecisionRegisterDateRange(datePreset);
    setRecordedAfter(range.recordedAfter);
    setRecordedBefore(range.recordedBefore);
    router.replace(decisionRegisterCustomDateHrefFromSearch(searchParams.toString(), "", ""), { scroll: false });
  }, [datePreset, router, searchParams]);

  return {
    buyerPolishedShell,
    currentSearch,
    scopedRunId,
    scopedRunFilterActive,
    datePreset,
    viewMode,
    category,
    setCategory,
    recordedAfter,
    setRecordedAfter,
    recordedBefore,
    setRecordedBefore,
    minConfidence,
    setMinConfidence,
    maxConfidence,
    setMaxConfidence,
    confidenceBasis,
    setConfidenceBasis,
    retryLoad,
    summary,
    continueLastDecision,
    collapseAdvancedFilters,
    loading,
    hasWorkspaceDecisions,
    hasFilteredResults,
    filtersExcludeMatches,
    filteredDecisions,
    loadError,
    decisionRegisterFilterChecklistSteps,
    decisionRegisterFilterChecklistEmphasizedStepId,
    onPickReviewForFiltering,
    resetFilters,
    clearCustomDatePreset,
  };
}

export type DecisionRegisterPageViewModel = ReturnType<typeof useDecisionRegisterPage>;
