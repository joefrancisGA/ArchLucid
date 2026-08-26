"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect } from "react";
import { AlertSimulationPickReviewBeforeSimulatingStrip } from "@/components/alerts/AlertSimulationPickReviewBeforeSimulatingStrip";
import { AlertSimulationNextReviewFooterClient } from "@/components/alerts/AlertSimulationNextReviewFooterClient";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import {
  resolveAlertSimulationRunEmphasizedStepId,
  resolveAlertSimulationRunSteps,
} from "@/lib/alert-simulation-run-checklist";
import { AlertSimulationCompareTab } from "@/components/alerts/AlertSimulationCompareTab";
import { AlertSimulationCompositeTab } from "@/components/alerts/AlertSimulationCompositeTab";
import { AlertSimulationSimpleTab } from "@/components/alerts/AlertSimulationSimpleTab";
import { resolveSimpleSimulationReadiness } from "@/components/alerts/AlertSimulationTabShared";
import { OperatorSegmentedModeToolbar } from "@/components/advisory/OperatorSegmentedModeToolbar";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { operatorPageContainerClass } from "@/components/operator/OperatorPageContainer";
import {
  ALERT_SIMULATION_MODE_TABS,
  type AlertSimulationModeTabId,
} from "@/lib/alert-simulation-form";
import {
  GOVERNANCE_ALERT_RULES_PATH,
  governanceAlertRulesTabHref,
} from "@/lib/governance/governance-route-paths";
import { OPERATOR_BODY_INLINE_LINK_CLASS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useAlertSimulation } from "./use-alert-simulation";

