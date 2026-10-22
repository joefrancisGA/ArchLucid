"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useOperatorRecipientDraft } from "@/components/advisory/useOperatorRecipientDraft";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import { getExecDigestPreferences, saveExecDigestPreferences } from "@/lib/api";
import { toApiLoadFailure, type ApiLoadFailureState } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { DIGESTS_HUB_PATH, digestsBrowseDigestDeepLink } from "@/lib/digests-route-paths";
import {
  execDigestFormFromPreferencesWithBrowserDefault,
  execDigestUpsertFromForm,
  formatExecDigestLiveScheduleSummary,
  hasUnsavedExecDigestChanges,
  isExecDigestScheduleFormValid,
  parseExecDigestRecipientEmails,
  validateExecDigestRecipientEmails,
  type ExecDigestScheduleFormState,
} from "@/lib/exec-digest-schedule-form";
import {
  buildExecDigestDeliveryReadiness,
  buildExecDigestSavedScheduleSummary,
  type ExecDigestDeliveryReadinessModel,
  type ExecDigestSavedScheduleSummary,
  type ExecDigestStatusPresentation,
  resolveExecDigestStatus,
} from "@/lib/exec-digest-schedule-page-model";
import { getIanaTimeZoneSelectOptions, type IanaTimeZoneSelectOption } from "@/lib/iana-time-zone-select";
import {
  hasExecDigestScheduleLivePreviewPinContent,
  shouldPinLivePreviewReadinessRail,
} from "@/lib/operator/operator-live-preview-readiness-rail";
import { whyDisabledIncompleteInput, type WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

export type ExecDigestScheduleContentProps = {
  readonly refreshToken?: number;
  readonly healthSnap?: WeeklyDigestHealthDto | null;
  readonly onRefresh?: () => void;
  readonly refreshing?: boolean;
  readonly scopedRunId?: string | null;
  readonly onPickReview?: (reviewId: string) => void;
};

export type UseExecDigestScheduleResult = {
  readonly healthSnap: WeeklyDigestHealthDto | null | undefined;
  readonly onRefresh: (() => void) | undefined;
  readonly refreshing: boolean;
  readonly sampleModeBlocked: boolean;
  readonly canMutate: boolean;
  readonly loading: boolean;
  readonly saving: boolean;
  readonly enabling: boolean;
  readonly pausing: boolean;
  readonly saveSuccess: string | null;
  readonly statusMessage: string | null;
  readonly failure: ApiLoadFailureState | null;
  readonly prefs: ExecDigestPreferencesResponse | null;
  readonly form: ExecDigestScheduleFormState | null;
  readonly recipientDraft: string;
  readonly recipientDraftError: string | null;
  readonly recipientsTouched: boolean;
  readonly recipientEmails: readonly string[];
  readonly recipientValidation: ReturnType<typeof validateExecDigestRecipientEmails>;
  readonly onRecipientDraftChange: (value: string) => void;
  readonly onRecipientDraftBlur: () => void;
  readonly addRecipientFromDraft: () => void;
  readonly removeRecipient: (email: string) => void;
  readonly ianaTimeZoneOptions: readonly IanaTimeZoneSelectOption[];
  readonly unsavedChanges: boolean;
  readonly formValid: boolean;
  readonly status: ExecDigestStatusPresentation | null;
  readonly savedSummary: ExecDigestSavedScheduleSummary | null;
  readonly readiness: ExecDigestDeliveryReadinessModel | null;
  readonly recipientCount: number;
  readonly enableDeliveryRecipientRequiredHintId: string;
  readonly enableDeliveryRecipientRequiredReason: WhyDisabledCtaReason | null;
  readonly subscriptionDestinationCount: number;
  readonly hasPreviewDigest: boolean;
  readonly previewHref: string;
  readonly busy: boolean;
  readonly liveScheduleSummary: string | null;
  readonly pinLivePreviewRail: boolean;
  readonly updateForm: (patch: Partial<ExecDigestScheduleFormState>) => void;
  readonly onSaveSchedule: () => Promise<void>;
  readonly onEnableDelivery: () => Promise<void>;
  readonly onPauseDelivery: () => Promise<void>;
};

export function useExecDigestSchedule(
  props: ExecDigestScheduleContentProps = {},
): UseExecDigestScheduleResult {
  const { refreshToken = 0, healthSnap = null, onRefresh, refreshing = false } = props;
  const operateCapability: boolean = useOperateCapability();
  const sampleModeBlocked =
    isBuyerPolishedOperatorShellEnv() && !isOperatorExperienceFullShellEnv();
  const canMutate: boolean = operateCapability && !sampleModeBlocked;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [enabling, setEnabling] = useState(false);
  const [pausing, setPausing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [prefs, setPrefs] = useState<ExecDigestPreferencesResponse | null>(null);
  const [form, setForm] = useState<ExecDigestScheduleFormState | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const ianaTimeZoneOptions = useMemo(() => getIanaTimeZoneSelectOptions(), []);

  const onRecipientsChange = useCallback((recipients: string) => {
    setForm((current) => (current === null ? current : { ...current, recipients }));
    setSaveSuccess(null);
  }, []);

  const {
    recipientDraft,
    recipientDraftError,
    recipientsTouched,
    recipientEmails,
    recipientValidation,
    setRecipientsTouched,
    onRecipientDraftChange,
    onRecipientDraftBlur,
    addRecipientFromDraft,
    removeRecipient,
    resetRecipientDraftState,
  } = useOperatorRecipientDraft({
    recipients: form?.recipients ?? "",
    canMutate,
    parseEmails: parseExecDigestRecipientEmails,
    validateEmails: validateExecDigestRecipientEmails,
    onRecipientsChange,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await getExecDigestPreferences();
      setPrefs(data);
      setForm(execDigestFormFromPreferencesWithBrowserDefault(data));
      resetRecipientDraftState();
      setSaveSuccess(null);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, [resetRecipientDraftState]);

  useEffect(() => {
    void load();

    return () => {
      if (successTimerRef.current !== null) {
        clearTimeout(successTimerRef.current);
      }
    };
  }, [load, refreshToken]);

  const unsavedChanges: boolean =
    prefs !== null && form !== null && hasUnsavedExecDigestChanges(prefs, form);
  const formValid: boolean = form !== null && isExecDigestScheduleFormValid(form);
  const status =
    prefs !== null && form !== null
      ? resolveExecDigestStatus(prefs, form, unsavedChanges)
      : null;
  const savedSummary =
    prefs !== null ? buildExecDigestSavedScheduleSummary(prefs, healthSnap) : null;
  const readiness =
    prefs !== null && form !== null
      ? buildExecDigestDeliveryReadiness(prefs, form, healthSnap, unsavedChanges)
      : null;
  const recipientCount: number = recipientEmails.length;
  const enableDeliveryRecipientRequiredHintId = "exec-digest-enable-delivery-recipient-required-hint";
  const enableDeliveryRecipientRequiredReason: WhyDisabledCtaReason | null =
    recipientCount === 0 && canMutate
      ? whyDisabledIncompleteInput("Add at least one recipient before enabling scheduled delivery.")
      : null;
  const subscriptionDestinationCount: number = healthSnap?.enabledDigestSubscriptionCount ?? 0;
  const latestDigestId: string = healthSnap?.latestArchitectureDigestId?.trim() ?? "";
  const hasPreviewDigest: boolean = latestDigestId.length > 0;
  const previewHref: string = hasPreviewDigest
    ? digestsBrowseDigestDeepLink(latestDigestId)
    : DIGESTS_HUB_PATH;
  const busy: boolean = saving || enabling || pausing;
  const liveScheduleSummary: string | null =
    form !== null && prefs !== null
      ? formatExecDigestLiveScheduleSummary(form, prefs.isConfigured)
      : null;

  // TB-1574: pin delivery readiness rail only when schedule/recipients/preview give it a job.
  const pinLivePreviewRail =
    prefs !== null
      ? shouldPinLivePreviewReadinessRail(
          hasExecDigestScheduleLivePreviewPinContent({
            isConfigured: prefs.isConfigured,
            recipientCount,
            hasPreviewDigest,
          }),
        )
      : false;

  function announceSuccess(message: string): void {
    setSaveSuccess(message);
    setStatusMessage(message);

    if (successTimerRef.current !== null) {
      clearTimeout(successTimerRef.current);
    }

    successTimerRef.current = setTimeout(() => setSaveSuccess(null), 4000);
  }

  function updateForm(patch: Partial<ExecDigestScheduleFormState>): void {
    setForm((current) => (current === null ? current : { ...current, ...patch }));
    setSaveSuccess(null);
  }

  async function persistForm(
    nextForm: ExecDigestScheduleFormState,
    successMessage: string,
  ): Promise<void> {
    if (!canMutate || !isExecDigestScheduleFormValid(nextForm) || busy) {
      return;
    }

    setFailure(null);

    try {
      const saved = await saveExecDigestPreferences(execDigestUpsertFromForm(nextForm));
      setPrefs(saved);
      setForm(execDigestFormFromPreferencesWithBrowserDefault(saved));
      resetRecipientDraftState();
      announceSuccess(successMessage);
      onRefresh?.();
    } catch (e) {
      const loadFailure = toApiLoadFailure(e);
      setFailure({
        ...loadFailure,
        message:
          loadFailure.message.trim().length > 0
            ? loadFailure.message
            : "Could not save the schedule. Check recipients and try again.",
      });
    }
  }

  async function onSaveSchedule(): Promise<void> {
    if (form === null) {
      return;
    }

    setSaving(true);

    try {
      await persistForm(
        form,
        form.emailEnabled ? "Schedule saved. Scheduled delivery remains enabled." : "Schedule saved.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function onEnableDelivery(): Promise<void> {
    if (form === null) {
      return;
    }

    const nextForm: ExecDigestScheduleFormState = { ...form, emailEnabled: true };

    if (!isExecDigestScheduleFormValid(nextForm)) {
      setRecipientsTouched(true);
      setStatusMessage("Add at least one valid recipient before enabling scheduled delivery.");

      return;
    }

    setEnabling(true);
    setForm(nextForm);

    try {
      await persistForm(nextForm, "Scheduled delivery enabled.");
    } finally {
      setEnabling(false);
    }
  }

  async function onPauseDelivery(): Promise<void> {
    if (form === null) {
      return;
    }

    const nextForm: ExecDigestScheduleFormState = { ...form, emailEnabled: false };
    setPausing(true);
    setForm(nextForm);

    try {
      await persistForm(nextForm, "Scheduled delivery paused.");
    } finally {
      setPausing(false);
    }
  }

  return {
    healthSnap,
    onRefresh,
    refreshing,
    sampleModeBlocked,
    canMutate,
    loading,
    saving,
    enabling,
    pausing,
    saveSuccess,
    statusMessage,
    failure,
    prefs,
    form,
    recipientDraft,
    recipientDraftError,
    recipientsTouched,
    recipientEmails,
    recipientValidation,
    onRecipientDraftChange,
    onRecipientDraftBlur,
    addRecipientFromDraft,
    removeRecipient,
    ianaTimeZoneOptions,
    unsavedChanges,
    formValid,
    status,
    savedSummary,
    readiness,
    recipientCount,
    enableDeliveryRecipientRequiredHintId,
    enableDeliveryRecipientRequiredReason,
    subscriptionDestinationCount,
    hasPreviewDigest,
    previewHref,
    busy,
    liveScheduleSummary,
    pinLivePreviewRail,
    updateForm,
    onSaveSchedule,
    onEnableDelivery,
    onPauseDelivery,
  };
}
