"use client";

import { useCallback, useEffect, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";

import {
  applySnapshotToFields,
  parseNumberOrNull,
  snapshotFromForm,
} from "@/app/(operator)/administration/baseline/baseline-settings-presentation";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  BASELINE_REVIEW_NOTE_SAVE_READINESS,
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
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { showError, showSuccess } from "@/lib/toast";
import {
  firstWhyDisabledCtaReason,
  whyDisabledBusy,
  whyDisabledIncompleteInput,
} from "@/lib/why-disabled-cta";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import type { EnterpriseStatusKind } from "@/lib/design-tokens-status";
import type { IntegrationConnectChecklistStep } from "@/components/integrations/IntegrationConnectChecklist";

export type UseBaselineSettingsResult = {
  readonly demoMode: boolean;
  readonly loadFailure: ApiLoadFailureState | null;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly manualPrep: string;
  readonly setManualPrep: Dispatch<SetStateAction<string>>;
  readonly people: string;
  readonly setPeople: Dispatch<SetStateAction<string>>;
  readonly reviewHours: string;
  readonly setReviewHours: Dispatch<SetStateAction<string>>;
  readonly reviewNote: string;
  readonly setReviewNote: Dispatch<SetStateAction<string>>;
  readonly loadedSnapshot: TenantBaselineSnapshot | null;
  readonly reviewValidation: { readonly error: string | null; readonly warning: string | null };
  readonly prepValidation: { readonly error: string | null; readonly warning: string | null };
  readonly peopleValidation: { readonly error: string | null; readonly warning: string | null };
  readonly statusTagKind: EnterpriseStatusKind;
  readonly baselineStatusLabel: string;
  readonly roiModelLabel: string;
  readonly lastUpdatedLabel: string;
  readonly noteRequiresHours: boolean;
  readonly saveBlocked: boolean;
  readonly saveDisabledReason: WhyDisabledCtaReason | null;
  readonly hasSavedBaseline: boolean;
  readonly baselineSaveSteps: readonly IntegrationConnectChecklistStep[];
  readonly baselineSaveEmphasizedStepId: string;
  readonly noteWouldBeDroppedOnSave: boolean;
  readonly onSave: (event: FormEvent) => Promise<void>;
  readonly onResetToLoaded: () => void;
  readonly onUseModeledDefaults: () => void;
};

export function useBaselineSettings(): UseBaselineSettingsResult {
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

  function resolvePersistBaselineValidationError(args: {
    reviewTrim: string;
    prepTrim: string;
    peopleTrim: string;
    noteTrim: string;
  }): string | null {
    const { reviewTrim, prepTrim, peopleTrim, noteTrim } = args;

    if (reviewValidation.error) {
      return reviewValidation.error;
    }

    if (prepValidation.error) {
      return prepValidation.error;
    }

    if (peopleValidation.error) {
      return peopleValidation.error;
    }

    if (noteTrim.length > 500) {
      return "Review note must be 500 characters or fewer.";
    }

    if (noteTrim.length > 0 && reviewTrim.length === 0) {
      return "Enter review cycle hours before saving a review note.";
    }

    const prepN = parseNumberOrNull(prepTrim);
    const peopleN = parseNumberOrNull(peopleTrim);

    if (reviewTrim.length > 0) {
      const reviewParsed = parseNumberOrNull(reviewTrim);

      if (Number.isNaN(reviewParsed) || reviewParsed === null || reviewParsed <= 0 || reviewParsed > 10_000) {
        return "Review cycle hours must be between 0 and 10,000.";
      }
    }

    if (prepTrim.length > 0 && (Number.isNaN(prepN) || prepN === null || prepN <= 0 || prepN > 10_000)) {
      return "Manual prep hours must be between 0 and 10,000.";
    }

    if (peopleTrim.length > 0 && (Number.isNaN(peopleN) || peopleN === null || peopleN <= 0 || peopleN > 10_000)) {
      return "People per review must be between 0 and 10,000.";
    }

    return null;
  }

  async function persistBaseline(): Promise<void> {
    if (demoMode) {
      return;
    }

    const reviewTrim = reviewHours.trim();
    const prepTrim = manualPrep.trim();
    const peopleTrim = people.trim();
    const noteTrim = reviewNote.trim();
    const validationError = resolvePersistBaselineValidationError({
      reviewTrim,
      prepTrim,
      peopleTrim,
      noteTrim,
    });

    if (validationError) {
      showError("Baseline", validationError);
      return;
    }

    const prepN = parseNumberOrNull(prepTrim);
    const peopleN = parseNumberOrNull(peopleTrim);
    let reviewParsed: number | null = null;

    if (reviewTrim.length > 0) {
      reviewParsed = parseNumberOrNull(reviewTrim);
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

  return {
    demoMode,
    loadFailure,
    loading,
    saving,
    manualPrep,
    setManualPrep,
    people,
    setPeople,
    reviewHours,
    setReviewHours,
    reviewNote,
    setReviewNote,
    loadedSnapshot,
    reviewValidation,
    prepValidation,
    peopleValidation,
    statusTagKind,
    baselineStatusLabel: baselineSettingsStatusLabel(baselineStatus),
    roiModelLabel,
    lastUpdatedLabel,
    noteRequiresHours,
    saveBlocked,
    saveDisabledReason,
    hasSavedBaseline,
    baselineSaveSteps,
    baselineSaveEmphasizedStepId,
    noteWouldBeDroppedOnSave,
    onSave,
    onResetToLoaded,
    onUseModeledDefaults,
  };
}
