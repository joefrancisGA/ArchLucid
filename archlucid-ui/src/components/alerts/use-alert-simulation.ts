"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

import { useOperateCapability } from "@/hooks/use-operate-capability";
import { compareAlertRuleCandidates, simulateAlertRule } from "@/lib/api";
import {
  alertSimulationModeHrefFromSearch,
  parseAlertSimulationModeFromSearch,
} from "@/lib/alerts/alert-simulation-mode-url";
import {
  alertSimulationScopeHrefFromSearch,
  parseAlertSimulationCompareRunIdFromSearch,
  parseAlertSimulationProjectSlugFromSearch,
  parseAlertSimulationRunIdFromSearch,
} from "@/lib/alerts/alert-simulation-scope-url";
import {
  isAlertSimulationRecentCountValid,
  isAlertSimulationThresholdValid,
  resolveAlertSimulationRunProjectSlug,
  type AlertSimulationModeTabId,
} from "@/lib/alert-simulation-form";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type {
  RuleCandidateComparisonResult,
  RuleSimulationResult,
} from "@/types/alert-simulation";
import { GOVERNANCE_ALERT_RULES_PATH } from "@/lib/governance/governance-route-paths";

function parseOptionalGuid(s: string): string | undefined {
  const t = s.trim();

  // Blank after trim means omit this optional GUID from the request.
  if (!t) {
    return undefined;
  }

  return t;
}

function resolveRunProjectSlug(typedSlug: string): string {
  return resolveAlertSimulationRunProjectSlug(
    typedSlug,
    readOperatorScopeFromStorage()?.projectId,
  );
}

export type AlertSimulationModel = {
  readonly canMutateEnterpriseShell: boolean;
  readonly tab: AlertSimulationModeTabId;
  readonly setTab: Dispatch<SetStateAction<AlertSimulationModeTabId>>;
  readonly loading: boolean;
  readonly failure: ApiLoadFailureState | null;
  readonly simpleResult: RuleSimulationResult | null;
  readonly compositeResult: RuleSimulationResult | null;
  readonly compareResult: RuleCandidateComparisonResult | null;
  readonly sName: string;
  readonly setSName: Dispatch<SetStateAction<string>>;
  readonly sRuleType: string;
  readonly setSRuleType: Dispatch<SetStateAction<string>>;
  readonly sSeverity: string;
  readonly setSSeverity: Dispatch<SetStateAction<string>>;
  readonly sThreshold: number;
  readonly setSThreshold: Dispatch<SetStateAction<number>>;
  readonly sRecent: number;
  readonly setSRecent: Dispatch<SetStateAction<number>>;
  readonly sSlug: string;
  readonly setSSlug: Dispatch<SetStateAction<string>>;
  readonly sRunId: string;
  readonly setSRunId: Dispatch<SetStateAction<string>>;
  readonly sCompareRun: string;
  readonly setSCompareRun: Dispatch<SetStateAction<string>>;
  readonly sUseHistory: boolean;
  readonly setSUseHistory: Dispatch<SetStateAction<boolean>>;
  readonly sRecentTouched: boolean;
  readonly setSRecentTouched: Dispatch<SetStateAction<boolean>>;
  readonly sThresholdTouched: boolean;
  readonly setSThresholdTouched: Dispatch<SetStateAction<boolean>>;
  readonly sScopeTouched: boolean;
  readonly setSScopeTouched: Dispatch<SetStateAction<boolean>>;
  readonly hasSpecificReviewId: boolean;
  readonly recentCountValid: boolean;
  readonly thresholdValid: boolean;
  readonly reviewScopeValid: boolean;
  readonly simpleFormValid: boolean;
  readonly cName: string;
  readonly setCName: Dispatch<SetStateAction<string>>;
  readonly cSeverity: string;
  readonly setCSeverity: Dispatch<SetStateAction<string>>;
  readonly cJoin: string;
  readonly setCJoin: Dispatch<SetStateAction<string>>;
  readonly cSuppression: number;
  readonly setCSuppression: Dispatch<SetStateAction<number>>;
  readonly cCooldown: number;
  readonly setCCooldown: Dispatch<SetStateAction<number>>;
  readonly cDedupe: string;
  readonly setCDedupe: Dispatch<SetStateAction<string>>;
  readonly cRecent: number;
  readonly setCRecent: Dispatch<SetStateAction<number>>;
  readonly cSlug: string;
  readonly setCSlug: Dispatch<SetStateAction<string>>;
  readonly cM1: string;
  readonly setCM1: Dispatch<SetStateAction<string>>;
  readonly cO1: string;
  readonly setCO1: Dispatch<SetStateAction<string>>;
  readonly cV1: number;
  readonly setCV1: Dispatch<SetStateAction<number>>;
  readonly cM2: string;
  readonly setCM2: Dispatch<SetStateAction<string>>;
  readonly cO2: string;
  readonly setCO2: Dispatch<SetStateAction<string>>;
  readonly cV2: number;
  readonly setCV2: Dispatch<SetStateAction<number>>;
  readonly cmpName: string;
  readonly setCmpName: Dispatch<SetStateAction<string>>;
  readonly cmpRuleType: string;
  readonly setCmpRuleType: Dispatch<SetStateAction<string>>;
  readonly cmpSeverity: string;
  readonly setCmpSeverity: Dispatch<SetStateAction<string>>;
  readonly cmpA: number;
  readonly setCmpA: Dispatch<SetStateAction<number>>;
  readonly cmpB: number;
  readonly setCmpB: Dispatch<SetStateAction<number>>;
  readonly cmpRecent: number;
  readonly setCmpRecent: Dispatch<SetStateAction<number>>;
  readonly cmpSlug: string;
  readonly setCmpSlug: Dispatch<SetStateAction<string>>;
  readonly runSimple: () => Promise<void>;
  readonly runComposite: () => Promise<void>;
  readonly runCompare: () => Promise<void>;
};

