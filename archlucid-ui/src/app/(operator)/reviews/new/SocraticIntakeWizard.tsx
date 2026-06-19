"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";

import { DraftIntakeActorEditor } from "@/components/draft-intake/DraftIntakeActorEditor";
import { DraftIntakeAdvancedSection } from "@/components/draft-intake/DraftIntakeAdvancedSection";
import { DraftIntakeClaimLabel } from "@/components/draft-intake/DraftIntakeClaimLabel";
import { DraftIntakeDecisionReceiptCard } from "@/components/draft-intake/DraftIntakeDecisionReceiptCard";
import { DraftIntakeReasoningPanel } from "@/components/draft-intake/DraftIntakeReasoningPanel";
import { DraftIntakeRequiredClarificationField } from "@/components/draft-intake/DraftIntakeRequiredClarificationField";
import { DraftIntakeWhatIfBranchPanel } from "@/components/draft-intake/DraftIntakeWhatIfBranchPanel";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useLlmMonthlyBudgetExecutionGate } from "@/hooks/use-llm-monthly-budget-execution-gate";
import { LlmMonthlyBudgetExceededBanner } from "@/components/LlmMonthlyBudgetExceededBanner";
import {
  admitDraftRequest,
  answerDraftQuestion,
  createDraftRequest,
  getDraftQuestions,
  patchDraftRequest,
  skipDraftQuestion,
  submitDraftRequest,
} from "@/lib/api/draft-intake-api";
import { comparePageHrefAdaptive } from "@/lib/compare-url-query-params";
import { runDetailHrefWithParentRun } from "@/lib/draft-branch-compare-navigation";
import { isApiRequestError } from "@/lib/api-request-error";
import { recordFirstTenantFunnelEvent } from "@/lib/first-tenant-funnel-telemetry";
import { showError, showSuccess } from "@/lib/toast";
import {
  assertActorSetForAdmission,
  buildSuggestedActorSet,
} from "@/lib/draft-intake-actor-suggestions";
import {
  GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER,
  GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER,
} from "@/lib/guided-intake-copy";
import type { ActorSet, BranchDraftResponse, DraftElicitationQuestion } from "@/types/draft-intake";
import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

const MIN_INTENT_CHARS = 10;
const MIN_OUTCOME_CHARS = 10;

const INTAKE_STEPS = [
  {
    label: "Intent, outcome & actors",
    description: "Describe what you are building, the business result, and who uses the system.",
  },
  {
    label: "Required clarifications",
    description: "Answer a few clarifying questions so ArchLucid can produce a precise review package.",
  },
  { label: "Start review", description: "Submit the admitted draft to the authority pipeline." },
] as const;

