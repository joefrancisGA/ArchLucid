"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useId, useMemo, useRef, useState, type SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { useAdvisoryRecommendationsQuery } from "@/hooks/use-advisory-recommendations-query";
import { useOperatorScopeQueryKey } from "@/hooks/use-operator-scope-query-key";
import { useNavCallerAuthorityRank } from "@/components/operator/OperatorNavAuthorityProvider";
import { applyRecommendationAction, listRecommendations } from "@/lib/advisory-api";
import { resolveAdvisoryScansTriageFirstPending } from "@/lib/advisory/resolve-advisory-scans-triage-first-pending";
import { resolveCurrentProjectLabel } from "@/lib/advisory-schedule-page-model";
import { operatorQueryKeys } from "@/lib/query/operator-query-keys";
import {
  ADVISORY_SCANS_DISPOSITION_ACCEPT,
  ADVISORY_SCANS_DISPOSITION_DEFER,
  ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
  ADVISORY_SCANS_DISPOSITION_REJECT,
  ADVISORY_SCANS_GENERATE_DISABLED_HINT,
} from "@/lib/advisory-copy";
import { buildAdvisoryScanSummary } from "@/lib/advisory-scan-summary";
import {
  resolveAdvisoryScansScanEmphasizedStepId,
  resolveAdvisoryScansScanSteps,
} from "@/lib/advisory-scans-scan-checklist";
import { getImprovementPlan } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { showSuccess } from "@/lib/toast";
import { buildAdvisoryHubHref } from "@/lib/advisory-hub-href";
import {
  advisoryScansFilterHrefFromSearch,
  parseAdvisoryScansCompareToFromSearch,
  parseAdvisoryScansRunIdFromSearch,
  parseAdvisoryScansSamplePreviewFromSearch,
} from "@/lib/advisory/advisory-scans-filter-url";
import {
  advisoryScansDispositionConfirmHrefFromSearch,
  advisoryScansDispositionToUrlAction,
  advisoryScansUrlActionToDisposition,
  parseAdvisoryScansDispActionFromSearch,
  parseAdvisoryScansDispRecIdFromSearch,
} from "@/lib/advisory/advisory-scans-disposition-confirm-url";
import { GOVERNANCE_ADVISORY_SCANS_PATH } from "@/lib/governance/governance-route-paths";
import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT,
  readOperatorScopeFromStorage,
} from "@/lib/operator/operator-scope-storage";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import type { ImprovementPlan, RecommendationImproveLoopEvidence, RecommendationRecord } from "@/types/advisory";

export type AdvisoryScansContentProps = {
  /** Optional product-run scope from `?runId=` deep links. */
  readonly initialRunId?: string | null;
};

const DISPOSITION_ACTION_LABELS: Readonly<Record<string, string>> = {
  Accept: ADVISORY_SCANS_DISPOSITION_ACCEPT,
  Defer: ADVISORY_SCANS_DISPOSITION_DEFER,
  Reject: ADVISORY_SCANS_DISPOSITION_REJECT,
  MarkImplemented: ADVISORY_SCANS_DISPOSITION_IMPLEMENTED,
};

export function dispositionActionLabel(action: string): string {
  return DISPOSITION_ACTION_LABELS[action] ?? action;
}

