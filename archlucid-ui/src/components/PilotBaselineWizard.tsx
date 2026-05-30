"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent, type ReactElement } from "react";

import { InAppHelpLink } from "@/components/InAppHelpLink";
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
import { showError, showSuccess } from "@/lib/toast";

const STEP_COUNT = 2;

export type PilotBaselineWizardProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
  /** True when the dialog was opened automatically on first visit, not by a user action. */
  autoShown?: boolean;
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

export function PilotBaselineWizard({ open, onOpenChange, onSaved, autoShown }: PilotBaselineWizardProps): ReactElement {
  const demoMode = isNextPublicDemoMode();
  const [stepIndex, setStepIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [reviewHours, setReviewHours] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [manualPrep, setManualPrep] = useState("");
  const [people, setPeople] = useState("");

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
    (open: boolean) => {
      if (!open) {
        resetTransientFields();
      }

      onOpenChange(open);
    },
    [onOpenChange, resetTransientFields],
  );

  function validateReviewStep(): boolean {
    const hours = parsePositiveHours(reviewHours);

    if (Number.isNaN(hours)) {
      showError("Pilot baseline", "Median review-cycle hours must be a positive number.");

      return false;
    }

    if (hours === null || hours <= 0 || hours > 10_000) {
      showError("Pilot baseline", "Median review-cycle hours must be between 0 and 10,000 (exclusive of zero).");

      return false;
    }

    if (reviewNote.trim().length > 500) {
      showError("Pilot baseline", "Estimate note must be 500 characters or fewer.");

      return false;
    }

    return true;
  }

  function validateManualStep(): boolean {
    const prep = parsePositiveHours(manualPrep);

    if (Number.isNaN(prep)) {
      showError("Pilot baseline", "Manual preparation hours must be a positive number.");

      return false;
    }

    if (prep === null || prep <= 0 || prep > 10_000) {
      showError("Pilot baseline", "Manual preparation hours must be between 0 and 10,000 (exclusive of zero).");

      return false;
    }

    const peopleN = parsePeopleOrNull(people);

    if (Number.isNaN(peopleN)) {
      showError("Pilot baseline", "People per review must be a whole number (or leave blank).");

      return false;
    }

    if (peopleN != null && (peopleN <= 0 || peopleN > 10_000 || !Number.isInteger(peopleN))) {
      showError("Pilot baseline", "People per review must be between 1 and 10,000 when set.");

      return false;
    }

    return true;
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault();

    if (demoMode || saving) {
      return;
    }

    if (!validateManualStep()) {
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

        showError("Pilot baseline", detail || `Request failed (${res.status})`);

        return;
      }

      showSuccess("Pilot ROI baselines saved.");
      onSaved?.();
      handleDialogChange(false);
    } catch (err) {
      showError("Pilot baseline", err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSaving(false);
    }
  }

  const title =
    stepIndex === 0 ? "Pilot ROI baseline — review-cycle anchor" : "Pilot ROI baseline — manual preparation";

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent
        className="max-h-[calc(100vh-3rem)] w-[min(100vw-2rem,34rem)] max-w-xl overflow-y-auto pb-10 sm:p-8"
        aria-describedby="pilot-baseline-wizard-body"
        data-testid="pilot-baseline-wizard-dialog"
      >
        <DialogHeader className="space-y-4 text-left">
          <DialogDescription className="sr-only">
            Guided wizard capturing tenant ROI baselines described in docs/library/PILOT_ROI_MODEL.md section 3 — persists via PUT /v1/tenant/baseline.
          </DialogDescription>

          <div className="flex flex-wrap items-center gap-3">
            <DialogTitle>{title}</DialogTitle>

            <InAppHelpLink helpSlug="pilot-roi-model" label="Open pilot ROI model" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-400">
              <span>
                Step <span className="text-neutral-900 dark:text-neutral-100">{stepIndex + 1}</span> / {STEP_COUNT}
              </span>
              <span>{pct}%</span>
            </div>

            <Progress value={pct} className="h-1.5" />
          </div>
        </DialogHeader>

        <div id="pilot-baseline-wizard-body" className="space-y-4 pb-4 text-sm text-neutral-800 dark:text-neutral-100">
          {autoShown && !demoMode ? (
            <p className="m-0 rounded-md border border-teal-200 bg-teal-50 px-3 py-2 text-xs leading-relaxed text-teal-800 dark:border-teal-800 dark:bg-teal-950 dark:text-teal-200">
              ArchLucid opened this automatically because your ROI baseline has not been set yet. These two values power the sponsor-facing ROI exports and the before/after delta view.
            </p>
          ) : null}

          {demoMode ? (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
              Demo mode hides authenticated baseline persistence — connect a tenant workspace to capture ROI anchors.
            </p>
          ) : stepIndex === 0 ? (
            <div className="space-y-3">
              <p className="m-0 leading-relaxed text-neutral-700 dark:text-neutral-200">
                Estimate how long one representative architecture workflow takes today from request to a{" "}
                <strong>reviewable package</strong>. This anchors before vs measured deltas in sponsor-facing exports — see the pilot ROI model link above for narrative guidance.
              </p>

              <div>
                <Label htmlFor="pilot-baseline-review-hours">Median hours (request → reviewable package)</Label>

                <Input
                  id="pilot-baseline-review-hours"
                  type="number"
                  min={0}
                  step="any"
                  className="mt-1"
                  data-testid="pilot-baseline-wizard-review-hours"
                  value={reviewHours}
                  onChange={(x) => setReviewHours(x.target.value)}
                  required
                />
              </div>

              <div>
                <Label htmlFor="pilot-baseline-review-note">How you estimated (optional)</Label>

                <textarea
                  id="pilot-baseline-review-note"
                  className="mt-1 min-h-[72px] w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 shadow-sm outline-none ring-teal-500/40 placeholder:text-neutral-400 focus-visible:ring-2 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-50"
                  maxLength={500}
                  value={reviewNote}
                  onChange={(x) => setReviewNote(x.target.value)}
                  placeholder="Workshop median, architecture council estimate, telemetry snapshot…"
                />
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
                  required
                />
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
                />
              </div>
            </form>
          )}
        </div>

        <DialogFooter className="space-y-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
          <p className="m-0 text-xs text-neutral-500 dark:text-neutral-400">
            You can revisit anytime under{" "}
            <Link href="/settings/baseline" className="font-medium text-teal-700 underline-offset-4 hover:underline dark:text-teal-400">
              Settings → Baseline
            </Link>
            .
          </p>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" type="button" disabled={stepIndex === 0 || saving || demoMode} onClick={() => setStepIndex((s) => Math.max(0, s - 1))}>
              Back
            </Button>

            {stepIndex === 0 ? (
              <Button
                type="button"
                variant="secondary"
                disabled={demoMode}
                data-testid="pilot-baseline-wizard-continue"
                onClick={() => {
                  if (!validateReviewStep()) {
                    return;
                  }

                  setStepIndex(1);
                }}
              >
                Continue
              </Button>
            ) : (
              <Button type="submit" form="pilot-baseline-manual-form" variant="primary" disabled={saving || demoMode} data-testid="pilot-baseline-wizard-save">
                {saving ? "Saving…" : "Save baselines"}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
