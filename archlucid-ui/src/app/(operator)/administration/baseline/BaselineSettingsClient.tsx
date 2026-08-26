"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";

import { BaselineRoiVocabularyRail } from "@/components/BaselineRoiVocabularyRail";
import { DemoUnavailableNotice } from "@/components/DemoUnavailableNotice";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";
import { OperatorPageHeader } from "@/components/operator/OperatorPageHeader";
import { Button } from "@/components/ui/button";
import { StatusTag } from "@/components/ui/status-tag";
import { PageContextualHelpButton } from "@/components/usability/PageContextualHelpButton";
import { BaselineSettingsEvidenceOrientationStrip } from "@/components/evidence-orientation/registry/claim-and-sources-strips";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { BaselineSettingsForm } from "@/app/(operator)/administration/baseline/BaselineSettingsForm";
import {
  applySnapshotToFields,
  parseNumberOrNull,
  snapshotFromForm,
} from "@/app/(operator)/administration/baseline/baseline-settings-presentation";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  BASELINE_MODELED_DEFAULTS_HELPER,
  BASELINE_REVIEW_NOTE_SAVE_READINESS,
  BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER,
  BASELINE_SETTINGS_CONSERVATIVE_DEFAULTS_NOTE,
  BASELINE_SETTINGS_PAGE_SUBTITLE,
  BASELINE_SETTINGS_PAGE_TITLE,
  BASELINE_SETTINGS_USED_IN_SURFACES,
  baselineSettingsStatusLabel,
  baselineSettingsStatusTagKind,
  formatBaselineLastUpdated,
  hasSavedWorkspaceBaseline,
  resolveBaselineLastUpdatedUtc,
  resolveBaselineRoiModelLabel,
  resolveBaselineSaveToastMessage,
  resolveBaselineSettingsStatus,
  type TenantBaselineSnapshot,
  validateBaselineManualPrepHours,
  validateBaselinePeoplePerReview,
  validateBaselineReviewCycleHours,
} from "@/lib/baseline-settings-present";
import {
  resolveBaselineSaveEmphasizedStepId,
  resolveBaselineSaveSteps,
} from "@/lib/baseline-save-checklist";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { DESIGN_TOKENS, OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { PILOT_BASELINE_WIZARD_OPEN_EVENT } from "@/lib/pilot-baseline-wizard-events";
import { showError, showSuccess } from "@/lib/toast";
import {
  firstWhyDisabledCtaReason,
  whyDisabledBusy,
  whyDisabledIncompleteInput,
} from "@/lib/why-disabled-cta";

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
  const [baselineSaveComplete, setBaselineSaveComplete] = useState(false);
  const demoMode = isNextPublicDemoMode();

  const reviewValidation = useMemo(() => validateBaselineReviewCycleHours(reviewHours), [reviewHours]);
  const prepValidation = useMemo(() => validateBaselineManualPrepHours(manualPrep), [manualPrep]);
  const peopleValidation = useMemo(() => validateBaselinePeoplePerReview(people), [people]);

  const displaySnapshot = useMemo(
    () => loadedSnapshot ?? snapshotFromForm(reviewHours, reviewNote, manualPrep, people),
    [loadedSnapshot, reviewHours, reviewNote, manualPrep, people],
  );

  const baselineStatus = resolveBaselineSettingsStatus(displaySnapshot);
  const statusTagKind = baselineSettingsStatusTagKind(baselineStatus);
  const roiModelLabel = resolveBaselineRoiModelLabel(displaySnapshot);
  const lastUpdatedLabel = formatBaselineLastUpdated(resolveBaselineLastUpdatedUtc(displaySnapshot));
  const reviewHoursTrimmed = reviewHours.trim();
  const reviewNoteTrimmed = reviewNote.trim();
  const noteRequiresHours = reviewHoursTrimmed.length === 0;
  const noteWouldBeDroppedOnSave = noteRequiresHours && reviewNoteTrimmed.length > 0;

  const load = useCallback(async () => {
    if (demoMode) {
      return;
    }

    setLoading(true);
    setLoadFailure(null);

    try {
      const res = await fetch(
        "/api/proxy/v1/tenant/baseline",
        mergeRegistrationScopeForProxy({
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: "include",
        }),
      );

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

  async function persistBaseline(): Promise<void> {
    if (demoMode) {
      return;
    }

    const reviewTrim = reviewHours.trim();
    const prepTrim = manualPrep.trim();
    const peopleTrim = people.trim();
    const noteTrim = reviewNote.trim();

    if (reviewValidation.error || prepValidation.error || peopleValidation.error) {
      return;
    }

    if (noteTrim.length > 500) {
      return;
    }

    if (noteTrim.length > 0 && reviewTrim.length === 0) {
      return;
    }

    const prepN = parseNumberOrNull(prepTrim);
    const peopleN = parseNumberOrNull(peopleTrim);
    let reviewParsed: number | null = null;

    if (reviewTrim.length > 0) {
      reviewParsed = parseNumberOrNull(reviewTrim);

      if (Number.isNaN(reviewParsed) || reviewParsed === null || reviewParsed <= 0 || reviewParsed > 10_000) {
        return;
      }
    }

    if (prepTrim.length > 0 && (Number.isNaN(prepN) || prepN === null || prepN <= 0 || prepN > 10_000)) {
      return;
    }

    if (peopleTrim.length > 0 && (Number.isNaN(peopleN) || peopleN === null || peopleN <= 0 || peopleN > 10_000)) {
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

      const res = await fetch(
        "/api/proxy/v1/tenant/baseline",
        mergeRegistrationScopeForProxy({
          method: "PUT",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        }),
      );

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
      setBaselineSaveComplete(true);
      await load();
    } catch (err) {
      showError("Baseline", err instanceof Error ? err.message : "Request failed.");
    } finally {
      setSaving(false);
    }
  }

  async function onSave(e: FormEvent): Promise<void> {
    e.preventDefault();

    await persistBaseline();
  }

  /**
   * Blanks the form so a subsequent save records no workspace estimates, which is what makes reports
   * fall back to conservative modeled defaults. This deliberately does not attempt to erase an
   * already-saved baseline: PUT /v1/tenant/baseline treats a body whose values are all null as "no
   * fields supplied" and returns the stored row untouched, so a clear request would report success
   * while changing nothing.
   */
  function onUseModeledDefaults(): void {
    setManualPrep("");
    setPeople("");
    setReviewHours("");
    setReviewNote("");
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
  const saveBlocked = saving || hasValidationErrors || noteWouldBeDroppedOnSave;
  const saveDisabledReason = firstWhyDisabledCtaReason([
    saving ? whyDisabledBusy("Save") : null,
    prepValidation.error !== null ? whyDisabledIncompleteInput(prepValidation.error) : null,
    peopleValidation.error !== null ? whyDisabledIncompleteInput(peopleValidation.error) : null,
    reviewValidation.error !== null ? whyDisabledIncompleteInput(reviewValidation.error) : null,
    noteWouldBeDroppedOnSave ? whyDisabledIncompleteInput(BASELINE_REVIEW_NOTE_SAVE_READINESS) : null,
  ]);
  const hasSavedBaseline = loadedSnapshot !== null && hasSavedWorkspaceBaseline(loadedSnapshot);
  const measurementsEntered =
    reviewHoursTrimmed.length > 0 || manualPrep.trim().length > 0 || people.trim().length > 0;
  const validationReady = !hasValidationErrors && !noteWouldBeDroppedOnSave;
  const baselineSaveChecklistInput = {
    measurementsEntered,
    validationReady,
    saveComplete: baselineSaveComplete || hasSavedBaseline,
  };
  const baselineSaveSteps = resolveBaselineSaveSteps(baselineSaveChecklistInput);
  const baselineSaveEmphasizedStepId = resolveBaselineSaveEmphasizedStepId(baselineSaveChecklistInput);

  return (
    <OperatorPageContainer variant="settings" className="space-y-4">
      <OperatorPageHeader
        title={BASELINE_SETTINGS_PAGE_TITLE}
        subtitle={BASELINE_SETTINGS_PAGE_SUBTITLE}
        titleTestId="baseline-settings-page-title"
        actions={<PageContextualHelpButton />}
      />
      <BaselineSettingsEvidenceOrientationStrip />
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
                <dd className="m-0 mt-0.5">
                  <StatusTag
                    kind={statusTagKind}
                    label={baselineSettingsStatusLabel(baselineStatus)}
                    data-testid="baseline-settings-status-tag"
                  />
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
                  <ul className="m-0 flex flex-wrap gap-x-3 gap-y-1 p-0 list-none">
                    {BASELINE_SETTINGS_USED_IN_SURFACES.map((surface) => (
                      <li key={surface.href}>
                        <Link href={surface.href} className={OPERATOR_LINK.nav}>
                          {surface.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </dd>
              </div>
            </dl>
          </section>

          <section
            className={cn(DESIGN_TOKENS.callout.info, "rounded-lg p-4")}
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
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="outline"
                  data-testid="baseline-use-conservative-defaults"
                  disabled={saving || hasSavedBaseline}
                  onClick={() => {
                    onUseModeledDefaults();
                  }}
                >
                  Use modeled defaults
                </Button>
                <p
                  className={cn("m-0 max-w-prose text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="baseline-modeled-defaults-helper"
                >
                  {hasSavedBaseline
                    ? BASELINE_SAVED_CANNOT_BE_REMOVED_HELPER
                    : BASELINE_MODELED_DEFAULTS_HELPER}
                </p>
              </div>
            </div>
          </section>

          <IntegrationConnectChecklist
            title="Save checklist"
            steps={baselineSaveSteps}
            emphasizedStepId={baselineSaveEmphasizedStepId}
            testIdPrefix="baseline-save"
          />

          <BaselineSettingsForm
            reviewHours={reviewHours}
            setReviewHours={setReviewHours}
            reviewNote={reviewNote}
            setReviewNote={setReviewNote}
            manualPrep={manualPrep}
            setManualPrep={setManualPrep}
            people={people}
            setPeople={setPeople}
            reviewValidation={reviewValidation}
            prepValidation={prepValidation}
            peopleValidation={peopleValidation}
            noteRequiresHours={noteRequiresHours}
            saveBlocked={saveBlocked}
            saveDisabledReason={saveDisabledReason}
            noteWouldBeDroppedOnSave={noteWouldBeDroppedOnSave}
            saving={saving}
            onSave={onSave}
            onResetToLoaded={onResetToLoaded}
          />
        </>
      ) : null}

      {!demoMode && loading ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading…</p>
      ) : null}
    </OperatorPageContainer>
  );
}
