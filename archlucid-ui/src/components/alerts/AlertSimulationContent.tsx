"use client";

import { cn } from "@/lib/utils";
import { AlertSimulationPickReviewBeforeSimulatingStrip } from "@/components/alerts/AlertSimulationPickReviewBeforeSimulatingStrip";
import { AlertSimulationNextReviewFooterClient } from "@/components/alerts/AlertSimulationNextReviewFooterClient";
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
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { useAlertSimulation } from "./use-alert-simulation";

export function AlertSimulationContent() {
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

  const simpleSimulationReadiness = resolveSimpleSimulationReadiness(
    hasSpecificReviewId,
    recentCountValid,
    thresholdValid,
    reviewScopeValid,
  );

  return (
    <div className={operatorPageContainerClass("workflow")}>
      <h3 id="alert-simulation-section-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Simulate alerts
      </h3>

      {sRunId.trim().length === 0 ? (
        <AlertSimulationPickReviewBeforeSimulatingStrip selectedReviewId={sRunId} onSelectReview={setSRunId} />
      ) : null}

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
          setSRunId={setSRunId}
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
      {sRunId.trim().length > 0 ? <AlertSimulationNextReviewFooterClient runId={sRunId.trim()} /> : null}
    </div>
  );
}
