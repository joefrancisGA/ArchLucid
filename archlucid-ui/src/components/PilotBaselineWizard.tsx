"use client";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import Link from "next/link";
import { useCallback, useMemo, useState, type FormEvent, type ReactElement } from "react";

import { BaselineFieldMessage } from "@/components/forms/BaselineFieldMessage";
import { InAppHelpLink } from "@/components/InAppHelpLink";
import { WizardSessionResumePrompt } from "@/components/wizard/WizardSessionResumePrompt";
import { WizardSessionSaveStatus } from "@/components/wizard/WizardSessionSaveStatus";
import { useWizardSessionPersistence } from "@/hooks/use-wizard-session-persistence";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import {
  validatePilotBaselineManualStep,
  validatePilotBaselineReviewStep,
} from "@/lib/pilot-baseline-wizard-validation";
import { PILOT_BASELINE_WIZARD_SAVED_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { showError, showSuccess } from "@/lib/toast";
import { WIZARD_SESSION_IDS, wizardSessionHasTextContent } from "@/lib/wizard-session-persistence";

const STEP_COUNT = 2;

type PilotBaselineSessionState = {
  readonly reviewHours: string;
  readonly reviewNote: string;
  readonly manualPrep: string;
  readonly people: string;
};

export type PilotBaselineWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
};

function parsePositiveHours(raw: string): number | null {
  const t = raw.trim();

  if (t.length === 0) {
    return null;
  }

  const n = Number(t);

  if (!Number.isFinite(n)) {
    return Number.NaN;
  }

  return n;
}

function parsePeopleOrNull(raw: string): number | null {
  const t = raw.trim();

  if (t.length === 0) {
    return null;
  }

  const n = Number(t);

  if (!Number.isFinite(n)) {
    return Number.NaN;
  }

  return n;
}

/** Guided capture for PILOT_ROI_MODEL §3 anchors — persists via `PUT /v1/tenant/baseline`. */

