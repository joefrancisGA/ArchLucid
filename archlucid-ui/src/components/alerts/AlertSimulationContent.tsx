"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { OperatorSegmentedModeToolbar } from "@/components/advisory/OperatorSegmentedModeToolbar";
import { OperatorToolingWorkbenchPanels } from "@/components/advisory/OperatorToolingWorkbenchPanels";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { compareAlertRuleCandidates, simulateAlertRule } from "@/lib/api";
import {
  ALERT_SIMULATION_COMPARED_REVIEW_ID_HELPER,
  ALERT_SIMULATION_MODE_TABS,
  ALERT_SIMULATION_PROJECT_SLUG_HELPER,
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_SIMULATION_REVIEW_ID_HELPER,
  ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER,
  ALERT_TOOLING_FORM_SELECT_CLASS,
  resolveAlertSimulationRunProjectSlug,
  type AlertSimulationModeTabId,
} from "@/lib/alert-simulation-form";
import {
  alertSimulationCurrentBehaviorHeadingOperator,
  alertSimulationCurrentBehaviorHeadingReader,
  alertSimulationRunControlTitle,
} from "@/lib/enterprise-controls-context-copy";
import { alertSimulationOutcomesEmptyGettingStarted } from "@/lib/alerts-hub-empty-guidance";
import { DESIGN_TOKENS, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { readOperatorScopeFromStorage } from "@/lib/operator/operator-scope-storage";
import type {
  RuleCandidateComparisonResult,
  RuleSimulationResult,
  SimulatedAlertOutcome,
} from "@/types/alert-simulation";

const SIMPLE_RULE_TYPES = [
  { value: "CriticalRecommendationCount", label: "Critical / high recommendation count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count" },
  { value: "CostIncreasePercent", label: "Cost increase %" },
  { value: "DeferredHighPriorityRecommendationAgeDays", label: "Deferred high-priority age (days)" },
  { value: "RejectedSecurityRecommendation", label: "Rejected security recommendation" },
  { value: "AcceptanceRateDrop", label: "Acceptance rate below %" },
];

const METRICS = [
  { value: "CriticalRecommendationCount", label: "Critical/high recommendation count" },
  { value: "NewComplianceGapCount", label: "New compliance gap count" },
  { value: "CostIncreasePercent", label: "Cost increase %" },
  { value: "DeferredHighPriorityRecommendationCount", label: "Deferred high-priority count" },
  { value: "RejectedSecurityRecommendationCount", label: "Rejected security recommendations" },
  { value: "AcceptanceRatePercent", label: "Acceptance rate %" },
];

const COND_OPS = [
  { value: "GreaterThanOrEqual", label: "≥" },
  { value: "GreaterThan", label: ">" },
  { value: "LessThanOrEqual", label: "≤" },
  { value: "LessThan", label: "<" },
];

const SEVERITIES = ["Info", "Warning", "High", "Critical"];

function OutcomeTable({ outcomes }: { outcomes: SimulatedAlertOutcome[] }) {
  if (outcomes.length === 0) {
    return (
      <div className="grid max-w-xl gap-3">
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          Run a simulation above — per-review outcomes explain matches, suppression, and dedupe.
        </p>
        <GettingStartedSteps {...alertSimulationOutcomesEmptyGettingStarted} />
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className={cn("mt-2 w-full border-collapse", DESIGN_TOKENS.table.table)}>
        <thead>
          <tr className="border-b border-neutral-300 text-left dark:border-neutral-600">
            <th className="p-1.5">Review ID</th>
            <th className="p-1.5">Match</th>
            <th className="p-1.5">Would create</th>
            <th className="p-1.5">Suppressed</th>
            <th className="p-1.5">Severity</th>
            <th className="p-1.5">Title / description</th>
            <th className="p-1.5">Suppression / dedupe</th>
          </tr>
        </thead>
        <tbody>
          {outcomes.map((o, i) => (
            <tr key={`${o.runId ?? "x"}-${i}`} className="border-b border-neutral-100 align-top dark:border-neutral-800">
              <td className="whitespace-nowrap p-1.5">{o.runId ?? "—"}</td>
              <td className="p-1.5">{o.ruleMatched ? "yes" : "no"}</td>
              <td className="p-1.5">{o.wouldCreateAlert ? "yes" : "no"}</td>
              <td className="p-1.5">{o.wouldBeSuppressed ? "yes" : "no"}</td>
              <td className="p-1.5">{o.severity}</td>
              <td className="p-1.5">
                <strong>{o.title}</strong>
                <div className="mt-1 text-neutral-600 dark:text-neutral-400">{o.description}</div>
                {o.notes?.length ? (
                  <ul className="mt-1.5 pl-[18px] text-neutral-600 dark:text-neutral-400">
                    {o.notes.map((n, j) => (
                      <li key={j}>{n}</li>
                    ))}
                  </ul>
                ) : null}
              </td>
              <td className={cn("p-1.5", OPERATOR_TYPOGRAPHY.helper)}>
                <div>
                  <strong>Reason:</strong> {o.suppressionReason || "—"}
                </div>
                <div className="mt-1">
                  <strong>Dedupe:</strong> {o.deduplicationKey || "—"}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SummaryBlock({ result }: { result: RuleSimulationResult | null }) {
  if (!result) return null;
  return (
    <div className="mt-4">
      <h4 className="mb-2">Summary</h4>
      <ul className="m-0">
        <li>Evaluated reviews: {result.evaluatedRunCount}</li>
        <li>Matched: {result.matchedCount}</li>
        <li>Would create alerts: {result.wouldCreateCount}</li>
        <li>Would suppress: {result.wouldSuppressCount}</li>
      </ul>
      {result.summaryNotes?.length ? (
        <ul className="mt-2">
          {result.summaryNotes.map((n, i) => (
            <li key={i}>{n}</li>
          ))}
        </ul>
      ) : null}
      <h4 className="mb-2 mt-4">Outcomes</h4>
      <OutcomeTable outcomes={result.outcomes} />
    </div>
  );
}

export function AlertSimulationContent() {
  const canMutateEnterpriseShell = useOperateCapability();
  const [tab, setTab] = useState<AlertSimulationModeTabId>("simple");
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
  const [sSlug, setSSlug] = useState("");
  const [sRunId, setSRunId] = useState("");
  const [sCompareRun, setSCompareRun] = useState("");
  const [sUseHistory, setSUseHistory] = useState(true);

  // Composite
  const [cName, setCName] = useState("Composite dry-run");
  const [cSeverity, setCSeverity] = useState("High");
  const [cJoin, setCJoin] = useState("And");
  const [cSuppression, setCSuppression] = useState(1440);
  const [cCooldown, setCCooldown] = useState(60);
  const [cDedupe, setCDedupe] = useState("RuleAndRun");
  const [cRecent, setCRecent] = useState(10);
  const [cSlug, setCSlug] = useState("");
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
  const [cmpSlug, setCmpSlug] = useState("");

  function parseOptionalGuid(s: string): string | undefined {
    const t = s.trim();
    if (!t) return undefined;
    return t;
  }

  function resolveRunProjectSlug(typedSlug: string): string {
    return resolveAlertSimulationRunProjectSlug(
      typedSlug,
      readOperatorScopeFromStorage()?.projectId,
    );
  }

  async function runSimple() {
    setLoading(true);
    setFailure(null);
    setSimpleResult(null);
    try {
      const runId = parseOptionalGuid(sRunId);
      const comparedToRunId = parseOptionalGuid(sCompareRun);
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

  return (
    <div className="max-w-[1100px]">
      <h3 id="alert-simulation-section-heading" className={cn("m-0", OPERATOR_TYPOGRAPHY.sectionTitle)}>
        Simulate alerts
      </h3>

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
        <OperatorToolingWorkbenchPanels
          inputsHeadingId="sim-simple-inputs-heading"
          inputsHeading="Simulation inputs"
          behaviorHeadingId="sim-simple-behavior-heading"
          behaviorHeading={
            canMutateEnterpriseShell
              ? alertSimulationCurrentBehaviorHeadingOperator
              : alertSimulationCurrentBehaviorHeadingReader
          }
          inputsGridClassName="grid max-w-[640px] gap-3"
          inputs={
            <>
            <div>
              <Label htmlFor="alert-simulation-simple-name">Name</Label>
              <Input
                id="alert-simulation-simple-name"
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-simple-rule-type">Rule type</Label>
              <select
                id="alert-simulation-simple-rule-type"
                value={sRuleType}
                onChange={(e) => setSRuleType(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {SIMPLE_RULE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-simulation-simple-severity">Severity</Label>
              <select
                id="alert-simulation-simple-severity"
                value={sSeverity}
                onChange={(e) => setSSeverity(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-simulation-simple-threshold">Threshold</Label>
              <Input
                id="alert-simulation-simple-threshold"
                type="number"
                value={sThreshold}
                onChange={(e) => setSThreshold(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-simple-recent-count">Recent review count (1–50)</Label>
              <Input
                id="alert-simulation-simple-recent-count"
                type="number"
                min={1}
                max={50}
                value={sRecent}
                onChange={(e) => setSRecent(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-simple-project-slug">Workspace project slug</Label>
              <Input
                id="alert-simulation-simple-project-slug"
                value={sSlug}
                onChange={(e) => setSSlug(e.target.value)}
                placeholder={ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER}
                className="mt-1"
                data-testid="alert-simulation-simple-project-slug"
              />
              <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {ALERT_SIMULATION_PROJECT_SLUG_HELPER}
              </span>
            </div>
            <div>
              <Label htmlFor="alert-simulation-simple-review-id">Specific review ID (optional; overrides recent list)</Label>
              <Input
                id="alert-simulation-simple-review-id"
                value={sRunId}
                onChange={(e) => setSRunId(e.target.value)}
                placeholder={ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER}
                className="mt-1"
                data-testid="alert-simulation-simple-review-id"
              />
              <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {ALERT_SIMULATION_REVIEW_ID_HELPER}
              </span>
            </div>
            <div>
              <Label htmlFor="alert-simulation-simple-compared-review-id">Compared-to review ID (optional)</Label>
              <Input
                id="alert-simulation-simple-compared-review-id"
                value={sCompareRun}
                onChange={(e) => setSCompareRun(e.target.value)}
                className="mt-1"
              />
              <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {ALERT_SIMULATION_COMPARED_REVIEW_ID_HELPER}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="alert-simulation-simple-use-historical-window"
                checked={sUseHistory}
                onCheckedChange={(checked) => setSUseHistory(checked === true)}
              />
              <Label htmlFor="alert-simulation-simple-use-historical-window">
                Use historical window (recent reviews)
              </Label>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              data-testid="alert-simulation-simple-submit"
              onClick={() => void runSimple()}
              disabled={loading}
              title={alertSimulationRunControlTitle}
            >
              {loading ? "Running…" : "Simulate"}
            </Button>
            </>
          }
          behavior={
            simpleResult ? (
              <SummaryBlock result={simpleResult} />
            ) : (
              <p className={cn("mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                Run a simulation to see outcomes here.
              </p>
            )
          }
        />
      ) : null}

      {tab === "composite" ? (
        <OperatorToolingWorkbenchPanels
          inputsHeadingId="sim-composite-inputs-heading"
          inputsHeading="Simulation inputs"
          behaviorHeadingId="sim-composite-behavior-heading"
          behaviorHeading={
            canMutateEnterpriseShell
              ? alertSimulationCurrentBehaviorHeadingOperator
              : alertSimulationCurrentBehaviorHeadingReader
          }
          inputsGridClassName="grid max-w-3xl gap-3"
          inputs={
            <>
            <div>
              <Label htmlFor="alert-simulation-composite-name">Name</Label>
              <Input
                id="alert-simulation-composite-name"
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-severity">Severity</Label>
              <select
                id="alert-simulation-composite-severity"
                value={cSeverity}
                onChange={(e) => setCSeverity(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-join">Join</Label>
              <select
                id="alert-simulation-composite-join"
                value={cJoin}
                onChange={(e) => setCJoin(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                <option value="And">All (AND)</option>
                <option value="Or">Any (OR)</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="alert-simulation-composite-suppression-window">Suppression window (min)</Label>
                <Input
                  id="alert-simulation-composite-suppression-window"
                  type="number"
                  value={cSuppression}
                  onChange={(e) => setCSuppression(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="alert-simulation-composite-cooldown">Cooldown (min)</Label>
                <Input
                  id="alert-simulation-composite-cooldown"
                  type="number"
                  value={cCooldown}
                  onChange={(e) => setCCooldown(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-dedupe-scope">Dedupe scope</Label>
              <select
                id="alert-simulation-composite-dedupe-scope"
                value={cDedupe}
                onChange={(e) => setCDedupe(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                <option value="RuleOnly">Rule only</option>
                <option value="RuleAndRun">Rule + review</option>
                <option value="RuleAndComparison">Rule + review + comparison</option>
              </select>
            </div>
            <p className="m-0 font-semibold">Condition 1</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="alert-simulation-composite-c1-metric">Metric</Label>
                <select
                  id="alert-simulation-composite-c1-metric"
                  value={cM1}
                  onChange={(e) => setCM1(e.target.value)}
                  className={ALERT_TOOLING_FORM_SELECT_CLASS}
                >
                  {METRICS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alert-simulation-composite-c1-operator">Operator</Label>
                <select
                  id="alert-simulation-composite-c1-operator"
                  value={cO1}
                  onChange={(e) => setCO1(e.target.value)}
                  className={ALERT_TOOLING_FORM_SELECT_CLASS}
                >
                  {COND_OPS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alert-simulation-composite-c1-threshold">Threshold</Label>
                <Input
                  id="alert-simulation-composite-c1-threshold"
                  type="number"
                  value={cV1}
                  onChange={(e) => setCV1(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <p className="m-0 font-semibold">Condition 2</p>
            <div className="grid grid-cols-3 gap-2">
              <div>
                <Label htmlFor="alert-simulation-composite-c2-metric">Metric</Label>
                <select
                  id="alert-simulation-composite-c2-metric"
                  value={cM2}
                  onChange={(e) => setCM2(e.target.value)}
                  className={ALERT_TOOLING_FORM_SELECT_CLASS}
                >
                  {METRICS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alert-simulation-composite-c2-operator">Operator</Label>
                <select
                  id="alert-simulation-composite-c2-operator"
                  value={cO2}
                  onChange={(e) => setCO2(e.target.value)}
                  className={ALERT_TOOLING_FORM_SELECT_CLASS}
                >
                  {COND_OPS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="alert-simulation-composite-c2-threshold">Threshold</Label>
                <Input
                  id="alert-simulation-composite-c2-threshold"
                  type="number"
                  value={cV2}
                  onChange={(e) => setCV2(Number(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-recent-count">Recent review count</Label>
              <Input
                id="alert-simulation-composite-recent-count"
                type="number"
                min={1}
                max={50}
                value={cRecent}
                onChange={(e) => setCRecent(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-composite-project-slug">Workspace project slug</Label>
              <Input
                id="alert-simulation-composite-project-slug"
                value={cSlug}
                onChange={(e) => setCSlug(e.target.value)}
                placeholder={ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER}
                className="mt-1"
                data-testid="alert-simulation-composite-project-slug"
              />
              <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {ALERT_SIMULATION_PROJECT_SLUG_HELPER}
              </span>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              data-testid="alert-simulation-composite-submit"
              onClick={() => void runComposite()}
              disabled={loading}
              title={alertSimulationRunControlTitle}
            >
              {loading ? "Running…" : "Simulate"}
            </Button>
            </>
          }
          behavior={
            compositeResult ? (
              <SummaryBlock result={compositeResult} />
            ) : (
              <p className={cn("mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                Run a simulation to see outcomes here.
              </p>
            )
          }
        />
      ) : null}

      {tab === "compare" ? (
        <OperatorToolingWorkbenchPanels
          inputsHeadingId="sim-compare-inputs-heading"
          inputsHeading="Simulation inputs"
          behaviorHeadingId="sim-compare-behavior-heading"
          behaviorHeading={
            canMutateEnterpriseShell
              ? alertSimulationCurrentBehaviorHeadingOperator
              : alertSimulationCurrentBehaviorHeadingReader
          }
          inputsGridClassName="grid max-w-[640px] gap-3"
          inputs={
            <>
            <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              Same rule type and severity; only thresholds differ. Useful for tuning (e.g. 10 vs 20).
            </p>
            <div>
              <Label htmlFor="alert-simulation-compare-name">Name</Label>
              <Input
                id="alert-simulation-compare-name"
                value={cmpName}
                onChange={(e) => setCmpName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-compare-rule-type">Rule type</Label>
              <select
                id="alert-simulation-compare-rule-type"
                value={cmpRuleType}
                onChange={(e) => setCmpRuleType(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {SIMPLE_RULE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-simulation-compare-severity">Severity</Label>
              <select
                id="alert-simulation-compare-severity"
                value={cmpSeverity}
                onChange={(e) => setCmpSeverity(e.target.value)}
                className={ALERT_TOOLING_FORM_SELECT_CLASS}
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="alert-simulation-compare-threshold-a">Candidate A threshold</Label>
              <Input
                id="alert-simulation-compare-threshold-a"
                type="number"
                value={cmpA}
                onChange={(e) => setCmpA(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-compare-threshold-b">Candidate B threshold</Label>
              <Input
                id="alert-simulation-compare-threshold-b"
                type="number"
                value={cmpB}
                onChange={(e) => setCmpB(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-compare-recent-count">Recent review count</Label>
              <Input
                id="alert-simulation-compare-recent-count"
                type="number"
                min={1}
                max={50}
                value={cmpRecent}
                onChange={(e) => setCmpRecent(Number(e.target.value))}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="alert-simulation-compare-project-slug">Workspace project slug</Label>
              <Input
                id="alert-simulation-compare-project-slug"
                value={cmpSlug}
                onChange={(e) => setCmpSlug(e.target.value)}
                placeholder={ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER}
                className="mt-1"
                data-testid="alert-simulation-compare-project-slug"
              />
              <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {ALERT_SIMULATION_PROJECT_SLUG_HELPER}
              </span>
            </div>
            <Button
              type="button"
              variant="primary"
              size="sm"
              data-testid="alert-simulation-compare-submit"
              onClick={() => void runCompare()}
              disabled={loading}
              title={alertSimulationRunControlTitle}
            >
              {loading ? "Running…" : "Compare candidates"}
            </Button>
            </>
          }
          behavior={
            compareResult ? (
              <div className="mt-2">
                <h4 className="mb-2">Comparison notes</h4>
                <ul>
                  {compareResult.summaryNotes.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
                <h4 className="mb-2 mt-4">Candidate A</h4>
                <SummaryBlock result={compareResult.candidateA} />
                <h4 className="mb-2 mt-4">Candidate B</h4>
                <SummaryBlock result={compareResult.candidateB} />
              </div>
            ) : (
              <p className={cn("mt-2 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
                Run a comparison to see outcomes here.
              </p>
            )
          }
        />
      ) : null}
    </div>
  );
}