export function useAdvisoryScansContent(props: AdvisoryScansContentProps = {}) {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_ADVISORY_SCANS_PATH;
  const searchParams = useSearchParams();
  const callerAuthorityRank = useNavCallerAuthorityRank();
  const isAdminCaller = callerAuthorityRank >= AUTHORITY_RANK.AdminAuthority;
  const bootstrappedRunId = (props.initialRunId ?? "").trim();
  const urlRunId = parseAdvisoryScansRunIdFromSearch(searchParams.get("runId"));
  const urlCompareTo = parseAdvisoryScansCompareToFromSearch(searchParams.get("compareTo"));
  const urlSamplePreview = parseAdvisoryScansSamplePreviewFromSearch(searchParams.get("sample"));
  const dispRecIdParam = searchParams.get("dispRecId");
  const dispActionParam = searchParams.get("dispAction");

  const onPickReview = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      router.push(buildAdvisoryHubHref({ pathname, tab: "scans", runId: trimmed }));
    },
    [pathname, router],
  );

  const scansClearScopeHref = buildAdvisoryHubHref({ pathname, tab: "scans", runId: null });
  const queryClient = useQueryClient();
  const scope = useOperatorScopeQueryKey();
  const generateDisabledHintId = useId();
  const samplePreviewRegionId = useId();
  const samplePreviewTriggerId = useId();
  const samplePreviewRegionRef = useRef<HTMLDivElement>(null);

  const [runId, setRunIdState] = useState(urlRunId.length > 0 ? urlRunId : bootstrappedRunId);
  const [compareToRunId, setCompareToRunIdState] = useState(urlCompareTo);
  const [planSummary, setPlanSummary] = useState<ImprovementPlan | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [showSamplePreview, setShowSamplePreviewState] = useState(urlSamplePreview);
  const [pendingDisposition, setPendingDispositionState] = useState<{
    readonly recommendationId: string;
    readonly action: string;
  } | null>(null);
  const syncDispositionConfirmToUrl = useCallback(
    (state: { readonly recommendationId: string; readonly action: string } | null) => {
      const urlAction = state === null ? null : advisoryScansDispositionToUrlAction(state.action);

      router.replace(
        advisoryScansDispositionConfirmHrefFromSearch(
          searchParams.toString(),
          state === null || urlAction === null
            ? { recommendationId: null, action: null }
            : { recommendationId: state.recommendationId, action: urlAction },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setPendingDisposition = useCallback(
    (value: SetStateAction<{ readonly recommendationId: string; readonly action: string } | null>) => {
      setPendingDispositionState((current) => {
        const next = typeof value === "function" ? value(current) : value;
        syncDispositionConfirmToUrl(next);

        return next;
      });
    },
    [syncDispositionConfirmToUrl],
  );

  useEffect(() => {
    const recommendationId = parseAdvisoryScansDispRecIdFromSearch(dispRecIdParam);
    const action = parseAdvisoryScansDispActionFromSearch(dispActionParam);

    if (recommendationId.length === 0 || action === null) {
      setPendingDispositionState(null);

      return;
    }

    if (recommendations.length === 0) {
      return;
    }

    const recommendation = recommendations.find((row) => row.recommendationId === recommendationId);

    if (recommendation === undefined) {
      return;
    }

    const apiAction = advisoryScansUrlActionToDisposition(action);

    if (
      pendingDisposition?.recommendationId === recommendationId
      && pendingDisposition.action === apiAction
    ) {
      return;
    }

    setPendingDispositionState({ recommendationId, action: apiAction });
  }, [dispActionParam, dispRecIdParam, pendingDisposition?.action, pendingDisposition?.recommendationId, recommendations]);

  const [dispositionBusy, setDispositionBusy] = useState(false);
  const [dispositionError, setDispositionError] = useState<string | null>(null);
  const [lastImproveLoopEvidence, setLastImproveLoopEvidence] =
    useState<RecommendationImproveLoopEvidence | null>(null);
  const [projectLabel, setProjectLabel] = useState("Current project");
  const [lastLoadedUtc, setLastLoadedUtc] = useState<string | null>(null);
  const bootstrapRecommendationsQuery = useAdvisoryRecommendationsQuery(bootstrappedRunId, {
    enabled: bootstrappedRunId.length > 0,
  });

  const syncScansFiltersToUrl = useCallback(
    (patch: {
      readonly runId?: string;
      readonly compareToRunId?: string;
      readonly showSamplePreview?: boolean;
    }) => {
      router.replace(advisoryScansFilterHrefFromSearch(searchParams.toString(), patch, pathname), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const setRunId = useCallback(
    (next: string | ((prev: string) => string)) => {
      setRunIdState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        syncScansFiltersToUrl({ runId: resolved });

        return resolved;
      });
    },
    [syncScansFiltersToUrl],
  );

  const setCompareToRunId = useCallback(
    (next: string | ((prev: string) => string)) => {
      setCompareToRunIdState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        syncScansFiltersToUrl({ compareToRunId: resolved });

        return resolved;
      });
    },
    [syncScansFiltersToUrl],
  );

  useEffect(() => {
    if (searchParams.has("runId")) {
      setRunIdState(parseAdvisoryScansRunIdFromSearch(searchParams.get("runId")));
    }

    setCompareToRunIdState(parseAdvisoryScansCompareToFromSearch(searchParams.get("compareTo")));
    setShowSamplePreviewState(parseAdvisoryScansSamplePreviewFromSearch(searchParams.get("sample")));
  }, [searchParams]);

  const syncProjectContext = useCallback(() => {
    const operatorScope = readOperatorScopeFromStorage();
    setProjectLabel(resolveCurrentProjectLabel(operatorScope?.projectLabel));
  }, []);

  useEffect(() => {
    syncProjectContext();

    const onScopeChanged = () => {
      syncProjectContext();
      setPlanSummary(null);
      setRecommendations([]);
      setLastLoadedUtc(null);
      setFailure(null);
      setShowSamplePreviewState(false);
      syncScansFiltersToUrl({ showSamplePreview: false });
      void queryClient.invalidateQueries({
        queryKey: ["operator", "advisory", "recommendations", scope],
      });
    };

    window.addEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);

    return () => {
      window.removeEventListener(ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT, onScopeChanged);
    };
  }, [queryClient, scope, syncProjectContext, syncScansFiltersToUrl]);

  useEffect(() => {
    if (bootstrappedRunId.length === 0) {
      return;
    }

    if (bootstrapRecommendationsQuery.isPending) {
      setLoading(true);
    }
  }, [bootstrappedRunId, bootstrapRecommendationsQuery.isPending]);

  const reviewSelected = runId.trim().length > 0;
  const hasResults = planSummary !== null || recommendations.length > 0;
  const advisoryScanChecklistSteps = resolveAdvisoryScansScanSteps({
    reviewPicked: reviewSelected,
    scanConfigured: reviewSelected,
    scanComplete: hasResults || lastLoadedUtc !== null,
  });
  const advisoryScanChecklistEmphasizedStepId = resolveAdvisoryScansScanEmphasizedStepId({
    reviewPicked: reviewSelected,
    scanConfigured: reviewSelected,
    scanComplete: hasResults || lastLoadedUtc !== null,
  });
  const generateDisabledReason: WhyDisabledCtaReason | null = reviewSelected
    ? null
    : { kind: "prerequisite", message: ADVISORY_SCANS_GENERATE_DISABLED_HINT };

  useEffect(() => {
    if (hasResults) {
      setShowSamplePreviewState(false);
      syncScansFiltersToUrl({ showSamplePreview: false });
    }
  }, [hasResults, syncScansFiltersToUrl]);

  useEffect(() => {
    const next = (props.initialRunId ?? "").trim();

    if (next.length === 0) {
      return;
    }

    setRunId(next);
  }, [props.initialRunId, setRunId]);

  useEffect(() => {
    if (bootstrapRecommendationsQuery.data === undefined) {
      return;
    }

    setRecommendations(bootstrapRecommendationsQuery.data.recommendations);
    setLastImproveLoopEvidence(bootstrapRecommendationsQuery.data.improveLoopEvidence ?? null);
    setLoading(false);
    setLastLoadedUtc(new Date().toISOString());
  }, [bootstrapRecommendationsQuery.data]);

  useEffect(() => {
    if (!bootstrapRecommendationsQuery.isError) {
      return;
    }

    setFailure(toApiLoadFailure(bootstrapRecommendationsQuery.error));
    setLoading(false);
  }, [bootstrapRecommendationsQuery.error, bootstrapRecommendationsQuery.isError]);

  useEffect(() => {
    if (!showSamplePreview) {
      return;
    }

    const region = samplePreviewRegionRef.current;

    if (region === null) {
      return;
    }

    region.scrollIntoView({ behavior: "smooth", block: "start" });
    region.focus({ preventScroll: true });
  }, [showSamplePreview]);

  const fetchPersistedRecommendations = useCallback(
    async (rid: string): Promise<RecommendationRecord[]> => {
      const queryKey = operatorQueryKeys.advisoryRecommendations(scope, rid);

      await queryClient.invalidateQueries({ queryKey });

      const data = await queryClient.fetchQuery({
        queryKey,
        queryFn: () => listRecommendations(rid),
        staleTime: 0,
      });

      setLastImproveLoopEvidence(data.improveLoopEvidence ?? null);

      return data.recommendations;
    },
    [queryClient, scope],
  );

  const scanSummary = useMemo(
    () => buildAdvisoryScanSummary(recommendations, planSummary, compareToRunId),
    [compareToRunId, planSummary, recommendations],
  );
  const triageFirstPending = useMemo(
    () => resolveAdvisoryScansTriageFirstPending(recommendations),
    [recommendations],
  );

  const submitDisposition = useCallback(
    async (comment: string, rationale: string): Promise<void> => {
      if (pendingDisposition === null) {
        return;
      }

      setDispositionBusy(true);
      setDispositionError(null);
      setFailure(null);

      try {
        const actionResult = await applyRecommendationAction(
          pendingDisposition.recommendationId,
          pendingDisposition.action,
          comment,
          rationale,
        );

        if (actionResult.improveLoop) {
          setLastImproveLoopEvidence(actionResult.improveLoop);
        }

        if (actionResult.improveLoop?.mergedFindingIds?.length) {
          showSuccess(
            `Improve loop merged ${actionResult.improveLoop.mergedFindingIds.length} finding(s) into the review snapshot.`,
          );
        } else if (actionResult.improveLoop?.fullReReviewTriggered) {
          showSuccess("Improve loop triggered a full architecture re-review.");
        }

        const rid = runId.trim();

        if (rid.length > 0) {
          const refreshed = await fetchPersistedRecommendations(rid);
          setRecommendations(refreshed);
          setLastLoadedUtc(new Date().toISOString());
        }

        setPendingDisposition(null);
      } catch (error) {
        setDispositionError(toApiLoadFailure(error).message);
      } finally {
        setDispositionBusy(false);
      }
    },
    [fetchPersistedRecommendations, pendingDisposition, runId],
  );

  const loadAdvice = useCallback(async () => {
    const rid = runId.trim();

    if (rid.length === 0) {
      return;
    }

    setLoading(true);
    setFailure(null);

    try {
      const data = await getImprovementPlan(rid, compareToRunId.trim() || undefined);
      setPlanSummary(data);
      const persisted = await fetchPersistedRecommendations(rid);
      setRecommendations(persisted);
      setLastLoadedUtc(new Date().toISOString());
    } catch (error) {
      setFailure(toApiLoadFailure(error));
      setPlanSummary(null);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }, [compareToRunId, fetchPersistedRecommendations, runId]);

  const refreshPersistedOnly = useCallback(async () => {
    const rid = runId.trim();

    if (rid.length === 0) {
      return;
    }

    setLoading(true);
    setFailure(null);

    try {
      const persisted = await fetchPersistedRecommendations(rid);
      setRecommendations(persisted);
      setLastLoadedUtc(new Date().toISOString());
    } catch (error) {
      setFailure(toApiLoadFailure(error));
    } finally {
      setLoading(false);
    }
  }, [fetchPersistedRecommendations, runId]);

  const toggleSamplePreview = useCallback((): void => {
    setShowSamplePreviewState((current) => {
      const next = !current;
      syncScansFiltersToUrl({ showSamplePreview: next });

      return next;
    });
  }, [syncScansFiltersToUrl]);

  return {
    bootstrappedRunId,
    onPickReview,
    scansClearScopeHref,
    generateDisabledHintId,
    samplePreviewRegionId,
    samplePreviewTriggerId,
    samplePreviewRegionRef,
    runId,
    setRunId,
    compareToRunId,
    setCompareToRunId,
    planSummary,
    recommendations,
    loading,
    failure,
    showSamplePreview,
    pendingDisposition,
    setPendingDisposition,
    dispositionBusy,
    dispositionError,
    setDispositionError,
    lastImproveLoopEvidence,
    projectLabel,
    lastLoadedUtc,
    isAdminCaller,
    reviewSelected,
    hasResults,
    advisoryScanChecklistSteps,
    advisoryScanChecklistEmphasizedStepId,
    generateDisabledReason,
    scanSummary,
    triageFirstPending,
    submitDisposition,
    loadAdvice,
    refreshPersistedOnly,
    toggleSamplePreview,
  };
}

export type AdvisoryScansContentState = ReturnType<typeof useAdvisoryScansContent>;