export function PilotBaselineWizard({ open, onOpenChange, onSaved }: PilotBaselineWizardProps): ReactElement {
  const demoMode = isNextPublicDemoMode();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [reviewHours, setReviewHours] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [manualPrep, setManualPrep] = useState("");
  const [people, setPeople] = useState("");
  const sessionState = useMemo<PilotBaselineSessionState>(
    () => ({
      reviewHours,
      reviewNote,
      manualPrep,
      people,
    }),
    [manualPrep, people, reviewHours, reviewNote],
  );
  const reviewStepValidation = useMemo(
    () => validatePilotBaselineReviewStep(reviewHours, reviewNote),
    [reviewHours, reviewNote],
  );
  const manualStepValidation = useMemo(
    () => validatePilotBaselineManualStep(manualPrep, people),
    [manualPrep, people],
  );
  const handleSessionRestore = useCallback((snapshot: { stepIndex: number; state: PilotBaselineSessionState }) => {
    setStepIndex(snapshot.stepIndex);
    setReviewHours(snapshot.state.reviewHours);
    setReviewNote(snapshot.state.reviewNote);
    setManualPrep(snapshot.state.manualPrep);
    setPeople(snapshot.state.people);
  }, []);
  const wizardSession = useWizardSessionPersistence({
    wizardId: WIZARD_SESSION_IDS.pilotBaseline,
    stepIndex,
    state: sessionState,
    enabled: open,
    hasSaveableContent: (state) =>
      wizardSessionHasTextContent(state.reviewHours) ||
      wizardSessionHasTextContent(state.reviewNote) ||
      wizardSessionHasTextContent(state.manualPrep) ||
      wizardSessionHasTextContent(state.people),
    onRestore: handleSessionRestore,
  });

  const pct = Math.round(((stepIndex + 1) / STEP_COUNT) * 100);

  const resetTransientFields = useCallback(() => {
    setStepIndex(0);
    setSaving(false);
    setReviewHours("");
    setReviewNote("");
    setManualPrep("");
    setPeople("");
  }, []);

  const handleDialogChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        resetTransientFields();
      }

      onOpenChange(nextOpen);
    },
    [onOpenChange, resetTransientFields],
  );

  const skipForNow = useCallback(() => {
    handleDialogChange(false);
  }, [handleDialogChange]);

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();

    if (demoMode || saving || !manualStepValidation.valid) {
      return;
    }

    const hours = parsePositiveHours(reviewHours)!;
    const prep = parsePositiveHours(manualPrep)!;
    const peopleN = parsePeopleOrNull(people);

    setSaving(true);

    try {
      const res = await fetch("/api/proxy/v1/tenant/baseline", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify({
          baselineReviewCycleHours: hours,
          baselineReviewCycleSourceNote: reviewNote.trim().length === 0 ? null : reviewNote.trim(),
          manualPrepHoursPerReview: prep,
          peoplePerReview: peopleN === null ? null : peopleN,
        }),
      });

      if (!res.ok) {
        const t = await res.text();
        let detail = t;

        try {
          const p = JSON.parse(t) as { detail?: string };

          if (typeof p.detail === "string") {
            detail = p.detail;
          }
        } catch {
          /* ignore */
        }

        showError("Review-cycle baseline", detail || `Request failed (${res.status})`);

        return;
      }

      showSuccess("Review-cycle baseline saved.");
      wizardSession.clearSession();
      onSaved?.();

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(PILOT_BASELINE_WIZARD_SAVED_EVENT));
      }

      handleDialogChange(false);
    } catch (err) {
      showError("Review-cycle baseline", err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSaving(false);
    }
  }

  const title = stepIndex === 0 ? "Set review-cycle baseline" : "Manual preparation baseline";

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        className="max-h-[calc(100vh-3rem)] w-[min(100vw-2rem,34rem)] max-w-xl overflow-y-auto pb-10 sm:p-8"
        aria-describedby="pilot-baseline-wizard-body"
        data-testid="pilot-baseline-wizard-dialog"
      >
        <DialogHeader className="space-y-4 text-left">
          <DialogDescription className="sr-only">
            Guided wizard for review-cycle and manual preparation baseline hours — saved to your tenant baseline settings.
          </DialogDescription>

          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle>{title}</DialogTitle>

            <InAppHelpLink
              helpSlug="sponsor-report"
              hashFragment="pilot-roi-measurement"
              label="Review ROI methodology"
            />
          </div>

          <div className="space-y-3">
            <div className={cn("flex items-center justify-between font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              <span>
                Step <span className="text-neutral-900 dark:text-neutral-100">{stepIndex + 1}</span> / {STEP_COUNT}
              </span>
              <span>{pct}%</span>
            </div>

            <Progress value={pct} className="h-1.5" />
          </div>
        </DialogHeader>

        <div id="pilot-baseline-wizard-body" className={cn("space-y-4 pb-4 text-neutral-800 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
          {wizardSession.pendingRestore !== null ? (
            <WizardSessionResumePrompt
              onResume={wizardSession.acceptRestore}
              onDismiss={wizardSession.dismissRestore}
            />
          ) : null}
          <div className="flex justify-end">
            <WizardSessionSaveStatus
              saveState={wizardSession.saveState}
              lastSavedUtc={wizardSession.lastSavedUtc}
            />
          </div>
          {demoMode ? (
            <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
              Demo mode hides authenticated baseline persistence — connect a tenant workspace to capture ROI anchors.
            </p>
          ) : stepIndex === 0 ? (
            <div className="space-y-3">
              <p className="m-0 leading-relaxed text-neutral-700 dark:text-neutral-200">
                To estimate ROI later, ArchLucid can compare future review-cycle time against your current process.
                Enter a rough estimate now, or skip and add it later.
              </p>

              <div>
                <Label htmlFor="pilot-baseline-review-hours">Current median hours per architecture review</Label>

                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Estimate the current elapsed effort from request intake to a reviewable package.
                </p>

                <Input
                  id="pilot-baseline-review-hours"
                  type="number"
                  min={0}
                  step="any"
                  className="mt-1"
                  data-testid="pilot-baseline-wizard-review-hours"
                  value={reviewHours}
                  onChange={(x) => setReviewHours(x.target.value)}
                  placeholder="Example: 24"
                  aria-invalid={reviewStepValidation.hoursError !== null}
                />
                <BaselineFieldMessage error={reviewStepValidation.hoursError} />
              </div>

              <div>
                <Label htmlFor="pilot-baseline-review-note">Notes on estimate (optional)</Label>

                <textarea
                  id="pilot-baseline-review-note"
                  className={cn("mt-1 min-h-[72px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-neutral-900 shadow-sm outline-none ring-teal-500/40 placeholder:text-neutral-400 focus-visible:ring-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.body)}
                  maxLength={500}
                  value={reviewNote}
                  onChange={(x) => setReviewNote(x.target.value)}
                  placeholder="Example: Based on last three architecture council reviews."
                  aria-invalid={reviewStepValidation.noteError !== null}
                />
                <BaselineFieldMessage error={reviewStepValidation.noteError} />
              </div>
            </div>
          ) : (
            <form id="pilot-baseline-manual-form" onSubmit={onSubmit} className="space-y-3">
              <p className="m-0 leading-relaxed text-neutral-700 dark:text-neutral-200">
                Roughly how much <strong>manual architecture packaging effort</strong> does one review cycle consume today?
              </p>

              <div>
                <Label htmlFor="pilot-baseline-manual-prep">Manual preparation hours per review</Label>

                <Input
                  id="pilot-baseline-manual-prep"
                  type="number"
                  min={0}
                  step="any"
                  className="mt-1"
                  data-testid="pilot-baseline-wizard-manual-prep"
                  value={manualPrep}
                  onChange={(x) => setManualPrep(x.target.value)}
                  placeholder="Example: 8"
                  required
                  aria-invalid={manualStepValidation.prepError !== null}
                />
                <BaselineFieldMessage error={manualStepValidation.prepError} />
              </div>

              <div>
                <Label htmlFor="pilot-baseline-people">People involved per review (optional)</Label>

                <Input
                  id="pilot-baseline-people"
                  type="number"
                  min={0}
                  step="1"
                  className="mt-1"
                  data-testid="pilot-baseline-wizard-people"
                  value={people}
                  onChange={(x) => setPeople(x.target.value)}
                  aria-invalid={manualStepValidation.peopleError !== null}
                />
                <BaselineFieldMessage error={manualStepValidation.peopleError} />
              </div>
            </form>
          )}
        </div>

        <DialogFooter className="space-y-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
            You can update this later in{" "}
            <Link href="/administration/baseline" className="font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400">
              Settings → Baseline
            </Link>
            .
          </p>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:justify-end">
            <Button
              type="button"
              variant="outline"
              disabled={saving || demoMode}
              data-testid="pilot-baseline-wizard-skip"
              onClick={skipForNow}
            >
              Skip for now
            </Button>

            <Button
              variant="outline"
              type="button"
              disabled={stepIndex === 0 || saving || demoMode}
              onClick={() => setStepIndex((s) => Math.max(0, s - 1))}
            >
              Back
            </Button>

            {stepIndex === 0 ? (
              <Button
                type="button"
                variant="primary"
                disabled={demoMode || !reviewStepValidation.valid}
                data-testid="pilot-baseline-wizard-continue"
                onClick={() => setStepIndex(1)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                form="pilot-baseline-manual-form"
                variant="primary"
                disabled={saving || demoMode || !manualStepValidation.valid}
                data-testid="pilot-baseline-wizard-save"
              >
                {saving ? "Saving…" : "Save baseline"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
