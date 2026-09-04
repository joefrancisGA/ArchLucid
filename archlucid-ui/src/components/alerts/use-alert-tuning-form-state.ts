"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { recommendAlertThreshold } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure, uiFailureFromMessage } from "@/lib/api-load-failure";
import { resolveAlertSimulationRunProjectSlug } from "@/lib/alert-simulation-form";
import {
  alertTuningFormDraftHrefFromSearch,
  parseAlertTuningKindFromSearch,
  parseAlertTuningRunSlugFromSearch,
  parseAlertTuningThresholdsFromSearch,
} from "@/lib/alerts/alert-tuning-form-draft-url";
import {
  resolveAlertTuningRecommendEmphasizedStepId,
  resolveAlertTuningRecommendSteps,
} from "@/lib/alert-tuning-recommend-checklist";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import {
  GOVERNANCE_ALERT_RULES_PATH,
} from "@/lib/governance/governance-route-paths";
import type { ThresholdRecommendationResult } from "@/types/alert-tuning";

export function useAlertTuningFormState() {
  const router = useRouter();
  const pathname = usePathname() ?? GOVERNANCE_ALERT_RULES_PATH;
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const urlTuneKind = parseAlertTuningKindFromSearch(searchParams.get("tuneKind"));
  const urlTuneThresholds = parseAlertTuningThresholdsFromSearch(searchParams.get("tuneThresholds"));
  const urlTuneRunSlug = parseAlertTuningRunSlugFromSearch(searchParams.get("tuneRunSlug"));

  const [ruleKind, setRuleKindState] = useState<"Simple" | "Composite">(urlTuneKind ?? "Simple");
  const [ruleType, setRuleType] = useState("CostIncreasePercent");
  const [tunedMetricComposite, setTunedMetricComposite] = useState("CostIncreasePercent");
  const [severity, setSeverity] = useState("Warning");
  const [name, setName] = useState("Tuning candidate");
  const [candidateThresholdsStr, setCandidateThresholdsStrState] = useState(
    urlTuneThresholds.length > 0 ? urlTuneThresholds : "5,10,15,20,25",
  );
  const [recentRunCount, setRecentRunCount] = useState(10);
  const [targetMin, setTargetMin] = useState(1);
  const [targetMax, setTargetMax] = useState(5);
  const [runSlug, setRunSlugState] = useState(urlTuneRunSlug);

  const [cJoin, setCJoin] = useState("And");
  const [cSuppression, setCSuppression] = useState(1440);
  const [cCooldown, setCCooldown] = useState(60);
  const [cDedupe, setCDedupe] = useState("RuleAndRun");
  const [cM1, setCM1] = useState("CostIncreasePercent");
  const [cO1, setCO1] = useState("GreaterThanOrEqual");
  const [cV1, setCV1] = useState(10);
  const [cM2, setCM2] = useState("NewComplianceGapCount");
  const [cO2, setCO2] = useState("GreaterThanOrEqual");
  const [cV2, setCV2] = useState(1);

  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [result, setResult] = useState<ThresholdRecommendationResult | null>(null);

  const syncTuningDraftToUrl = useCallback(
    (nextKind: "Simple" | "Composite", nextThresholds: string, nextRunSlug: string) => {
      router.replace(
        alertTuningFormDraftHrefFromSearch(
          searchParams.toString(),
          {
            ruleKind: nextKind,
            candidateThresholds: nextThresholds,
            runSlug: nextRunSlug,
          },
          pathname,
        ),
        { scroll: false },
      );
    },
    [pathname, router, searchParams],
  );

  const setRuleKind = useCallback(
    (value: "Simple" | "Composite") => {
      setRuleKindState(value);
      syncTuningDraftToUrl(value, candidateThresholdsStr, runSlug);
    },
    [candidateThresholdsStr, runSlug, syncTuningDraftToUrl],
  );

  const setCandidateThresholdsStr = useCallback(
    (value: string) => {
      setCandidateThresholdsStrState(value);
      syncTuningDraftToUrl(ruleKind, value, runSlug);
    },
    [ruleKind, runSlug, syncTuningDraftToUrl],
  );

  const setRunSlug = useCallback(
    (value: string) => {
      setRunSlugState(value);
      syncTuningDraftToUrl(ruleKind, candidateThresholdsStr, value);
    },
    [candidateThresholdsStr, ruleKind, syncTuningDraftToUrl],
  );

  useEffect(() => {
    if (urlTuneKind !== null) {
      setRuleKindState(urlTuneKind);
    }

    if (urlTuneThresholds.length > 0) {
      setCandidateThresholdsStrState(urlTuneThresholds);
    }

    setRunSlugState(urlTuneRunSlug);
  }, [urlTuneKind, urlTuneRunSlug, urlTuneThresholds]);

  const onPickReview = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "test-alerts");
      params.set("runId", trimmed);

      router.replace(`${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  async function recommend() {
    setFailure(null);
    setResult(null);
    const thresholds = candidateThresholdsStr
      .split(",")
      .map((x) => Number(x.trim()))
      .filter((x) => !Number.isNaN(x));

    if (thresholds.length === 0) {
      setFailure(uiFailureFromMessage("Enter at least one numeric candidate threshold (comma-separated)."));
      return;
    }

    const first = thresholds[0]!;

    setLoading(true);
    try {
      if (ruleKind === "Simple") {
        const data = await recommendAlertThreshold({
          ruleKind: "Simple",
          tunedMetricType: ruleType,
          candidateThresholds: thresholds,
          recentRunCount,
          targetCreatedAlertCountMin: targetMin,
          targetCreatedAlertCountMax: targetMax,
          runProjectSlug: resolveAlertSimulationRunProjectSlug(
            runSlug,
            readOperatorScopeFromStorage()?.projectId,
          ),
          baseSimpleRule: {
            ruleId: "00000000-0000-0000-0000-000000000000",
            tenantId: "00000000-0000-0000-0000-000000000000",
            workspaceId: "00000000-0000-0000-0000-000000000000",
            projectId: "00000000-0000-0000-0000-000000000000",
            name: name.trim() || "Candidate rule",
            ruleType,
            severity,
            thresholdValue: first,
            isEnabled: true,
            targetChannelType: "DigestOnly",
            metadataJson: "{}",
            createdUtc: new Date().toISOString(),
          },
        });
        setResult(data);
      } else {
        if (cM1 !== tunedMetricComposite && cM2 !== tunedMetricComposite) {
          setFailure(
            uiFailureFromMessage('Set "Metric to tune" to match condition 1 or condition 2 metric.'),
          );
          setLoading(false);
          return;
        }
        const data = await recommendAlertThreshold({
          ruleKind: "Composite",
          tunedMetricType: tunedMetricComposite,
          candidateThresholds: thresholds,
          recentRunCount,
          targetCreatedAlertCountMin: targetMin,
          targetCreatedAlertCountMax: targetMax,
          runProjectSlug: resolveAlertSimulationRunProjectSlug(
            runSlug,
            readOperatorScopeFromStorage()?.projectId,
          ),
          baseCompositeRule: {
            compositeRuleId: "00000000-0000-0000-0000-000000000000",
            tenantId: "00000000-0000-0000-0000-000000000000",
            workspaceId: "00000000-0000-0000-0000-000000000000",
            projectId: "00000000-0000-0000-0000-000000000000",
            name: name.trim() || "Composite tuning",
            severity,
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
        });
        setResult(data);
      }
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }

  const recommendedLabel = result?.recommendedCandidate?.candidate.label;
  const signalChosen =
    ruleKind === "Simple" ? ruleType.trim().length > 0 : tunedMetricComposite.trim().length > 0;
  const windowSet =
    (Number.isFinite(recentRunCount) && recentRunCount >= 1) || runSlug.trim().length > 0;
  const recommendComplete = result !== null;
  const recommendChecklistInput = {
    signalChosen,
    windowSet,
    recommendComplete,
  };
  const recommendSteps = resolveAlertTuningRecommendSteps(recommendChecklistInput);
  const recommendEmphasizedStepId =
    resolveAlertTuningRecommendEmphasizedStepId(recommendChecklistInput);

  return {
    scopedRunId,
    scopedRunFilterActive,
    onPickReview,
    ruleKind,
    setRuleKind,
    ruleType,
    setRuleType,
    tunedMetricComposite,
    setTunedMetricComposite,
    severity,
    setSeverity,
    name,
    setName,
    candidateThresholdsStr,
    setCandidateThresholdsStr,
    recentRunCount,
    setRecentRunCount,
    targetMin,
    setTargetMin,
    targetMax,
    setTargetMax,
    runSlug,
    setRunSlug,
    cJoin,
    setCJoin,
    cSuppression,
    setCSuppression,
    cCooldown,
    setCCooldown,
    cDedupe,
    setCDedupe,
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
    loading,
    failure,
    result,
    recommendedLabel,
    recommendSteps,
    recommendEmphasizedStepId,
    recommend,
  };
}

export type AlertTuningFormViewModel = ReturnType<typeof useAlertTuningFormState>;
