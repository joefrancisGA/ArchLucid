"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { BaselineRoiVocabularyRail } from "@/components/BaselineRoiVocabularyRail";
import { DemoUnavailableNotice } from "@/components/DemoUnavailableNotice";
import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  BASELINE_SETTINGS_CONSERVATIVE_DEFAULTS_NOTE,
  BASELINE_SETTINGS_PAGE_SUBTITLE,
  BASELINE_SETTINGS_USED_IN_SURFACES,
  baselineSettingsStatusLabel,
  formatBaselineLastUpdated,
  resolveBaselineLastUpdatedUtc,
  resolveBaselineRoiModelLabel,
  resolveBaselineSaveToastMessage,
  resolveBaselineSettingsStatus,
  type TenantBaselineSnapshot,
  validateBaselineManualPrepHours,
  validateBaselinePeoplePerReview,
  validateBaselineReviewCycleHours,
} from "@/lib/baseline-settings-present";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { showError, showSuccess } from "@/lib/toast";

function parseNumberOrNull(raw: string): number | null {
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

function formatBaselineReviewSourceNoteDisplay(source: string | null | undefined): string | null {
  if (source === null || source === undefined) {
    return null;
  }

  const t = source.trim();

  if (t.length === 0) {
    return null;
  }

  const marker = "baseline_settings";

  if (t.toLowerCase() === marker) {
    return null;
  }

  const prefix = `${marker}:`;

  if (t.toLowerCase().startsWith(prefix)) {
    const tail = t.slice(prefix.length).trim();

    return tail.length === 0 ? null : tail;
  }

  return t;
}

function snapshotFromForm(
  reviewHours: string,
  reviewNote: string,
  manualPrep: string,
  people: string,
): TenantBaselineSnapshot {
  const reviewParsed = parseNumberOrNull(reviewHours);
  const prepParsed = parseNumberOrNull(manualPrep);
  const peopleParsed = parseNumberOrNull(people);

  return {
    manualPrepHoursPerReview: Number.isNaN(prepParsed) ? null : prepParsed,
    peoplePerReview: Number.isNaN(peopleParsed) ? null : peopleParsed,
    capturedUtc: null,
    baselineReviewCycleHours: Number.isNaN(reviewParsed) ? null : reviewParsed,
    baselineReviewCycleSource: reviewNote.trim().length > 0 ? reviewNote.trim() : null,
    baselineReviewCycleCapturedUtc: null,
  };
}

function applySnapshotToFields(
  data: TenantBaselineSnapshot,
  setters: {
    setManualPrep: (value: string) => void;
    setPeople: (value: string) => void;
    setReviewHours: (value: string) => void;
    setReviewNote: (value: string) => void;
  },
): void {
  setters.setManualPrep(
    data.manualPrepHoursPerReview != null && Number.isFinite(data.manualPrepHoursPerReview)
      ? String(data.manualPrepHoursPerReview)
      : "",
  );
  setters.setPeople(
    data.peoplePerReview != null && Number.isFinite(data.peoplePerReview) ? String(data.peoplePerReview) : "",
  );
  setters.setReviewHours(
    data.baselineReviewCycleHours != null && Number.isFinite(data.baselineReviewCycleHours)
      ? String(data.baselineReviewCycleHours)
      : "",
  );
  setters.setReviewNote(formatBaselineReviewSourceNoteDisplay(data.baselineReviewCycleSource) ?? "");
}

type FieldMessageProps = {
  readonly error: string | null;
  readonly warning: string | null;
};

function FieldMessage(props: FieldMessageProps) {
  if (props.error) {
    return (
      <p className={cn("m-0 mt-1 text-red-700 dark:text-red-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
        {props.error}
      </p>
    );
  }

  if (props.warning) {
    return (
      <p className={cn("m-0 mt-1 text-amber-800 dark:text-amber-200", OPERATOR_TYPOGRAPHY.helper)} role="status">
        {props.warning}
      </p>
    );
  }

  return null;
}

/** Client UI for ROI baseline measurement fields (loads/saves `/v1/tenant/baseline` via proxy). */
export function BaselineSettingsClient() {
  const [loadFailure, setLoadFailure] = useState<ApiLoadFailureState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [manualPrep, setManualPrep] = useState("");
  const [people, setPeople] = useState("");
  const [reviewHours, setReviewHours] = useState("");
  const [reviewNote, setReviewNote] = useState("");
  const [loadedSnapshot, setLoadedSnapshot] = useState<TenantBaselineSnapshot | null>(null);
  const demoMode = isNextPublicDemoMode();

  const reviewValidation = useMemo(() => validateBaselineReviewCycleHours(reviewHours), [reviewHours]);
  const prepValidation = useMemo(() => validateBaselineManualPrepHours(manualPrep), [manualPrep]);
  const peopleValidation = useMemo(() => validateBaselinePeoplePerReview(people), [people]);

  const displaySnapshot = useMemo(
    () => loadedSnapshot ?? snapshotFromForm(reviewHours, reviewNote, manualPrep, people),
    [loadedSnapshot, reviewHours, reviewNote, manualPrep, people],
  );

  const baselineStatus = resolveBaselineSettingsStatus(displaySnapshot);
  const roiModelLabel = resolveBaselineRoiModelLabel(displaySnapshot);
  const lastUpdatedLabel = formatBaselineLastUpdated(resolveBaselineLastUpdatedUtc(displaySnapshot));

  const load = useCallback(async () => {
    if (demoMode) {
      return;
    }

    setLoading(true);
    setLoadFailure(null);

    try {
      const res = await fetch("/api/proxy/v1/tenant/baseline", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const t = await res.text();

        throw { status: res.status, body: t };
      }

      const data = (await res.json()) as TenantBaselineSnapshot;

      setLoadedSnapshot(data);
      applySnapshotToFields(data, {
        setManualPrep,
        setPeople,
        setReviewHours,
        setReviewNote,
      });
    } catch (e) {
      setLoadFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    if (demoMode) {
      setLoading(false);

      return;
    }

    void load();
  }, [demoMode, load]);

  async function persistBaseline(clearAll: boolean): Promise<void> {
    if (demoMode) {
      return;
    }

    const reviewTrim = clearAll ? "" : reviewHours.trim();
    const prepTrim = clearAll ? "" : manualPrep.trim();
    const peopleTrim = clearAll ? "" : people.trim();
    const noteTrim = clearAll ? "" : reviewNote.trim();

    if (!clearAll) {
      if (reviewValidation.error || prepValidation.error || peopleValidation.error) {
        showError("Baseline", "Fix the highlighted fields before saving.");

        return;
      }

      if (noteTrim.length > 500) {
        showError("Baseline", "Review-cycle estimate note must be 500 characters or fewer.");

        return;
      }
    }

    const prepN = clearAll ? null : parseNumberOrNull(prepTrim);
    const peopleN = clearAll ? null : parseNumberOrNull(peopleTrim);
    let reviewParsed: number | null = null;

    if (!clearAll && reviewTrim.length > 0) {
      reviewParsed = parseNumberOrNull(reviewTrim);

      if (Number.isNaN(reviewParsed) || reviewParsed === null || reviewParsed <= 0 || reviewParsed > 10_000) {
        showError("Baseline", "Median review-cycle hours must be a positive number up to 10,000.");

        return;
      }
    }

    if (!clearAll && prepTrim.length > 0 && (Number.isNaN(prepN) || prepN === null || prepN <= 0 || prepN > 10_000)) {
      showError("Baseline", "Manual preparation hours must be a positive number up to 10,000.");

      return;
    }

    if (!clearAll && peopleTrim.length > 0 && (Number.isNaN(peopleN) || peopleN === null || peopleN <= 0 || peopleN > 10_000)) {
      showError("Baseline", "People involved must be a positive number up to 10,000.");

      return;
    }

    setSaving(true);

    try {
      const payload: Record<string, unknown> = {
        manualPrepHoursPerReview: prepTrim === "" ? null : prepN,
        peoplePerReview: peopleTrim === "" ? null : peopleN,
      };

      if (reviewTrim.length > 0 && reviewParsed !== null) {
        payload.baselineReviewCycleHours = reviewParsed;
        payload.baselineReviewCycleSourceNote = noteTrim.length === 0 ? null : noteTrim;
      } else {
        payload.baselineReviewCycleHours = null;
        payload.baselineReviewCycleSourceNote = null;
      }

      const res = await fetch("/api/proxy/v1/tenant/baseline", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
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

        showError("Baseline", detail || `Request failed (${res.status})`);

        return;
      }

      const savedDraft = {
        manualPrepHoursPerReview: prepTrim === "" ? null : prepN,
        peoplePerReview: peopleTrim === "" ? null : peopleN,
        baselineReviewCycleHours: reviewTrim === "" ? null : reviewParsed,
      };

      showSuccess(resolveBaselineSaveToastMessage(savedDraft));
      await load();
    } catch (err) {
      showError("Baseline", err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onSave(e: FormEvent): Promise<void> {
    e.preventDefault();

    await persistBaseline(false);
  }

  function onUseConservativeDefaults(): void {
    setManualPrep("");
    setPeople("");
    setReviewHours("");
    setReviewNote("");
    void persistBaseline(true);
  }

  function onResetToLoaded(): void {
    if (loadedSnapshot === null) {
      setManualPrep("");
      setPeople("");
      setReviewHours("");
      setReviewNote("");

      return;
    }

    applySnapshotToFields(loadedSnapshot, {
      setManualPrep,
      setPeople,
      setReviewHours,
      setReviewNote,
    });
  }

  const hasValidationErrors =
    reviewValidation.error !== null || prepValidation.error !== null || peopleValidation.error !== null;

  return (
    <div className="w-full max-w-3xl space-y-6 pb-24">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Baseline settings — ROI measurement</h1>
          <p className={cn("mt-1 max-w-3xl text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            {BASELINE_SETTINGS_PAGE_SUBTITLE}
          </p>
        </div>
        <PageContextualHelpButton />
      </div>
      <BaselineRoiVocabularyRail currentSurfaceId="baseline" />
{demoMode ? (
        <DemoUnavailableNotice
          title="Baseline settings"
          description="ROI baseline measurement requires a connected deployment and tenant API access."
        />
      ) : null}

      {!demoMode && loadFailure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={loadFailure.problem}
            fallbackMessage={loadFailure.message}
            correlationId={loadFailure.correlationId}
          />
        </div>
      ) : null}

      {!demoMode && !loading && loadedSnapshot !== null ? (
        <>
          <section
            className="rounded-lg border border-neutral-200 bg-neutral-50/80 p-4 dark:border-neutral-700 dark:bg-neutral-900/40"
            data-testid="baseline-settings-summary"
          >
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Baseline summary
            </h2>
            <dl className={cn("m-0 mt-3 grid gap-3 sm:grid-cols-2", OPERATOR_TYPOGRAPHY.body)}>
              <div>
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Baseline status</dt>
                <dd className={cn("m-0 mt-0.5 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {baselineSettingsStatusLabel(baselineStatus)}
                </dd>
              </div>
              <div>
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>ROI model</dt>
                <dd className={cn("m-0 mt-0.5 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {roiModelLabel}
                </dd>
              </div>
              <div>
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Last updated</dt>
                <dd
                  className={cn("m-0 mt-0.5 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}
                  data-testid="baseline-settings-last-updated"
                >
                  {lastUpdatedLabel}
                </dd>
              </div>
              <div>
                <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>Used in</dt>
                <dd className={cn("m-0 mt-0.5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  {BASELINE_SETTINGS_USED_IN_SURFACES.join(", ")}
                </dd>
              </div>
            </dl>
          </section>

          <section
            className="rounded-lg border border-sky-200 bg-sky-50/60 p-4 dark:border-sky-900 dark:bg-sky-950/20"
            data-testid="baseline-settings-recommended-path"
          >
            <h2 className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>
              Recommended path
            </h2>
            <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {BASELINE_SETTINGS_CONSERVATIVE_DEFAULTS_NOTE}
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start">
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="default"
                  data-testid="baseline-open-guided-wizard"
                  onClick={() => {
                    window.dispatchEvent(new Event(PILOT_BASELINE_WIZARD_OPEN_EVENT));
                  }}
                >
                  Open guided baseline wizard
                </Button>
                <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Recommended if you are not sure what values to enter.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                data-testid="baseline-use-conservative-defaults"
                disabled={saving}
                onClick={() => {
                  void onUseConservativeDefaults();
                }}
              >
                Use conservative defaults
              </Button>
            </div>
          </section>

          <form onSubmit={onSave} className="space-y-8">
            <section className="space-y-4" aria-labelledby="baseline-review-cycle-heading">
              <div
                className={cn(
                  "rounded-md border border-neutral-200 bg-neutral-50 px-3 py-3 dark:border-neutral-700 dark:bg-neutral-900/40",
                  OPERATOR_TYPOGRAPHY.helper,
                )}
              >
                <h2
                  id="baseline-review-cycle-heading"
                  className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
                >
                  Review cycle baseline
                </h2>
                <p className={cn("m-0 mt-1 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                  Estimate the typical effort required to move from architecture request to reviewable package before
                  ArchLucid.
                </p>
                <p className={cn("m-0 mt-2 leading-relaxed text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  These values are used only to estimate value in reports. They do not affect review findings or
                  governance decisions.
                </p>
              </div>

              <div>
                <Label htmlFor="baseline-review-cycle-hours">Median review-cycle hours (optional)</Label>
                <Input
                  id="baseline-review-cycle-hours"
                  type="number"
                  min={0}
                  step="any"
                  className="mt-1 max-w-md"
                  placeholder="Example: 12"
                  data-testid="baseline-review-cycle-hours"
                  value={reviewHours}
                  onChange={(x) => setReviewHours(x.target.value)}
                />
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Typical total elapsed effort across the team for one architecture review cycle.
                </p>
                <FieldMessage error={reviewValidation.error} warning={reviewValidation.warning} />
              </div>
            </section>

            <section className="space-y-4" aria-labelledby="baseline-manual-prep-heading">
              <h2
                id="baseline-manual-prep-heading"
                className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Manual preparation effort
              </h2>

              <div>
                <Label htmlFor="baseline-prep">Manual preparation hours per review (optional)</Label>
                <Input
                  id="baseline-prep"
                  type="number"
                  min={0}
                  step="any"
                  className="mt-1 max-w-md"
                  data-testid="baseline-manual-prep"
                  value={manualPrep}
                  onChange={(x) => setManualPrep(x.target.value)}
                />
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Time spent collecting diagrams, documents, screenshots, IaC exports, and context before review.
                </p>
                <FieldMessage error={prepValidation.error} warning={prepValidation.warning} />
              </div>
            </section>

            <section className="space-y-4" aria-labelledby="baseline-people-heading">
              <h2
                id="baseline-people-heading"
                className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                People involved
              </h2>

              <div>
                <Label htmlFor="baseline-people">People involved per review (optional)</Label>
                <Input
                  id="baseline-people"
                  type="number"
                  min={0}
                  step="1"
                  className="mt-1 max-w-md"
                  data-testid="baseline-people"
                  value={people}
                  onChange={(x) => setPeople(x.target.value)}
                />
                <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                  Approximate number of architects, reviewers, engineers, or stakeholders involved.
                </p>
                <FieldMessage error={peopleValidation.error} warning={peopleValidation.warning} />
              </div>
            </section>

            <section className="space-y-4" aria-labelledby="baseline-estimate-source-heading">
              <h2
                id="baseline-estimate-source-heading"
                className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Estimate source
              </h2>

              <div>
                <Label htmlFor="baseline-review-cycle-note">How you estimated review-cycle hours (optional)</Label>
                <textarea
                  id="baseline-review-cycle-note"
                  className={cn(
                    "mt-1 min-h-[72px] w-full max-w-2xl rounded-md border border-neutral-300 bg-white px-3 py-2 text-al-text-primary shadow-sm outline-none ring-teal-500/40 placeholder:text-neutral-400 focus-visible:ring-2 dark:border-neutral-700 dark:bg-neutral-950",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  maxLength={500}
                  data-testid="baseline-review-cycle-note"
                  value={reviewNote}
                  onChange={(x) => setReviewNote(x.target.value)}
                  placeholder="Example: median from prior reviews, workshop estimate, or team lead estimate."
                />
              </div>
            </section>

            <section
              className="rounded-md border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-700 dark:bg-neutral-900"
              aria-labelledby="baseline-methodology-heading"
              data-testid="baseline-settings-methodology"
            >
              <h2
                id="baseline-methodology-heading"
                className={cn("m-0 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}
              >
                Assumptions and methodology
              </h2>
              <ul className={cn("m-0 mt-3 list-disc space-y-2 pl-5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                <li>ArchLucid uses conservative defaults when workspace-specific values are not provided.</li>
                <li>ROI estimates are shown as estimates, not guaranteed savings.</li>
                <li>Measured review data takes precedence when available.</li>
              </ul>
            </section>

            <div
              className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-2 border-t border-neutral-200 bg-white/95 px-1 py-3 backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95"
              data-testid="baseline-settings-actions"
            >
              <Button
                type="submit"
                disabled={saving || hasValidationErrors}
                variant="primary"
                data-testid="baseline-save"
              >
                {saving ? "Saving…" : "Save"}
              </Button>
              <Button type="button" variant="outline" disabled={saving} onClick={onResetToLoaded}>
                Reset changes
              </Button>
            </div>
          </form>
        </>
      ) : null}

      {!demoMode && loading ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      ) : null}
    </div>
  );
}
