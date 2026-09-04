"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmationDialog } from "@/components/ConfirmationDialog";
import { AlertOperatorToolingRankCue } from "@/components/EnterpriseControlsContextHints";
import { CompositeAlertRulesCreateForm } from "@/components/alerts/CompositeAlertRulesCreateForm";
import { CompositeAlertRulesPickReviewBeforeCombiningStrip } from "@/components/alerts/CompositeAlertRulesPickReviewBeforeCombiningStrip";
import { CompositeAlertRulesNextReviewFooterClient } from "@/components/alerts/CompositeAlertRulesNextReviewFooterClient";
import { CompositeAlertRulesTable } from "@/components/alerts/CompositeAlertRulesTable";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { useCompositeAlertRulesListQuery } from "@/components/alerts/use-alert-rules-hub-queries";
import { useOptionalAlertRulesHubRefresh } from "@/lib/alerts-hub-refresh-context";
import { createCompositeAlertRule } from "@/lib/api";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { latestCompositeAlertRulesConfigChange } from "@/lib/composite-alert-rules-config-change";
import {
  formatCompositeAlertRuleCreateConfirmationSummary,
  isCompositeAlertRuleFormValid,
  validateCompositeAlertRuleForm,
  type CompositeAlertRuleFormInput,
} from "@/lib/composite-alert-rules-form";
import {
  resolveCompositeAlertRulesCreateEmphasizedStepId,
  resolveCompositeAlertRulesCreateSteps,
} from "@/lib/composite-alert-rules-create-checklist";
import {
  compositeRulesCreateButtonLabelOperator,
  compositeRulesPageLeadOperator,
  compositeRulesPageLeadOperatorEmpty,
  compositeRulesPageLeadReader,
} from "@/lib/enterprise-controls-context-copy";
import {
  compositeAlertRulesPanelsHrefFromSearch,
  parseCompositeAlertRulesCreateConfirmOpenFromSearch,
  parseCompositeAlertRulesCreatePanelFromSearch,
} from "@/lib/alerts/composite-alert-rules-panels-url";
import {
  OPERATOR_BODY_INLINE_LINK_CLASS,
  OPERATOR_TYPOGRAPHY,
} from "@/lib/design-tokens";
import {
  GOVERNANCE_ALERT_RULES_PATH,
  governanceAlertRulesTabHref,
} from "@/lib/governance/governance-route-paths";
import {
  resolveContinueLastCompositeAlertRule,
  writeCompositeAlertRuleLastViewedId,
} from "@/lib/resolve-continue-last-composite-alert-rule";
import { whyDisabledEnterpriseMutationControl } from "@/lib/why-disabled-cta";

