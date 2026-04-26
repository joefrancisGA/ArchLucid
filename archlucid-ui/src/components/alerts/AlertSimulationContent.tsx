"use client";

import { useState } from "react";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { LayerHeader } from "@/components/LayerHeader";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { useEnterpriseMutationCapability } from "@/hooks/use-enterprise-mutation-capability";
import { compareAlertRuleCandidates, simulateAlertRule } from "@/lib/api";
import {
  alertSimulationCurrentBehaviorHeadingOperator,
  alertSimulationCurrentBehaviorHeadingReader,
  alertSimulationPageLead,
  alertSimulationRunControlTitle,
} from "@/lib/enterprise-controls-context-copy";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
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
const TABS = ["simple", "composite", "compare"] as const;
type Tab = (typeof TABS)[number];

function OutcomeTable({ outcomes }: { outcomes: SimulatedAlertOutcome[] }) {
  if (outcomes.length === 0) return <p className="text-neutral-500 dark:text-neutral-400">No per-run rows.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="mt-2 w-full border-collapse text-[13px]">
        <thead>
          <tr className="border-b border-neutral-300 text-left dark:border-neutral-600">
            <th className="p-1.5">Run</th>
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
              <td className="p-1.5 text-xs">
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
        <li>Evaluated runs: {result.evaluatedRunCount}</li>
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
  const canMutateEnterpriseShell = useEnterpriseMutationCapability();
  const [tab, setTab] = useState<Tab>("simple");
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
  const [sSlug, setSSlug] = useState("default");
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
  const [cSlug, setCSlug] = useState("default");
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
  const [cmpSlug, setCmpSlug] = useState("default");

  function parseOptionalGuid(s: string): string | undefined {
    const t = s.trim();
    if (!t) return undefined;
    return t;
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
        runProjectSlug: sSlug.trim() || "default",
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
        runProjectSlug: cSlug.trim() || "default",
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
        runProjectSlug: cmpSlug.trim() || "default",
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
      <LayerHeader pageKey="alert-simulation" />
      <h2 className="mt-0">Alert rule simulation</h2>
      <p className="mb-2 max-w-prose text-sm leading-snug text-neutral-600 dark:text-neutral-400">
        {alertSimulationPageLead}
      </p>
      <AlertOperatorToolingRankCue className="mb-3" />

      <div className="mb-5 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`cursor-pointer capitalize rounded-md px-3.5 py-2 ${tab === t ? "border-2 border-neutral-700 bg-neutral-100 dark:border-neutral-300 dark:bg-neutral-800" : "border border-neutral-300 bg-white dark:border-neutral-600 dark:bg-neutral-950"}`}
          >
            {t}
          </button>
        ))}
      </div>

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
        <>
          <section aria-labelledby="sim-simple-inputs-heading">
            <h3 id="sim-simple-inputs-heading" className="mt-0">
              Simulation inputs
            </h3>
            <div className="grid max-w-[640px] gap-3">
            <label>
              Name
              <input
                value={sName}
                onChange={(e) => setSName(e.target.value)}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Rule type
              <select
                value={sRuleType}
                onChange={(e) => setSRuleType(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                {SIMPLE_RULE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Severity
              <select
                value={sSeverity}
                onChange={(e) => setSSeverity(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Threshold
              <input
                type="number"
                value={sThreshold}
                onChange={(e) => setSThreshold(Number(e.target.value))}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Recent run count (1–50)
              <input
                type="number"
                min={1}
                max={50}
                value={sRecent}
                onChange={(e) => setSRecent(Number(e.target.value))}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Run project slug
              <input
                value={sSlug}
                onChange={(e) => setSSlug(e.target.value)}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Specific run ID (optional; overrides recent list)
              <input
                value={sRunId}
                onChange={(e) => setSRunId(e.target.value)}
                placeholder="00000000-0000-0000-0000-000000000000"
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Compared-to run ID (optional)
              <input
                value={sCompareRun}
                onChange={(e) => setSCompareRun(e.target.value)}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={sUseHistory}
                onChange={(e) => setSUseHistory(e.target.checked)}
              />
              Use historical window (recent runs)
            </label>
            <button
              type="button"
              onClick={() => void runSimple()}
              disabled={loading}
              title={alertSimulationRunControlTitle}
              className={`px-4 py-2.5 ${loading ? "cursor-wait" : "cursor-pointer"}`}
            >
              {loading ? "Running…" : "Simulate"}
            </button>
          </div>
          </section>
          <section aria-labelledby="sim-simple-behavior-heading" className="mt-6">
            <h3 id="sim-simple-behavior-heading" className="mt-0">
              {canMutateEnterpriseShell
                ? alertSimulationCurrentBehaviorHeadingOperator
                : alertSimulationCurrentBehaviorHeadingReader}
            </h3>
            {simpleResult ? (
              <SummaryBlock result={simpleResult} />
            ) : (
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Run a simulation to see outcomes here.</p>
            )}
          </section>
        </>
      ) : null}

      {tab === "composite" ? (
        <>
          <section aria-labelledby="sim-composite-inputs-heading">
            <h3 id="sim-composite-inputs-heading" className="mt-0">
              Simulation inputs
            </h3>
            <div className="grid max-w-3xl gap-3">
            <label>
              Name
              <input
                value={cName}
                onChange={(e) => setCName(e.target.value)}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Severity
              <select
                value={cSeverity}
                onChange={(e) => setCSeverity(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Join
              <select
                value={cJoin}
                onChange={(e) => setCJoin(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                <option value="And">All (AND)</option>
                <option value="Or">Any (OR)</option>
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label>
                Suppression window (min)
                <input
                  type="number"
                  value={cSuppression}
                  onChange={(e) => setCSuppression(Number(e.target.value))}
                  className="mt-1 block w-full p-2"
                />
              </label>
              <label>
                Cooldown (min)
                <input
                  type="number"
                  value={cCooldown}
                  onChange={(e) => setCCooldown(Number(e.target.value))}
                  className="mt-1 block w-full p-2"
                />
              </label>
            </div>
            <label>
              Dedupe scope
              <select
                value={cDedupe}
                onChange={(e) => setCDedupe(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                <option value="RuleOnly">Rule only</option>
                <option value="RuleAndRun">Rule + run</option>
                <option value="RuleAndComparison">Rule + run + comparison</option>
              </select>
            </label>
            <p className="m-0 font-semibold">Condition 1</p>
            <div className="grid grid-cols-3 gap-2">
              <select value={cM1} onChange={(e) => setCM1(e.target.value)}>
                {METRICS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select value={cO1} onChange={(e) => setCO1(e.target.value)}>
                {COND_OPS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input type="number" value={cV1} onChange={(e) => setCV1(Number(e.target.value))} />
            </div>
            <p className="m-0 font-semibold">Condition 2</p>
            <div className="grid grid-cols-3 gap-2">
              <select value={cM2} onChange={(e) => setCM2(e.target.value)}>
                {METRICS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <select value={cO2} onChange={(e) => setCO2(e.target.value)}>
                {COND_OPS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <input type="number" value={cV2} onChange={(e) => setCV2(Number(e.target.value))} />
            </div>
            <label>
              Recent run count
              <input
                type="number"
                min={1}
                max={50}
                value={cRecent}
                onChange={(e) => setCRecent(Number(e.target.value))}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Run project slug
              <input
                value={cSlug}
                onChange={(e) => setCSlug(e.target.value)}
                className="mt-1 block w-full p-2"
              />
            </label>
            <button
              type="button"
              onClick={() => void runComposite()}
              disabled={loading}
              title={alertSimulationRunControlTitle}
              className={`px-4 py-2.5 ${loading ? "cursor-wait" : "cursor-pointer"}`}
            >
              {loading ? "Running…" : "Simulate"}
            </button>
          </div>
          </section>
          <section aria-labelledby="sim-composite-behavior-heading" className="mt-6">
            <h3 id="sim-composite-behavior-heading" className="mt-0">
              {canMutateEnterpriseShell
                ? alertSimulationCurrentBehaviorHeadingOperator
                : alertSimulationCurrentBehaviorHeadingReader}
            </h3>
            {compositeResult ? (
              <SummaryBlock result={compositeResult} />
            ) : (
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Run a simulation to see outcomes here.</p>
            )}
          </section>
        </>
      ) : null}

      {tab === "compare" ? (
        <>
          <section aria-labelledby="sim-compare-inputs-heading">
            <h3 id="sim-compare-inputs-heading" className="mt-0">
              Simulation inputs
            </h3>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              Same rule type and severity; only thresholds differ. Useful for tuning (e.g. 10 vs 20).
            </p>
            <div className="grid max-w-[640px] gap-3">
            <label>
              Name
              <input
                value={cmpName}
                onChange={(e) => setCmpName(e.target.value)}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Rule type
              <select
                value={cmpRuleType}
                onChange={(e) => setCmpRuleType(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                {SIMPLE_RULE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Severity
              <select
                value={cmpSeverity}
                onChange={(e) => setCmpSeverity(e.target.value)}
                className="mt-1 block w-full p-2"
              >
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Candidate A threshold
              <input
                type="number"
                value={cmpA}
                onChange={(e) => setCmpA(Number(e.target.value))}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Candidate B threshold
              <input
                type="number"
                value={cmpB}
                onChange={(e) => setCmpB(Number(e.target.value))}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Recent run count
              <input
                type="number"
                min={1}
                max={50}
                value={cmpRecent}
                onChange={(e) => setCmpRecent(Number(e.target.value))}
                className="mt-1 block w-full p-2"
              />
            </label>
            <label>
              Run project slug
              <input
                value={cmpSlug}
                onChange={(e) => setCmpSlug(e.target.value)}
                className="mt-1 block w-full p-2"
              />
            </label>
            <button
              type="button"
              onClick={() => void runCompare()}
              disabled={loading}
              title={alertSimulationRunControlTitle}
              className={`px-4 py-2.5 ${loading ? "cursor-wait" : "cursor-pointer"}`}
            >
              {loading ? "Running…" : "Compare candidates"}
            </button>
          </div>
          </section>
          <section aria-labelledby="sim-compare-behavior-heading" className="mt-6">
            <h3 id="sim-compare-behavior-heading" className="mt-0">
              {canMutateEnterpriseShell
                ? alertSimulationCurrentBehaviorHeadingOperator
                : alertSimulationCurrentBehaviorHeadingReader}
            </h3>
            {compareResult ? (
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
              <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">Run a comparison to see outcomes here.</p>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
