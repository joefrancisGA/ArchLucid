"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { useWizardStepNavigation } from "@/hooks/use-wizard-step-navigation";
import { architectureDraftDisplayName } from "@/lib/architecture/architecture-draft-status";
import { SOURCE_ARCHITECTURE_QUERY_PARAM } from "@/lib/architecture/architecture-routes";
import {
  isCreateArchitectureIntent,
  resolveArchitectureWorkflowIntent,
} from "@/lib/architecture/architecture-workflow-intent";
import { resolveReviewIntakeExampleTemplateFromSearchParams } from "@/lib/operator/operator-home-example-request";
import { POLICY_PACK_ID_QUERY_PARAM } from "@/lib/policy/policy-packs-deep-link";
import { deriveGuidedIntakePolicyPackCloudMismatch } from "@/lib/review-quality/guided-intake-policy-pack-cloud-mismatch";
import { readPriorRunIdFromSearch } from "@/lib/second-review-prior-package";
import { WIZARD_SESSION_IDS, wizardSessionHasTextContent } from "@/lib/wizard-session-persistence";

import {
  INTAKE_STEPS,
  INTAKE_STEP_DEFINITIONS,
  type GuidedIntakeSessionState,
} from "./guided-intake-steps";
import { useGuidedIntakeBriefForm } from "./use-guided-intake-brief-form";
import { useGuidedIntakeDraftWorkflow } from "./use-guided-intake-draft-workflow";

/**
 * Everything `SocraticIntakeWizard` renders from: the brief form, the draft workflow, step
 * navigation, resume-from-session, and the gates that combine the three.
 *
 * The component is left as pure markup so a copy or layout change never has to be made inside a
 * request pipeline, and so the pipeline can be reasoned about without reading 400 lines of JSX.
 */
export function useGuidedIntakeWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { status: llmBudgetStatus, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();

  const exampleTemplate = useMemo(
    () =>
      resolveReviewIntakeExampleTemplateFromSearchParams((key) => searchParams?.get(key) ?? null).template,
    [searchParams],
  );

  const workflowIntent = useMemo(
    () => resolveArchitectureWorkflowIntent((key) => searchParams?.get(key) ?? null),
    [searchParams],
  );
  const isCreateArchitectureFlow = isCreateArchitectureIntent(workflowIntent);
  const sourceArchitectureId = searchParams?.get(SOURCE_ARCHITECTURE_QUERY_PARAM)?.trim() ?? "";
  const deeplinkPolicyPackId = searchParams?.get(POLICY_PACK_ID_QUERY_PARAM)?.trim() ?? "";
  const priorRunId = readPriorRunIdFromSearch(searchParams);

  const { stepIndex: step, setStepIndex: setStep } = useWizardStepNavigation({
    steps: INTAKE_STEP_DEFINITIONS,
    telemetryWizardName: "SocraticIntake",
  });

  const form = useGuidedIntakeBriefForm({ exampleTemplate, isCreateArchitectureFlow });

  // The session snapshot includes workflow state (draft id, answers), so the persistence hook has to
  // be created after the workflow — the workflow reaches it through this ref instead.
  const clearSessionRef = useRef<() => void>(() => {});
  const clearSession = useCallback(() => {
    clearSessionRef.current();
  }, []);
  const navigate = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router],
  );

  const workflow = useGuidedIntakeDraftWorkflow({
    form,
    isCreateArchitectureFlow,
    sourceArchitectureId,
    priorRunId,
    setStep,
    navigate,
    clearSession,
  });

  const sessionState = useMemo<GuidedIntakeSessionState>(
    () => ({
      freeTextIntent: form.freeTextIntent,
      businessOutcome: form.businessOutcome,
      systemName: form.systemName,
      actorSet: form.actorSet,
      answers: workflow.answers,
      draftId: workflow.draftId,
    }),
    [
      form.actorSet,
      form.businessOutcome,
      form.freeTextIntent,
      form.systemName,
      workflow.answers,
      workflow.draftId,
    ],
  );

  const handleSessionRestore = useCallback(
    (snapshot: { stepIndex: number; state: GuidedIntakeSessionState }) => {
      setStep(snapshot.stepIndex);
      form.setFreeTextIntent(snapshot.state.freeTextIntent);
      form.setBusinessOutcome(snapshot.state.businessOutcome);
      form.setSystemName(snapshot.state.systemName);
      form.setActorSet(snapshot.state.actorSet);
      workflow.setAnswers(snapshot.state.answers);
      workflow.setDraftId(snapshot.state.draftId);
    },
    [form, setStep, workflow],
  );

  const wizardSession = useWizardSessionPersistence({
    wizardId: WIZARD_SESSION_IDS.reviewsNewGuidedQuestions,
    stepIndex: step,
    state: sessionState,
    hasSaveableContent: (state, currentStep) =>
      currentStep > 0 ||
      wizardSessionHasTextContent(state.freeTextIntent) ||
      wizardSessionHasTextContent(state.businessOutcome) ||
      wizardSessionHasTextContent(state.systemName) ||
      state.draftId !== null,
    onRestore: handleSessionRestore,
  });

  useEffect(() => {
    clearSessionRef.current = wizardSession.clearSession;
  }, [wizardSession.clearSession]);

  const policyPackCloudMismatch = useMemo(
    () =>
      deriveGuidedIntakePolicyPackCloudMismatch(
        form.focusedPilotModeEnabled,
        deeplinkPolicyPackId.length > 0 ? deeplinkPolicyPackId : null,
        workflow.answers,
      ),
    [deeplinkPolicyPackId, form.focusedPilotModeEnabled, workflow.answers],
  );

  const canAdvanceIntent = form.advanceBlockers.length === 0 && !workflow.busy;
  const canReviewAnswers = workflow.allClarificationsHandled && !workflow.busy;
  // Scope is gated on step 0 and already persisted on the draft, so it is not re-gated here.
  const canSubmit =
    workflow.draftId !== null &&
    workflow.allClarificationsHandled &&
    !workflow.busy &&
    !blocksLlmExecution &&
    policyPackCloudMismatch === null;

  const stepLabel = useMemo(() => `Step ${step + 1} of ${INTAKE_STEPS.length}`, [step]);

  // Prefer system name / intent for the saved-architecture banner; keep the GUID in the draft href only.
  const sourceArchitectureDisplayName = useMemo(
    () => architectureDraftDisplayName(form.systemName, form.freeTextIntent),
    [form.freeTextIntent, form.systemName],
  );

  return {
    ...form,
    ...workflow,
    step,
    setStep,
    exampleTemplate,
    isCreateArchitectureFlow,
    sourceArchitectureId,
    sourceArchitectureDisplayName,
    llmBudgetStatus,
    blocksLlmExecution,
    wizardSession,
    canAdvanceIntent,
    canReviewAnswers,
    canSubmit,
    policyPackCloudMismatch,
    stepLabel,
  };
}
