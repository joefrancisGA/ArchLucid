"use client";

import { cn } from "@/lib/utils";
import { GettingStartedSteps } from "@/components/GettingStartedSteps";
import { FieldHelpTooltip } from "@/components/FieldHelpTooltip";
import { OperatorSegmentedModeToolbar } from "@/components/advisory/OperatorSegmentedModeToolbar";
import { OperatorToolingWorkbenchPanels } from "@/components/advisory/OperatorToolingWorkbenchPanels";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  EnterpriseTable,
  EnterpriseTableBody,
  EnterpriseTableCell,
  EnterpriseTableHead,
  EnterpriseTableHeadRow,
  EnterpriseTableHeaderCell,
  EnterpriseTableRow,
} from "@/components/ui/enterprise-table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ALERT_SIMULATION_BEHAVIOR_EMPTY_GETTING_STARTED,
  ALERT_SIMULATION_COMPARED_REVIEW_DISABLED_HELPER,
  ALERT_SIMULATION_COMPARED_REVIEW_ID_HELPER,
  ALERT_SIMULATION_MODE_TABS,
  ALERT_SIMULATION_OUTCOMES_TABLE_EMPTY,
  ALERT_SIMULATION_PROJECT_SLUG_HELPER,
  ALERT_SIMULATION_PROJECT_SLUG_PLACEHOLDER,
  ALERT_SIMULATION_READINESS_RECENT_COUNT,
  ALERT_SIMULATION_READINESS_REVIEW_SCOPE,
  ALERT_SIMULATION_READINESS_THRESHOLD,
  ALERT_SIMULATION_RECENT_COUNT_HELPER,
  ALERT_SIMULATION_RECENT_COUNT_LABEL,
  ALERT_SIMULATION_REVIEW_ID_HELPER,
  ALERT_SIMULATION_REVIEW_ID_PLACEHOLDER,
  ALERT_SIMULATION_REVIEW_ID_PRECEDENCE,
  ALERT_SIMULATION_SPECIFIC_REVIEW_REPLACES_WINDOW_NOTE,
  ALERT_TOOLING_FORM_SELECT_CLASS,
  type AlertSimulationModeTabId,
} from "@/lib/alert-simulation-form";
import {
  alertSimulationBehaviorEmptyLead,
  alertSimulationCurrentBehaviorHeadingOperator,
  alertSimulationCurrentBehaviorHeadingReader,
  alertSimulationRunControlTitle,
} from "@/lib/enterprise-controls-context-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  firstWhyDisabledCtaReason,
  whyDisabledIncompleteInput,
  type WhyDisabledCtaReason,
} from "@/lib/why-disabled-cta";
import type {
  RuleSimulationResult,
  SimulatedAlertOutcome,
} from "@/types/alert-simulation";
import { useAlertSimulation } from "./use-alert-simulation";

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

function SimulationBehaviorEmpty() {
  return (
    <div className="mt-2 grid max-w-xl gap-3">
      <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {alertSimulationBehaviorEmptyLead}
      </p>
      <GettingStartedSteps {...ALERT_SIMULATION_BEHAVIOR_EMPTY_GETTING_STARTED} />
    </div>
  );
}

function resolveSimpleSimulationReadiness(
  hasSpecificReviewId: boolean,
  recentCountValid: boolean,
  thresholdValid: boolean,
  reviewScopeValid: boolean,
): WhyDisabledCtaReason | null {
  return firstWhyDisabledCtaReason([
    !thresholdValid ? whyDisabledIncompleteInput(ALERT_SIMULATION_READINESS_THRESHOLD) : null,
    !reviewScopeValid ? whyDisabledIncompleteInput(ALERT_SIMULATION_READINESS_REVIEW_SCOPE) : null,
    hasSpecificReviewId || recentCountValid
      ? null
      : whyDisabledIncompleteInput(ALERT_SIMULATION_READINESS_RECENT_COUNT),
  ]);
}