export function CompositeAlertRulesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const scopedRunId = (searchParams.get("runId") ?? "").trim();
  const scopedRunFilterActive = scopedRunId.length > 0;

  const onPickReviewForCombining = useCallback(
    (reviewId: string) => {
      const trimmed = reviewId.trim();

      if (trimmed.length === 0) {
        return;
      }

      const params = new URLSearchParams(searchParams.toString());
      params.set("tab", "advanced-rules");
      params.set("runId", trimmed);

      router.replace(`${GOVERNANCE_ALERT_RULES_PATH}?${params.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const canMutateComposite = useOperateCapability();
  const compositeRulesQuery = useCompositeAlertRulesListQuery();
  const refreshContext = useOptionalAlertRulesHubRefresh();
  const reportTabLoadedRef = useRef(refreshContext?.reportTabLoaded);
  reportTabLoadedRef.current = refreshContext?.reportTabLoaded;
  const items = compositeRulesQuery.items;
  const continueLastRule = useMemo(() => resolveContinueLastCompositeAlertRule(items), [items]);
  const loading = compositeRulesQuery.loading;
  const [mutationFailure, setMutationFailure] = useState<ApiLoadFailureState | null>(null);
  const failure = compositeRulesQuery.failure ?? mutationFailure;
  const urlShowCreate = parseCompositeAlertRulesCreatePanelFromSearch(searchParams.get("create"));
  const urlShowCreateConfirm = parseCompositeAlertRulesCreateConfirmOpenFromSearch(
    searchParams.get("compositeCreateConfirm"),
  );
  const [showCreatePanel, setShowCreatePanelState] = useState(urlShowCreate);
  const [showCreateConfirmation, setShowCreateConfirmationState] = useState(urlShowCreateConfirm);
  const [createBusy, setCreateBusy] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [ruleSaved, setRuleSaved] = useState(false);

  const [name, setName] = useState("");
  const [severity, setSeverity] = useState("High");
  const [joinOperator, setJoinOperator] = useState("And");
  const [suppressionWindowMinutes, setSuppressionWindowMinutes] = useState(1440);
  const [cooldownMinutes, setCooldownMinutes] = useState(60);
  const [dedupeScope, setDedupeScope] = useState("RuleAndRun");

  const [m1, setM1] = useState("CostIncreasePercent");
  const [o1, setO1] = useState("GreaterThanOrEqual");
  const [v1, setV1] = useState(10);

  const [m2, setM2] = useState("NewComplianceGapCount");
  const [o2, setO2] = useState("GreaterThanOrEqual");
  const [v2, setV2] = useState(1);

  const syncCreatePanelToUrl = useCallback(
    (showCreate: boolean) => {
      router.replace(compositeAlertRulesPanelsHrefFromSearch(searchParams.toString(), { showCreatePanel: showCreate }), {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const syncCreateConfirmToUrl = useCallback(
    (confirmOpen: boolean) => {
      router.replace(
        compositeAlertRulesPanelsHrefFromSearch(searchParams.toString(), { showCreateConfirm: confirmOpen }),
        { scroll: false },
      );
    },
    [router, searchParams],
  );

  const setShowCreateConfirmation = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setShowCreateConfirmationState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        syncCreateConfirmToUrl(resolved);

        return resolved;
      });
    },
    [syncCreateConfirmToUrl],
  );

  const setShowCreatePanel = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      setShowCreatePanelState((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        syncCreatePanelToUrl(resolved);

        return resolved;
      });
    },
    [syncCreatePanelToUrl],
  );

  useEffect(() => {
    setShowCreatePanelState(parseCompositeAlertRulesCreatePanelFromSearch(searchParams.get("create")));
    setShowCreateConfirmationState(
      parseCompositeAlertRulesCreateConfirmOpenFromSearch(searchParams.get("compositeCreateConfirm")),
    );
  }, [searchParams]);

  const formInput = useMemo<CompositeAlertRuleFormInput>(
    () => ({
      name,
      severity,
      joinOperator,
      suppressionWindowMinutes,
      cooldownMinutes,
      dedupeScope,
      condition1: { metricType: m1, operator: o1, thresholdValue: v1 },
      condition2: { metricType: m2, operator: o2, thresholdValue: v2 },
    }),
    [cooldownMinutes, dedupeScope, joinOperator, m1, m2, name, o1, o2, severity, suppressionWindowMinutes, v1, v2],
  );
  const fieldErrors = useMemo(() => validateCompositeAlertRuleForm(formInput), [formInput]);
  const formValid = useMemo(() => isCompositeAlertRuleFormValid(formInput), [formInput]);
  const createConfirmationSummary = useMemo(
    () => formatCompositeAlertRuleCreateConfirmationSummary(formInput),
    [formInput],
  );

  const refreshCompositeRulesTab = useCallback(async () => {
    await compositeRulesQuery.refresh();
  }, [compositeRulesQuery.refresh]);

  useEffect(() => {
    if (refreshContext === null) {
      return;
    }

    return refreshContext.registerTabLoader("advanced-rules", refreshCompositeRulesTab);
  }, [refreshCompositeRulesTab, refreshContext]);

  useEffect(() => {
    if (loading || compositeRulesQuery.failure !== null) {
      return;
    }

    reportTabLoadedRef.current?.(
      "advanced-rules",
      items.length,
      latestCompositeAlertRulesConfigChange(items),
    );
  }, [compositeRulesQuery.failure, items, loading]);

  function revealCreatePanel(): void {
    setShowCreatePanel(true);
  }

  async function executeCreate(): Promise<void> {
    if (!canMutateComposite) {
      return;
    }

    setMutationFailure(null);
    setCreateBusy(true);

    try {
      const created = await createCompositeAlertRule({
        name: name.trim(),
        severity,
        operator: joinOperator,
        suppressionWindowMinutes,
        cooldownMinutes,
        reopenDeltaThreshold: 0,
        dedupeScope,
        conditions: [
          { metricType: m1, operator: o1, thresholdValue: v1 },
          { metricType: m2, operator: o2, thresholdValue: v2 },
        ],
      });
      writeCompositeAlertRuleLastViewedId(created.compositeRuleId);
      await compositeRulesQuery.refresh();
      setShowCreateConfirmation(false);
      setSubmitAttempted(false);
      setRuleSaved(true);
    } catch (e) {
      setMutationFailure(toApiLoadFailure(e));
    } finally {
      setCreateBusy(false);
    }
  }

  function onRequestCreate(): void {
    setSubmitAttempted(true);

    if (!formValid) {
      return;
    }

    setShowCreateConfirmation(true);
  }

  function rememberRule(ruleId: string): void {
    writeCompositeAlertRuleLastViewedId(ruleId);
  }

  function openRule(ruleId: string): void {
    rememberRule(ruleId);
    document
      .querySelector(`[data-composite-alert-rule-id="${ruleId}"]`)
      ?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  const isEmpty = items.length === 0;
  const emptyIntroMode =
    scopedRunFilterActive && isEmpty && canMutateComposite && !showCreatePanel && !loading;
  const showCreateForm =
    scopedRunFilterActive && (!canMutateComposite || showCreatePanel || !isEmpty);
  const sectionGap = emptyIntroMode ? "gap-4" : "gap-8";
  const conditionsTabHref = governanceAlertRulesTabHref("rules");
  const mutationDisabledReason = canMutateComposite ? null : whyDisabledEnterpriseMutationControl();
  const mutationDisabledHintId = "composite-rules-mutate-disabled-hint";
  const nameAndSeverityConfigured = name.trim().length > 0 && severity.trim().length > 0;
  const conditionsConfigured =
    fieldErrors.threshold1 === undefined &&
    fieldErrors.threshold2 === undefined &&
    fieldErrors.metrics === undefined &&
    m1.trim().length > 0 &&
    m2.trim().length > 0;
  const compositeCreateSteps = resolveCompositeAlertRulesCreateSteps({
    nameAndSeverityConfigured,
    conditionsConfigured,
    ruleSaved,
  });
  const compositeCreateEmphasizedStepId = resolveCompositeAlertRulesCreateEmphasizedStepId({
    nameAndSeverityConfigured,
    conditionsConfigured,
    ruleSaved,
  });

  return (
    <div>
      <p className={cn("mb-2 leading-snug text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
        {canMutateComposite
          ? emptyIntroMode
            ? compositeRulesPageLeadOperatorEmpty
            : compositeRulesPageLeadOperator
          : compositeRulesPageLeadReader}
      </p>
      <AlertOperatorToolingRankCue />

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {!scopedRunFilterActive ? (
        <CompositeAlertRulesPickReviewBeforeCombiningStrip
          selectedReviewId=""
          onSelectReview={onPickReviewForCombining}
        />
      ) : (
        <p
          className={cn("m-0 mb-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}
          data-testid="composite-alert-rules-run-scope-banner"
        >
          {"Combining rules scoped to review "}
          <span className="font-mono text-al-text-primary">{scopedRunId}</span>
          {" · "}
          <Link className={OPERATOR_BODY_INLINE_LINK_CLASS} href={governanceAlertRulesTabHref("advanced-rules")}>
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

      <div
        className={cn("flex flex-col", sectionGap)}
        data-testid="composite-alert-rules-layout"
        data-empty-intro={emptyIntroMode ? "true" : "false"}
      >
        <CompositeAlertRulesTable
          canMutateComposite={canMutateComposite}
          scopedRunFilterActive={scopedRunFilterActive}
          loading={loading}
          isEmpty={isEmpty}
          emptyIntroMode={emptyIntroMode}
          items={items}
          continueLastRule={continueLastRule}
          conditionsTabHref={conditionsTabHref}
          onRevealCreatePanel={revealCreatePanel}
          onOpenRule={openRule}
          onRememberRule={rememberRule}
        />

        {showCreateForm ? (
          <CompositeAlertRulesCreateForm
            canMutateComposite={canMutateComposite}
            loading={loading}
            formValid={formValid}
            submitAttempted={submitAttempted}
            fieldErrors={fieldErrors}
            mutationDisabledReason={mutationDisabledReason}
            mutationDisabledHintId={mutationDisabledHintId}
            compositeCreateSteps={compositeCreateSteps}
            compositeCreateEmphasizedStepId={compositeCreateEmphasizedStepId}
            name={name}
            setName={setName}
            severity={severity}
            setSeverity={setSeverity}
            joinOperator={joinOperator}
            setJoinOperator={setJoinOperator}
            suppressionWindowMinutes={suppressionWindowMinutes}
            setSuppressionWindowMinutes={setSuppressionWindowMinutes}
            cooldownMinutes={cooldownMinutes}
            setCooldownMinutes={setCooldownMinutes}
            dedupeScope={dedupeScope}
            setDedupeScope={setDedupeScope}
            m1={m1}
            setM1={setM1}
            o1={o1}
            setO1={setO1}
            v1={v1}
            setV1={setV1}
            m2={m2}
            setM2={setM2}
            o2={o2}
            setO2={setO2}
            v2={v2}
            setV2={setV2}
            onRequestCreate={onRequestCreate}
          />
        ) : null}
      </div>

      <ConfirmationDialog
        open={showCreateConfirmation}
        onOpenChange={setShowCreateConfirmation}
        title="Create composite rule?"
        description={createConfirmationSummary}
        confirmLabel={compositeRulesCreateButtonLabelOperator}
        variant="default"
        busy={createBusy}
        onConfirm={() => {
          void executeCreate();
        }}
      />

      {scopedRunFilterActive ? <CompositeAlertRulesNextReviewFooterClient runId={scopedRunId} /> : null}
    </div>
  );
}