/** Controller: alert simulation form state and run/compare actions. */
export function useAlertSimulation(): AlertSimulationModel {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_ALERT_RULES_PATH;
  const searchParams = useSearchParams();
  const canMutateEnterpriseShell = useOperateCapability();
  const urlTab = parseAlertSimulationModeFromSearch(searchParams.get("simMode"));
  const urlRunId = parseAlertSimulationRunIdFromSearch(searchParams.get("simRunId"));
  const urlCompareRun = parseAlertSimulationCompareRunIdFromSearch(searchParams.get("simCompareRun"));
  const urlSlug = parseAlertSimulationProjectSlugFromSearch(searchParams.get("simSlug"));
  const [tab, setTabState] = useState<AlertSimulationModeTabId>(urlTab);

  const setTab: Dispatch<SetStateAction<AlertSimulationModeTabId>> = useCallback(
    (next) => {
      setTabState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        router.replace(alertSimulationModeHrefFromSearch(searchParams.toString(), resolved), { scroll: false });

        return resolved;
      });
    },
    [router, searchParams],
  );

  useEffect(() => {
    setTabState(parseAlertSimulationModeFromSearch(searchParams.get("simMode")));
  }, [searchParams]);

  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [simpleResult, setSimpleResult] = useState<RuleSimulationResult | null>(null);
  const [compositeResult, setCompositeResult] = useState<RuleSimulationResult | null>(null);
  const [compareResult, setCompareResult] = useState<RuleCandidateComparisonResult | null>(null);

  // Simple
  const [sName, setSName] = useState("Dry-run rule");
  const [sRuleType, setSRuleType] = useState("CostIncreasePercent");
  const [sSeverity, setSSeverity] = useState("Warning");
  const [sThreshold, setSThreshold] = useState(15);
  const [sRecent, setSRecent] = useState(10);
  const [sSlug, setSSlugState] = useState(urlSlug);
  const [sRunId, setSRunIdState] = useState(urlRunId);
  const [sCompareRun, setSCompareRunState] = useState(urlCompareRun);
  const [sUseHistory, setSUseHistory] = useState(true);
  const [sRecentTouched, setSRecentTouched] = useState(false);
  const [sThresholdTouched, setSThresholdTouched] = useState(false);
  const [sScopeTouched, setSScopeTouched] = useState(false);

  const hasSpecificReviewId = sRunId.trim().length > 0;
  const recentCountValid =
    hasSpecificReviewId || isAlertSimulationRecentCountValid(sRecent);
  const thresholdValid = isAlertSimulationThresholdValid(sThreshold);
  const reviewScopeValid = hasSpecificReviewId || sUseHistory;
  const simpleFormValid = recentCountValid && thresholdValid && reviewScopeValid;

  // Composite
  const [cName, setCName] = useState("Composite dry-run");
  const [cSeverity, setCSeverity] = useState("High");
  const [cJoin, setCJoin] = useState("And");
  const [cSuppression, setCSuppression] = useState(1440);
  const [cCooldown, setCCooldown] = useState(60);
  const [cDedupe, setCDedupe] = useState("RuleAndRun");
  const [cRecent, setCRecent] = useState(10);
  const [cSlug, setCSlugState] = useState(urlSlug);
  const [cM1, setCM1] = useState("CostIncreasePercent");
  const [cO1, setCO1] = useState("GreaterThanOrEqual");
  const [cV1, setCV1] = useState(15);
  const [cM2, setCM2] = useState("NewComplianceGapCount");
  const [cO2, setCO2] = useState("GreaterThanOrEqual");
  const [cV2, setCV2] = useState(1);

  // Compare simple
  const [cmpName, setCmpName] = useState("Threshold compare");
  const [cmpRuleType, setCmpRuleType] = useState("CostIncreasePercent");
  const [cmpSeverity, setCmpSeverity] = useState("Warning");
  const [cmpA, setCmpA] = useState(10);
  const [cmpB, setCmpB] = useState(20);
  const [cmpRecent, setCmpRecent] = useState(10);
  const [cmpSlug, setCmpSlugState] = useState(urlSlug);

  const syncScopeToUrlRef = useRef<number | null>(null);

  const syncScopeToUrl = useCallback(
    (scope: { runId: string; compareRunId: string; projectSlug: string }) => {
      router.replace(alertSimulationScopeHrefFromSearch(searchParams.toString(), scope, pathname), { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const scheduleScopeSync = useCallback(
    (scope: { runId: string; compareRunId: string; projectSlug: string }) => {
      if (syncScopeToUrlRef.current !== null) {
        window.clearTimeout(syncScopeToUrlRef.current);
      }

      syncScopeToUrlRef.current = window.setTimeout(() => {
        syncScopeToUrl(scope);
      }, 250);
    },
    [syncScopeToUrl],
  );

  const setSRunId: Dispatch<SetStateAction<string>> = useCallback(
    (next) => {
      setSRunIdState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        scheduleScopeSync({ runId: resolved, compareRunId: sCompareRun, projectSlug: sSlug });

        return resolved;
      });
    },
    [sCompareRun, sSlug, scheduleScopeSync],
  );

  const setSCompareRun: Dispatch<SetStateAction<string>> = useCallback(
    (next) => {
      setSCompareRunState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        scheduleScopeSync({ runId: sRunId, compareRunId: resolved, projectSlug: sSlug });

        return resolved;
      });
    },
    [sRunId, sSlug, scheduleScopeSync],
  );

  const setSSlug: Dispatch<SetStateAction<string>> = useCallback(
    (next) => {
      setSSlugState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        scheduleScopeSync({ runId: sRunId, compareRunId: sCompareRun, projectSlug: resolved });
        setCSlugState(resolved);
        setCmpSlugState(resolved);

        return resolved;
      });
    },
    [sCompareRun, sRunId, scheduleScopeSync],
  );

  const setCSlug: Dispatch<SetStateAction<string>> = useCallback(
    (next) => {
      setCSlugState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        scheduleScopeSync({ runId: sRunId, compareRunId: sCompareRun, projectSlug: resolved });
        setSSlugState(resolved);
        setCmpSlugState(resolved);

        return resolved;
      });
    },
    [sCompareRun, sRunId, scheduleScopeSync],
  );

  const setCmpSlug: Dispatch<SetStateAction<string>> = useCallback(
    (next) => {
      setCmpSlugState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        scheduleScopeSync({ runId: sRunId, compareRunId: sCompareRun, projectSlug: resolved });
        setSSlugState(resolved);
        setCSlugState(resolved);

        return resolved;
      });
    },
    [sCompareRun, sRunId, scheduleScopeSync],
  );

  useEffect(() => {
    setSRunIdState(parseAlertSimulationRunIdFromSearch(searchParams.get("simRunId")));
    setSCompareRunState(parseAlertSimulationCompareRunIdFromSearch(searchParams.get("simCompareRun")));
    const slug = parseAlertSimulationProjectSlugFromSearch(searchParams.get("simSlug"));
    setSSlugState(slug);
    setCSlugState(slug);
    setCmpSlugState(slug);
  }, [searchParams]);

  useEffect(
    () => () => {
      if (syncScopeToUrlRef.current !== null) {
        window.clearTimeout(syncScopeToUrlRef.current);
      }
    },
    [],
  );

  async function runSimple() {
    if (!simpleFormValid) {
      return;
    }

    setLoading(true);
    setFailure(null);
    setSimpleResult(null);
    try {
      const runId = parseOptionalGuid(sRunId);
      // Compared-to review ID is only sent when a specific review ID is present.
      const comparedToRunId = runId ? parseOptionalGuid(sCompareRun) : undefined;
      const res = await simulateAlertRule({
        ruleKind: "Simple",
        simpleRule: {
          ruleId: "00000000-0000-0000-0000-000000000000",
          tenantId: "00000000-0000-0000-0000-000000000000",
          workspaceId: "00000000-0000-0000-0000-000000000000",
          projectId: "00000000-0000-0000-0000-000000000000",
          name: sName.trim() || "Rule",
          ruleType: sRuleType,
          severity: sSeverity,
          thresholdValue: sThreshold,
          isEnabled: true,
          targetChannelType: "DigestOnly",
          metadataJson: "{}",
          createdUtc: new Date().toISOString(),
        },
        runId: runId ?? null,
        comparedToRunId: comparedToRunId ?? null,
        recentRunCount: sRecent,
        useHistoricalWindow: sUseHistory,
        runProjectSlug: resolveRunProjectSlug(sSlug),
      });
      setSimpleResult(res);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }

  async function runComposite() {
    setLoading(true);
    setFailure(null);
    setCompositeResult(null);
    try {
      const res = await simulateAlertRule({
        ruleKind: "Composite",
        compositeRule: {
          compositeRuleId: "00000000-0000-0000-0000-000000000000",
          tenantId: "00000000-0000-0000-0000-000000000000",
          workspaceId: "00000000-0000-0000-0000-000000000000",
          projectId: "00000000-0000-0000-0000-000000000000",
          name: cName.trim() || "Composite",
          severity: cSeverity,
          operator: cJoin,
          isEnabled: true,
          suppressionWindowMinutes: cSuppression,
          cooldownMinutes: cCooldown,
          reopenDeltaThreshold: 0,
          dedupeScope: cDedupe,
          targetChannelType: "AlertRouting",
          createdUtc: new Date().toISOString(),
          conditions: [
            { metricType: cM1, operator: cO1, thresholdValue: cV1 },
            { metricType: cM2, operator: cO2, thresholdValue: cV2 },
          ],
        },
        recentRunCount: cRecent,
        useHistoricalWindow: true,
        runProjectSlug: resolveRunProjectSlug(cSlug),
      });
      setCompositeResult(res);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }

  async function runCompare() {
    setLoading(true);
    setFailure(null);
    setCompareResult(null);
    try {
      const base = {
        ruleId: "00000000-0000-0000-0000-000000000000",
        tenantId: "00000000-0000-0000-0000-000000000000",
        workspaceId: "00000000-0000-0000-0000-000000000000",
        projectId: "00000000-0000-0000-0000-000000000000",
        name: cmpName.trim() || "Candidate",
        ruleType: cmpRuleType,
        severity: cmpSeverity,
        isEnabled: true,
        targetChannelType: "DigestOnly",
        metadataJson: "{}",
        createdUtc: new Date().toISOString(),
      };
      const res = await compareAlertRuleCandidates({
        ruleKind: "Simple",
        candidateA_SimpleRule: { ...base, thresholdValue: cmpA },
        candidateB_SimpleRule: { ...base, thresholdValue: cmpB },
        recentRunCount: cmpRecent,
        runProjectSlug: resolveRunProjectSlug(cmpSlug),
      });
      setCompareResult(res);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }

  return {
    canMutateEnterpriseShell,
    tab,
    setTab,
    loading,
    failure,
    simpleResult,
    compositeResult,
    compareResult,
    sName,
    setSName,
    sRuleType,
    setSRuleType,
    sSeverity,
    setSSeverity,
    sThreshold,
    setSThreshold,
    sRecent,
    setSRecent,
    sSlug,
    setSSlug,
    sRunId,
    setSRunId,
    sCompareRun,
    setSCompareRun,
    sUseHistory,
    setSUseHistory,
    sRecentTouched,
    setSRecentTouched,
    sThresholdTouched,
    setSThresholdTouched,
    sScopeTouched,
    setSScopeTouched,
    hasSpecificReviewId,
    recentCountValid,
    thresholdValid,
    reviewScopeValid,
    simpleFormValid,
    cName,
    setCName,
    cSeverity,
    setCSeverity,
    cJoin,
    setCJoin,
    cSuppression,
    setCSuppression,
    cCooldown,
    setCCooldown,
    cDedupe,
    setCDedupe,
    cRecent,
    setCRecent,
    cSlug,
    setCSlug,
    cM1,
    setCM1,
    cO1,
    setCO1,
    cV1,
    setCV1,
    cM2,
    setCM2,
    cO2,
    setCO2,
    cV2,
    setCV2,
    cmpName,
    setCmpName,
    cmpRuleType,
    setCmpRuleType,
    cmpSeverity,
    setCmpSeverity,
    cmpA,
    setCmpA,
    cmpB,
    setCmpB,
    cmpRecent,
    setCmpRecent,
    cmpSlug,
    setCmpSlug,
    runSimple,
    runComposite,
    runCompare,
  };
}