function AlertSimulationRunButton(props: {
  readonly testId: string;
  readonly onClick: () => void;
  readonly disabled: boolean;
  readonly busy: boolean;
  readonly label: string;
  readonly readinessHintId?: string;
}): React.JSX.Element {
  return (
    <div className="inline-flex items-center gap-1 justify-self-start">
      <Button
        type="button"
        variant="primary"
        size="sm"
        data-testid={props.testId}
        onClick={props.onClick}
        disabled={props.disabled}
        aria-describedby={props.readinessHintId}
      >
        {props.busy ? "Running…" : props.label}
      </Button>
      <FieldHelpTooltip label={props.label} hint={alertSimulationRunControlTitle} />
    </div>
  );
}

function OutcomeTable({ outcomes }: { outcomes: SimulatedAlertOutcome[] }) {
  if (outcomes.length === 0) {
    return (
      <div className="grid max-w-xl gap-3">
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {ALERT_SIMULATION_OUTCOMES_TABLE_EMPTY}
        </p>
        <GettingStartedSteps {...ALERT_SIMULATION_BEHAVIOR_EMPTY_GETTING_STARTED} />
      </div>
    );
  }
  return (
    <EnterpriseTable ariaLabel="Alert simulation outcomes" className={cn("mt-2", OPERATOR_TYPOGRAPHY.body)}>
      <EnterpriseTableHead>
        <EnterpriseTableHeadRow>
          <EnterpriseTableHeaderCell>Review ID</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Match</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Would create</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Suppressed</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Severity</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Title / description</EnterpriseTableHeaderCell>
          <EnterpriseTableHeaderCell>Suppression / dedupe</EnterpriseTableHeaderCell>
        </EnterpriseTableHeadRow>
      </EnterpriseTableHead>
      <EnterpriseTableBody>
        {outcomes.map((o, i) => (
          <EnterpriseTableRow key={`${o.runId ?? "x"}-${i}`}>
            <EnterpriseTableCell className="whitespace-nowrap">{o.runId ?? " — "}</EnterpriseTableCell>
            <EnterpriseTableCell>{o.ruleMatched ? "yes" : "no"}</EnterpriseTableCell>
            <EnterpriseTableCell>{o.wouldCreateAlert ? "yes" : "no"}</EnterpriseTableCell>
            <EnterpriseTableCell>{o.wouldBeSuppressed ? "yes" : "no"}</EnterpriseTableCell>
            <EnterpriseTableCell>{o.severity}</EnterpriseTableCell>
            <EnterpriseTableCell className="align-top">
              <strong>{o.title}</strong>
              <div className="mt-1 text-neutral-600 dark:text-neutral-400">{o.description}</div>
              {o.notes?.length ? (
                <ul className="mt-1.5 pl-[18px] text-neutral-600 dark:text-neutral-400">
                  {o.notes.map((n, j) => (
                    <li key={j}>{n}</li>
                  ))}
                </ul>
              ) : null}
            </EnterpriseTableCell>
            <EnterpriseTableCell className={cn("align-top", OPERATOR_TYPOGRAPHY.helper)}>
              <div>
                <strong>Reason:</strong> {o.suppressionReason || " — "}
              </div>
              <div className="mt-1">
                <strong>Dedupe:</strong> {o.deduplicationKey || " — "}
              </div>
            </EnterpriseTableCell>
          </EnterpriseTableRow>
        ))}
      </EnterpriseTableBody>
    </EnterpriseTable>
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
  const {
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
  } = useAlertSimulation();

  const simpleSimulationReadiness = resolveSimpleSimulationReadiness(
    hasSpecificReviewId,
    recentCountValid,
    thresholdValid,
    reviewScopeValid,
  );

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
                value={Number.isNaN(sThreshold) ? "" : sThreshold}
                onChange={(e) => {
                  setSThresholdTouched(true);
                  const raw = e.target.value;

                  if (raw === "") {
                    setSThreshold(NaN);
                    return;
                  }

                  setSThreshold(Number(raw));
                }}
                aria-invalid={sThresholdTouched && !thresholdValid}
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
            <fieldset className="m-0 grid gap-3 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
              <legend className={cn("px-1", OPERATOR_TYPOGRAPHY.cardTitle)}>Review scope</legend>
              <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {ALERT_SIMULATION_REVIEW_ID_PRECEDENCE}
              </p>
              <div>
                <Label htmlFor="alert-simulation-simple-review-id">Specific review ID (optional)</Label>
                <Input
                  id="alert-simulation-simple-review-id"
                  value={sRunId}
                  onChange={(e) => {
                    setSScopeTouched(true);
                    setSRunId(e.target.value);
                  }}
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
                  disabled={!hasSpecificReviewId}
                  className="mt-1"
                  data-testid="alert-simulation-simple-compared-review-id"
                />
                <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {hasSpecificReviewId
                    ? ALERT_SIMULATION_COMPARED_REVIEW_ID_HELPER
                    : ALERT_SIMULATION_COMPARED_REVIEW_DISABLED_HELPER}
                </span>
              </div>
              <div>
                <Label htmlFor="alert-simulation-simple-recent-count">{ALERT_SIMULATION_RECENT_COUNT_LABEL}</Label>
                <Input
                  id="alert-simulation-simple-recent-count"
                  type="number"
                  min={1}
                  max={50}
                  value={Number.isNaN(sRecent) ? "" : sRecent}
                  onChange={(e) => {
                    setSRecentTouched(true);
                    const raw = e.target.value;

                    if (raw === "") {
                      setSRecent(NaN);
                      return;
                    }

                    setSRecent(Number(raw));
                  }}
                  disabled={hasSpecificReviewId}
                  aria-invalid={sRecentTouched && !hasSpecificReviewId && !recentCountValid}
                  className="mt-1"
                />
                <span className={cn("mt-1 block text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {ALERT_SIMULATION_RECENT_COUNT_HELPER}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="alert-simulation-simple-use-historical-window"
                  checked={sUseHistory}
                  disabled={hasSpecificReviewId}
                  onCheckedChange={(checked) => {
                    setSScopeTouched(true);
                    setSUseHistory(checked === true);
                  }}
                  aria-invalid={sScopeTouched && !hasSpecificReviewId && !reviewScopeValid}
                />
                <Label htmlFor="alert-simulation-simple-use-historical-window">
                  Use historical window (recent reviews)
                </Label>
              </div>
              {hasSpecificReviewId ? (
                <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {ALERT_SIMULATION_SPECIFIC_REVIEW_REPLACES_WINDOW_NOTE}
                </p>
              ) : null}
            </fieldset>
            <WhyDisabledCtaHint
              id="alert-simulation-simple-readiness"
              testId="alert-simulation-simple-readiness"
              reason={simpleFormValid ? null : simpleSimulationReadiness}
            />
            <AlertSimulationRunButton
              testId="alert-simulation-simple-submit"
              onClick={() => void runSimple()}
              disabled={loading || !simpleFormValid}
              busy={loading}
              label="Simulate"
              readinessHintId={simpleFormValid ? undefined : "alert-simulation-simple-readiness"}
            />
            </>
          }
          behavior={
            simpleResult ? (
              <SummaryBlock result={simpleResult} />
            ) : (
              <SimulationBehaviorEmpty />
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
            <AlertSimulationRunButton
              testId="alert-simulation-composite-submit"
              onClick={() => void runComposite()}
              disabled={loading}
              busy={loading}
              label="Simulate"
            />
            </>
          }
          behavior={
            compositeResult ? (
              <SummaryBlock result={compositeResult} />
            ) : (
              <SimulationBehaviorEmpty />
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
            <AlertSimulationRunButton
              testId="alert-simulation-compare-submit"
              onClick={() => void runCompare()}
              disabled={loading}
              busy={loading}
              label="Compare candidates"
            />
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
              <SimulationBehaviorEmpty />
            )
          }
        />
      ) : null}
    </div>
  );
}