export function SocraticIntakeWizard() {
  const router = useRouter();
  const { status: llmBudgetStatus, blocksLlmExecution } = useLlmMonthlyBudgetExecutionGate();

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [submitError, setSubmitError] = useState<unknown | null>(null);

  const [freeTextIntent, setFreeTextIntent] = useState("");
  const [businessOutcome, setBusinessOutcome] = useState("");
  const [systemName, setSystemName] = useState("");
  const [actorSet, setActorSet] = useState<ActorSet>(() => buildSuggestedActorSet(""));

  const [draftId, setDraftId] = useState<string | null>(null);
  const [parentDraftId, setParentDraftId] = useState<string | null>(null);
  const [parentSpawnedRunId, setParentSpawnedRunId] = useState<string | null>(null);
  const [redirectReason, setRedirectReason] = useState<string | null>(null);
  const [redirectVerdict, setRedirectVerdict] = useState<ManifestFeasibilityVerdict | null>(null);
  const [allQuestions, setAllQuestions] = useState<DraftElicitationQuestion[]>([]);
  const [requiredMustQuestionKeys, setRequiredMustQuestionKeys] = useState<string[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<DraftElicitationQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [viewAllClarifications, setViewAllClarifications] = useState(false);

  const totalRequiredClarifications = Math.max(requiredMustQuestionKeys.length, pendingQuestions.length);
  const resolvedClarificationCount = Math.max(0, totalRequiredClarifications - pendingQuestions.length);
  const visiblePendingQuestions = viewAllClarifications
    ? pendingQuestions
    : pendingQuestions.slice(0, 1);

  const canAdvanceIntent =
    freeTextIntent.trim().length >= MIN_INTENT_CHARS &&
    businessOutcome.trim().length >= MIN_OUTCOME_CHARS &&
    actorSet.actors.length > 0 &&
    !busy;

  const allMustAnswered = pendingQuestions.length === 0;
  const canSubmit = draftId !== null && allMustAnswered && !busy && !blocksLlmExecution;

  const stepLabel = useMemo(() => `Step ${step + 1} of ${INTAKE_STEPS.length}`, [step]);

  const refreshQuestions = useCallback(async (id: string) => {
    const questions = await getDraftQuestions(id);
    setAllQuestions(questions.selection.allQuestions);
    setRequiredMustQuestionKeys(questions.selection.requiredMustQuestionKeys);
    setPendingQuestions(questions.selection.pendingMustQuestions);
  }, []);

  const applyBranchDraft = useCallback(
    async (response: BranchDraftResponse) => {
      const branch = response.branch;
      setDraftId(branch.draftId);
      setParentDraftId(response.parentDraftId);
      setParentSpawnedRunId(response.parentSpawnedRunId ?? null);
      setFreeTextIntent(branch.document.freeTextIntent);
      setBusinessOutcome(branch.document.businessOutcome ?? "");
      setSystemName(branch.document.systemName ?? "");
      setActorSet(
        branch.document.actorSet.actors.length > 0
          ? branch.document.actorSet
          : buildSuggestedActorSet(branch.document.freeTextIntent),
      );
      setAnswers({});
      await refreshQuestions(branch.draftId);
      showSuccess("What-if branch created — you are now editing the branch draft.");
    },
    [refreshQuestions],
  );

  const runAdmission = useCallback(async () => {
    setBusy(true);
    setSubmitError(null);
    setRedirectReason(null);
    setRedirectVerdict(null);

    try {
      const created = await createDraftRequest(freeTextIntent.trim());
      const id = created.draftId;
      setDraftId(id);

      await patchDraftRequest(id, {
        freeTextIntent: freeTextIntent.trim(),
        businessOutcome: businessOutcome.trim(),
        systemName: systemName.trim() || undefined,
        actorSet: assertActorSetForAdmission(actorSet),
      });

      const admission = await admitDraftRequest(id);

      if (!admission.admitted) {
        setRedirectReason(admission.redirectReason ?? admission.verdict.summary);
        setRedirectVerdict(admission.verdict);
        showError("Guided intake", admission.redirectReason ?? "Admission gate redirected this draft.");
        return;
      }

      setPendingQuestions(admission.pendingMustQuestions);
      setRequiredMustQuestionKeys(admission.requiredMustQuestionKeys);
      await refreshQuestions(id);
      setViewAllClarifications(false);
      setStep(1);
      showSuccess("Draft admitted — answer the required clarifications to continue.");
    } catch (error) {
      setSubmitError(error);
      if (isApiRequestError(error)) {
        showError("Guided intake", error.message);
      }
    } finally {
      setBusy(false);
    }
  }, [actorSet, businessOutcome, freeTextIntent, refreshQuestions, systemName]);

  const saveAnswer = useCallback(
    async (questionKey: string) => {
      if (draftId === null) {
        return;
      }

      const answer = answers[questionKey]?.trim() ?? "";

      if (answer.length === 0) {
        showError("Guided intake", "Enter an answer or skip the question explicitly.");
        return;
      }

      setBusy(true);
      setSubmitError(null);

      try {
        await answerDraftQuestion(draftId, questionKey, answer);
        await refreshQuestions(draftId);
        showSuccess("Answer recorded.");
      } catch (error) {
        setSubmitError(error);
        if (isApiRequestError(error)) {
          showError("Guided intake", error.message);
        }
      } finally {
        setBusy(false);
      }
    },
    [answers, draftId, refreshQuestions],
  );

  const skipQuestion = useCallback(
    async (questionKey: string) => {
      if (draftId === null) {
        return;
      }

      setBusy(true);
      setSubmitError(null);

      try {
        await skipDraftQuestion(draftId, questionKey);
        await refreshQuestions(draftId);
        showSuccess("Question skipped — recorded on the transparency trail.");
      } catch (error) {
        setSubmitError(error);
        if (isApiRequestError(error)) {
          showError("Guided intake", error.message);
        }
      } finally {
        setBusy(false);
      }
    },
    [draftId, refreshQuestions],
  );

  const submitDraft = useCallback(async () => {
    if (draftId === null) {
      return;
    }

    setBusy(true);
    setSubmitError(null);

    try {
      const result = await submitDraftRequest(draftId);
      recordFirstTenantFunnelEvent("first_run_started");

      const compareParentRunId = result.parentSpawnedRunId ?? parentSpawnedRunId;

      if (compareParentRunId !== null && compareParentRunId.trim().length > 0) {
        showSuccess("What-if branch review started — open Compare when both manifests are ready.");
        router.push(runDetailHrefWithParentRun(result.runId, compareParentRunId));
        return;
      }

      showSuccess("Architecture review started from guided intake.");
      router.push(`/reviews/${result.runId}`);
    } catch (error) {
      setSubmitError(error);
      if (isApiRequestError(error)) {
        showError("Guided intake", error.message);
      }
    } finally {
      setBusy(false);
    }
  }, [draftId, parentSpawnedRunId, router]);

  return (
    <div className="space-y-4" data-testid="socratic-intake-wizard">
      <p className="text-sm text-neutral-600 dark:text-neutral-400" data-testid="socratic-intake-progress">
        {stepLabel} — {INTAKE_STEPS[step]?.label}
      </p>
      <DraftIntakeClaimLabel surface="structural-admission" />

      {llmBudgetStatus !== null ? <LlmMonthlyBudgetExceededBanner status={llmBudgetStatus} /> : null}

      {submitError !== null ? (
        <OperatorApiProblem
          problem={isApiRequestError(submitError) ? submitError.problem : null}
          fallbackMessage={
            isApiRequestError(submitError) ? submitError.message : "Guided intake request failed."
          }
        />
      ) : null}

      {parentDraftId !== null ? (
        <Card className="border-sky-300 bg-sky-50 dark:border-sky-800 dark:bg-sky-950/40">
          <CardHeader>
            <CardTitle className="text-base">What-if branch</CardTitle>
            <CardDescription>
              Editing branch draft {draftId} forked from parent {parentDraftId}. Submit as a separate review, then Compare.
              {parentSpawnedRunId !== null ? (
                <>
                  {" "}
                  Parent review{" "}
                  <Link
                    href={comparePageHrefAdaptive(parentSpawnedRunId)}
                    className="font-medium text-sky-900 underline dark:text-sky-200"
                  >
                    {parentSpawnedRunId}
                  </Link>{" "}
                  is already spawned — after submit you can compare outcomes immediately.
                </>
              ) : null}
            </CardDescription>
          </CardHeader>
        </Card>
      ) : null}

      {redirectReason !== null && redirectVerdict !== null && draftId !== null ? (
        <DraftIntakeDecisionReceiptCard
          draftId={draftId}
          redirectReason={redirectReason}
          verdict={redirectVerdict}
          freeTextIntent={freeTextIntent}
          businessOutcome={businessOutcome}
          systemName={systemName}
        />
      ) : null}

      {step === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>{INTAKE_STEPS[0].label}</CardTitle>
            <CardDescription>{INTAKE_STEPS[0].description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="socratic-intent">Architecture intent (required)</Label>
              <Textarea
                id="socratic-intent"
                value={freeTextIntent}
                onChange={(event) => setFreeTextIntent(event.target.value)}
                rows={3}
                disabled={busy}
                placeholder={GUIDED_INTAKE_ARCHITECTURE_INTENT_PLACEHOLDER}
                data-testid="socratic-intent"
              />
              <p className="text-xs text-neutral-500">Minimum {MIN_INTENT_CHARS} characters.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="socratic-outcome">Business outcome (required)</Label>
              <Textarea
                id="socratic-outcome"
                value={businessOutcome}
                onChange={(event) => setBusinessOutcome(event.target.value)}
                rows={2}
                disabled={busy}
                placeholder={GUIDED_INTAKE_BUSINESS_OUTCOME_PLACEHOLDER}
                data-testid="socratic-outcome"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="socratic-system-name">System name (optional)</Label>
              <Input
                id="socratic-system-name"
                value={systemName}
                onChange={(event) => setSystemName(event.target.value)}
                disabled={busy}
                data-testid="socratic-system-name"
              />
            </div>
            <DraftIntakeActorEditor
              actorSet={actorSet}
              disabled={busy}
              onChange={setActorSet}
              onResuggest={() => {
                setActorSet(buildSuggestedActorSet(freeTextIntent));
              }}
            />
            <Button
              type="button"
              disabled={!canAdvanceIntent}
              onClick={() => {
                void runAdmission();
              }}
              data-testid="socratic-admit"
            >
              {busy ? "Checking admission…" : "Continue"}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {step === 1 ? (
        <Card>
          <CardHeader>
            <CardTitle>{INTAKE_STEPS[1].label}</CardTitle>
            <CardDescription>
              {pendingQuestions.length === 0
                ? "All required clarifications are answered or skipped. You can continue."
                : `${pendingQuestions.length} required clarification${pendingQuestions.length === 1 ? "" : "s"} remaining before review.`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {visiblePendingQuestions.map((question, index) => (
              <DraftIntakeRequiredClarificationField
                key={question.questionKey}
                question={question}
                answer={answers[question.questionKey] ?? ""}
                busy={busy}
                clarificationIndex={resolvedClarificationCount + index + 1}
                clarificationTotal={totalRequiredClarifications}
                compactActions={viewAllClarifications}
                onAnswerChange={(questionKey, value) => {
                  setAnswers((current) => ({
                    ...current,
                    [questionKey]: value,
                  }));
                }}
                onSave={(questionKey) => {
                  void saveAnswer(questionKey);
                }}
                onSkip={(questionKey) => {
                  void skipQuestion(questionKey);
                }}
              />
            ))}

            {pendingQuestions.length > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={busy}
                data-testid="socratic-view-all-clarifications"
                onClick={() => {
                  setViewAllClarifications((current) => !current);
                }}
              >
                {viewAllClarifications ? "Show one at a time" : "View all clarifications"}
              </Button>
            ) : null}

            <div className="space-y-2">
              <Button
                type="button"
                disabled={!allMustAnswered || busy}
                onClick={() => setStep(2)}
                data-testid="socratic-questions-done"
              >
                Review & submit
              </Button>
              {!allMustAnswered ? (
                <p className="m-0 text-sm text-neutral-500" data-testid="socratic-submit-hint">
                  Answer or skip all required clarifications to continue.
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      {draftId !== null && step === 1 ? (
        <DraftIntakeReasoningPanel
          draftId={draftId}
          disabled={busy || blocksLlmExecution}
          defaultOpen={false}
        />
      ) : null}

      {draftId !== null && step === 1 ? (
        <DraftIntakeAdvancedSection defaultOpen={false}>
          <DraftIntakeWhatIfBranchPanel
            draftId={draftId}
            intent={freeTextIntent}
            outcome={businessOutcome}
            systemName={systemName}
            questionOptions={allQuestions}
            disabled={busy}
            onBranched={(response) => {
              void applyBranchDraft(response);
            }}
          />
        </DraftIntakeAdvancedSection>
      ) : null}

      {step === 2 ? (
        <Card>
          <CardHeader>
            <CardTitle>{INTAKE_STEPS[2].label}</CardTitle>
            <CardDescription>
              Submit launches the canonical review-create path — same authority pipeline as other review entry points.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-700 dark:text-neutral-300">
              <li>Intent: {freeTextIntent.trim().slice(0, 120)}{freeTextIntent.trim().length > 120 ? "…" : ""}</li>
              <li>Outcome: {businessOutcome.trim()}</li>
              {systemName.trim() ? <li>System: {systemName.trim()}</li> : null}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" disabled={busy} onClick={() => setStep(1)}>
                Back to questions
              </Button>
              <Button
                type="button"
                disabled={!canSubmit}
                onClick={() => {
                  void submitDraft();
                }}
                data-testid="socratic-submit"
              >
                {busy ? "Starting review…" : "Start architecture review"}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