export function AlertSimulationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;
  const simulation = useAlertSimulation();
  const {
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
    canMutateEnterpriseShell,
  } = simulation;

  useEffect(() => {
    setSRunId(scopedRunId);
  }, [scopedRunId, setSRunId]);

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

  const onScopedRunIdChange = useCallback(
    (reviewId: string) => {
      setSRunId(reviewId);
      const trimmed = reviewId.trim();
      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "test-alerts");

      if (trimmed.length > 0) {
        params.set("runId", trimmed);
      } else {
        params.delete("runId");
      }

      router.replace(`${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams, setSRunId],
  );

  const simpleSimulationReadiness = resolveSimpleSimulationReadiness(
    hasSpecificReviewId,
    recentCountValid,
    thresholdValid,
    reviewScopeValid,
  );
  const dryRunComplete =
    simpleResult !== null || compositeResult !== null || compareResult !== null;
  const alertSimulationRunChecklistSteps = resolveAlertSimulationRunSteps({
    reviewPicked: scopedRunFilterActive,
    inputsConfigured: scopedRunFilterActive && simpleFormValid,
    dryRunComplete,
  });
  const alertSimulationRunChecklistEmphasizedStepId = resolveAlertSimulationRunEmphasizedStepId({
    reviewPicked: scopedRunFilterActive,
    inputsConfigured: scopedRunFilterActive && simpleFormValid,
    dryRunComplete,
  });

  return (
    <div className={operatorPageContainerClass("workflow")}>
      <h3 id="alert-simulation-section-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Simulate alerts
      </h3>

      {!scopedRunFilterActive ? (
        <AlertSimulationPickReviewBeforeSimulatingStrip selectedReviewId="" onSelectReview={onPickReview} />
      ) : (
        <p
          className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="alert-simulation-run-scope-banner"
        >
          {"Simulating alerts for review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={governanceAlertRulesTabHref("test-alerts")}>
            Clear review scope
          </Link>
          {" · "}
          <Link
            className={OPERATOR_BODY_INLINE_LINK_CLASS}
            href={`/architecture/reviews/${encodeURIComponent(scopedRunId)}`}
          >
            Open review
          </Link>
        </p>
      )}

      {scopedRunFilterActive ? (
        <IntegrationConnectChecklist
          title="Dry-run checklist"
          steps={alertSimulationRunChecklistSteps}
          emphasizedStepId={alertSimulationRunChecklistEmphasizedStepId}
          testIdPrefix="alert-simulation-run"
        />
      ) : null}

      {scopedRunFilterActive ? (
        <>
        <OperatorSegmentedModeToolbar
        tabs={ALERT_SIMULATION_MODE_TABS.map((mode) => ({
          id: mode.id,
          label: mode.label,
          testId: `alert-simulation-mode-${mode.id}`,
        }))}
        activeTabId={tab}
        onTabChange={(nextTabId) => setTab(nextTabId as AlertSimulationModeTabId)}
        ariaLabel="Simulation mode"
      />

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {tab === "simple" ? (
        <AlertSimulationSimpleTab
          canMutateEnterpriseShell={canMutateEnterpriseShell}
          loading={loading}
          simpleResult={simpleResult}
          sName={sName}
          setSName={setSName}
          sRuleType={sRuleType}
          setSRuleType={setSRuleType}
          sSeverity={sSeverity}
          setSSeverity={setSSeverity}
          sThreshold={sThreshold}
          setSThreshold={setSThreshold}
          sRecent={sRecent}
          setSRecent={setSRecent}
          sSlug={sSlug}
          setSSlug={setSSlug}
          sRunId={sRunId}
          setSRunId={onScopedRunIdChange}
          sCompareRun={sCompareRun}
          setSCompareRun={setSCompareRun}
          sUseHistory={sUseHistory}
          setSUseHistory={setSUseHistory}
          setSRecentTouched={setSRecentTouched}
          setSThresholdTouched={setSThresholdTouched}
          setSScopeTouched={setSScopeTouched}
          hasSpecificReviewId={hasSpecificReviewId}
          recentCountValid={recentCountValid}
          thresholdValid={thresholdValid}
          reviewScopeValid={reviewScopeValid}
          simpleFormValid={simpleFormValid}
          sRecentTouched={sRecentTouched}
          sThresholdTouched={sThresholdTouched}
          sScopeTouched={sScopeTouched}
          simpleSimulationReadiness={simpleSimulationReadiness}
          runSimple={runSimple}
        />
      ) : null}

      {tab === "composite" ? (
        <AlertSimulationCompositeTab
          canMutateEnterpriseShell={canMutateEnterpriseShell}
          loading={loading}
          compositeResult={compositeResult}
          cName={cName}
          setCName={setCName}
          cSeverity={cSeverity}
          setCSeverity={setCSeverity}
          cJoin={cJoin}
          setCJoin={setCJoin}
          cSuppression={cSuppression}
          setCSuppression={setCSuppression}
          cCooldown={cCooldown}
          setCCooldown={setCCooldown}
          cDedupe={cDedupe}
          setCDedupe={setCDedupe}
          cRecent={cRecent}
          setCRecent={setCRecent}
          cSlug={cSlug}
          setCSlug={setCSlug}
          cM1={cM1}
          setCM1={setCM1}
          cO1={cO1}
          setCO1={setCO1}
          cV1={cV1}
          setCV1={setCV1}
          cM2={cM2}
          setCM2={setCM2}
          cO2={cO2}
          setCO2={setCO2}
          cV2={cV2}
          setCV2={setCV2}
          runComposite={runComposite}
        />
      ) : null}

      {tab === "compare" ? (
        <AlertSimulationCompareTab
          canMutateEnterpriseShell={canMutateEnterpriseShell}
          loading={loading}
          compareResult={compareResult}
          cmpName={cmpName}
          setCmpName={setCmpName}
          cmpRuleType={cmpRuleType}
          setCmpRuleType={setCmpRuleType}
          cmpSeverity={cmpSeverity}
          setCmpSeverity={setCmpSeverity}
          cmpA={cmpA}
          setCmpA={setCmpA}
          cmpB={cmpB}
          setCmpB={setCmpB}
          cmpRecent={cmpRecent}
          setCmpRecent={setCmpRecent}
          cmpSlug={cmpSlug}
          setCmpSlug={setCmpSlug}
          runCompare={runCompare}
        />
      ) : null}
        </>
      ) : null}
      {scopedRunFilterActive ? <AlertSimulationNextReviewFooterClient runId={scopedRunId} /> : null}
    </div>
  );
}
