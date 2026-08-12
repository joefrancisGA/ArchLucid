"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactElement } from "react";

import {
  OperatorFormSummaryRow,
} from "@/components/advisory/OperatorFormSummaryRow";
import {
  OperatorLivePreviewPinLayout,
} from "@/components/advisory/OperatorLivePreviewPinLayout";
import {
  OperatorRecipientChipField,
  OperatorRecipientSubscriptionsHelperLink,
} from "@/components/advisory/OperatorRecipientChipField";
import { useOperatorRecipientDraft } from "@/components/advisory/useOperatorRecipientDraft";
import { DigestPreviewBeforeSubscribePanel } from "@/components/digests/DigestPreviewBeforeSubscribePanel";
import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { getExecDigestPreferences, saveExecDigestPreferences } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isBuyerPolishedOperatorShellEnv, isOperatorExperienceFullShellEnv } from "@/lib/demo-ui-env";
import { ADVISORY_SCANS_SCHEDULES_HREF } from "@/lib/advisory-scans-route";
import {
  DIGESTS_HUB_PATH,
  DIGESTS_SUBSCRIPTIONS_TAB_PATH,
  digestsBrowseDigestDeepLink,
} from "@/lib/digests-route-paths";
import { formatDigestInstant } from "@/lib/digest-setup-gap-actions";
import {
  DIGESTS_SCHEDULE_GENERATE_TEST_LABEL,
  DIGESTS_SCHEDULE_PREVIEW_LABEL,
} from "@/lib/digests-browse-copy";
import {
  EXEC_DIGEST_DAY_NAMES,
  EXEC_DIGEST_HOUR_OPTIONS,
  execDigestFormFromPreferencesWithBrowserDefault,
  execDigestUpsertFromForm,
  formatExecDigestLiveScheduleSummary,
  hasUnsavedExecDigestChanges,
  isExecDigestScheduleFormValid,
  maskExecDigestRecipientForDisplay,
  parseExecDigestRecipientEmails,
  validateExecDigestRecipientEmails,
  type ExecDigestScheduleFormState,
} from "@/lib/exec-digest-schedule-form";
import {
  buildExecDigestDeliveryReadiness,
  buildExecDigestRecipientSummary,
  buildExecDigestSavedScheduleSummary,
  DIGESTS_SCHEDULE_TAB_RESPONSIBILITY,
  EXEC_DIGEST_DIRECT_RECIPIENTS_HELPER,
  EXEC_DIGEST_PREVIEW_HELPER,
  EXEC_DIGEST_PREVIEW_UNAVAILABLE,
  EXEC_DIGEST_PRODUCT_INTRO,
  EXEC_DIGEST_READ_ONLY,
  EXEC_DIGEST_SAMPLE_BLOCKED,
  EXEC_DIGEST_SUBSCRIPTIONS_HELPER,
  EXEC_DIGEST_TEST_GENERATION_HELPER,
  formatExecDigestNextSendLabel,
  resolveExecDigestStatus,
} from "@/lib/exec-digest-schedule-page-model";
import {
  formatIanaTimeZoneOptionLabel,
  getIanaTimeZoneSelectOptions,
  normalizeIanaTimeZoneForSelect,
  toStoredIanaTimeZoneId,
} from "@/lib/iana-time-zone-select";
import { whyDisabledIncompleteInput } from "@/lib/why-disabled-cta";
import {
  hasExecDigestScheduleLivePreviewPinContent,
  shouldPinLivePreviewReadinessRail,
} from "@/lib/operator/operator-live-preview-readiness-rail";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";

const SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-600",
  OPERATOR_TYPOGRAPHY.body,
);

export type ExecDigestScheduleContentProps = {
  readonly refreshToken?: number;
  readonly healthSnap?: WeeklyDigestHealthDto | null;
  readonly onRefresh?: () => void;
  readonly refreshing?: boolean;
};

/** Schedule tab: executive digest delivery settings (direct recipients + weekly cadence). */
export function ExecDigestScheduleContent(props: ExecDigestScheduleContentProps = {}): ReactElement {
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
  const enableDeliveryRecipientRequiredReason =
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
    form !== null ? formatExecDigestLiveScheduleSummary(form) : null;

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
      await persistForm(form, form.emailEnabled ? "Schedule saved. Scheduled delivery remains enabled." : "Schedule saved.");
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

  return (
    <div className="w-full space-y-4" data-testid="exec-digest-schedule-content">
      <div>
        <p className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          Architecture digests
        </p>
        <h2
          className={cn("m-0 font-bold text-neutral-900 dark:text-neutral-50", OPERATOR_TYPOGRAPHY.pageTitle)}
          data-testid="exec-digest-schedule-heading"
        >
          Schedule executive digest
        </h2>
        <p className={cn("m-0 mt-2 max-w-3xl text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}>
          {EXEC_DIGEST_PRODUCT_INTRO}
        </p>
        <p className={cn("m-0 mt-1 max-w-3xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          {DIGESTS_SCHEDULE_TAB_RESPONSIBILITY}
        </p>
      </div>

      {sampleModeBlocked ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="exec-digest-sample-blocked"
        >
          {EXEC_DIGEST_SAMPLE_BLOCKED}{" "}
          <Link className="text-al-link underline-offset-2 hover:underline" href="/get-started">
            Start an evaluation
          </Link>
          .
        </p>
      ) : null}

      {!canMutate && !sampleModeBlocked ? (
        <p
          className={cn("m-0 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="exec-digest-read-only"
        >
          {EXEC_DIGEST_READ_ONLY}
        </p>
      ) : null}

      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      <div className="sr-only" aria-live="polite">
        {statusMessage}
      </div>

      {loading || form === null || prefs === null ? (
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
          Loading schedule…
        </p>
      ) : (
        <OperatorLivePreviewPinLayout
          pinRail={pinLivePreviewRail}
          testId="exec-digest-schedule-layout"
          primary={
            <>
            <section
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
              data-testid="exec-digest-status-block"
              aria-labelledby="exec-digest-status-heading"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3
                    id="exec-digest-status-heading"
                    className={cn(
                      "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
                      OPERATOR_TYPOGRAPHY.cardTitle,
                    )}
                  >
                    Delivery status
                  </h3>
                </div>
                {status !== null ? (
                  <StatusTag kind={status.statusTagKind} label={status.label} data-testid="exec-digest-status-tag" />
                ) : null}
              </div>

              <p
                className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
                role="status"
              >
                {status?.summary}
              </p>

              <dl className="m-0 mt-4 grid gap-3 sm:grid-cols-2" data-testid="exec-digest-status-summary">
                <OperatorFormSummaryRow
                  label="Configured schedule"
                  value={liveScheduleSummary ?? "—"}
                />
                <OperatorFormSummaryRow label="Delivery status" value={status?.label ?? "—"} />
                <OperatorFormSummaryRow label="Next send" value={formatExecDigestNextSendLabel(form)} />
                <OperatorFormSummaryRow
                  label="Recipients"
                  value={
                    sampleModeBlocked
                      ? `${recipientCount} direct`
                      : buildExecDigestRecipientSummary(recipientCount, subscriptionDestinationCount)
                  }
                />
              </dl>
            </section>

            <section
              className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
              aria-labelledby="exec-digest-delivery-settings-heading"
            >
              <div>
                <h3
                  id="exec-digest-delivery-settings-heading"
                  className={cn(
                    "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
                    OPERATOR_TYPOGRAPHY.cardTitle,
                  )}
                >
                  Delivery settings
                </h3>
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {liveScheduleSummary}
                </p>
              </div>

              <OperatorRecipientChipField
                idPrefix="exec-digest"
                label="Direct recipients"
                canMutate={canMutate}
                recipientDraft={recipientDraft}
                recipientDraftError={recipientDraftError}
                recipientsTouched={recipientsTouched}
                recipientEmails={recipientEmails}
                recipientValidation={recipientValidation}
                maskEmailForDisplay={
                  sampleModeBlocked ? maskExecDigestRecipientForDisplay : undefined
                }
                directRecipientsHelper={EXEC_DIGEST_DIRECT_RECIPIENTS_HELPER}
                subscriptionsHelper={
                  <OperatorRecipientSubscriptionsHelperLink
                    helperPrefix={EXEC_DIGEST_SUBSCRIPTIONS_HELPER}
                    href={DIGESTS_SUBSCRIPTIONS_TAB_PATH}
                    linkLabel="Manage delivery destinations"
                  />
                }
                addRecipientTestId="exec-digest-add-recipient"
                recipientChipsTestId="exec-digest-recipient-chips"
                recipientDraftErrorTestId="exec-digest-recipient-draft-error"
                onRecipientDraftChange={onRecipientDraftChange}
                onRecipientDraftBlur={onRecipientDraftBlur}
                onAddRecipient={addRecipientFromDraft}
                onRemoveRecipient={removeRecipient}
              />

              <fieldset className="m-0 grid gap-4 border-0 p-0 sm:grid-cols-2" disabled={!canMutate}>
                <legend className={cn("mb-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                  Schedule
                </legend>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="exec-digest-tz" className="font-semibold">
                    Time zone
                  </Label>
                  <select
                    id="exec-digest-tz"
                    className={SELECT_CLASS}
                    value={normalizeIanaTimeZoneForSelect(form.ianaTimeZoneId)}
                    disabled={!canMutate}
                    onChange={(e) => updateForm({ ianaTimeZoneId: toStoredIanaTimeZoneId(e.target.value) })}
                  >
                    {ianaTimeZoneOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {formatIanaTimeZoneOptionLabel(option.value)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exec-digest-dow" className="font-semibold">
                    Day of week
                  </Label>
                  <select
                    id="exec-digest-dow"
                    className={SELECT_CLASS}
                    value={String(form.dayOfWeek)}
                    disabled={!canMutate}
                    onChange={(e) => updateForm({ dayOfWeek: Number.parseInt(e.target.value, 10) })}
                  >
                    {EXEC_DIGEST_DAY_NAMES.map((label, idx) => (
                      <option key={label} value={idx}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="exec-digest-hour" className="font-semibold">
                    Send time
                  </Label>
                  <select
                    id="exec-digest-hour"
                    className={SELECT_CLASS}
                    value={String(form.hourOfDay)}
                    disabled={!canMutate}
                    onChange={(e) => updateForm({ hourOfDay: Number.parseInt(e.target.value, 10) })}
                  >
                    {EXEC_DIGEST_HOUR_OPTIONS.map((option) => (
                      <option key={option.value} value={String(option.value)}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </fieldset>

              <DigestPreviewBeforeSubscribePanel
                className="mt-3"
                variant="executive-schedule"
                recipientEmails={recipientEmails}
                cadenceSummary={liveScheduleSummary ?? undefined}
              />

              <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  disabled={!canMutate || busy || !formValid || !unsavedChanges}
                  onClick={() => void onSaveSchedule()}
                  data-testid="exec-digest-save-schedule"
                >
                  {saving ? "Saving schedule…" : "Save schedule"}
                </Button>
                {form.emailEnabled ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canMutate || busy}
                    onClick={() => void onPauseDelivery()}
                    data-testid="exec-digest-pause-delivery"
                  >
                    {pausing ? "Pausing…" : "Pause scheduled delivery"}
                  </Button>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={!canMutate || busy || recipientCount === 0 || !recipientValidation.valid}
                    aria-describedby={
                      enableDeliveryRecipientRequiredReason === null
                        ? undefined
                        : enableDeliveryRecipientRequiredHintId
                    }
                    onClick={() => void onEnableDelivery()}
                    data-testid="exec-digest-enable-delivery"
                  >
                    {enabling ? "Enabling delivery…" : "Enable scheduled delivery"}
                  </Button>
                )}
              </div>

              <WhyDisabledCtaHint
                id={enableDeliveryRecipientRequiredHintId}
                reason={enableDeliveryRecipientRequiredReason}
                testId={enableDeliveryRecipientRequiredHintId}
              />

              <div className="flex flex-wrap items-center gap-2">
                {unsavedChanges ? (
                  <StatusTag kind="needs-attention" label="Unsaved changes" data-testid="exec-digest-unsaved-status" />
                ) : null}
                {saveSuccess !== null ? (
                  <span
                    className={cn("text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="exec-digest-save-success"
                    role="status"
                  >
                    {saveSuccess}
                  </span>
                ) : null}
              </div>
            </section>
            </>
          }
          aside={
            <>
            <section
              className={cn(
                "rounded-lg border border-neutral-200 bg-white dark:border-neutral-700 dark:bg-neutral-950",
                pinLivePreviewRail ? "p-4" : "p-3",
              )}
              data-testid="exec-digest-delivery-readiness"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3
                  className={cn(
                    "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
                    OPERATOR_TYPOGRAPHY.cardTitle,
                  )}
                >
                  Delivery readiness
                </h3>
                {readiness !== null ? (
                  <StatusTag
                    kind={readiness.overallStatusTagKind}
                    label={readiness.overallLabel}
                    data-testid="exec-digest-readiness-overall"
                  />
                ) : null}
              </div>
              {readiness?.nextAction !== null && readiness !== null ? (
                <p
                  className={cn("m-0 mt-2 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)}
                  data-testid="exec-digest-readiness-next-action"
                >
                  {readiness.nextAction}
                </p>
              ) : null}
              <ul className="m-0 mt-3 list-none space-y-3 p-0">
                {readiness?.items.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                        {item.label}
                      </p>
                      <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                        {item.value}
                      </p>
                    </div>
                    {item.actionHref !== undefined && item.actionLabel !== undefined ? (
                      <Button asChild size="sm" variant="outline">
                        <Link href={item.actionHref}>{item.actionLabel}</Link>
                      </Button>
                    ) : null}
                  </li>
                ))}
              </ul>
              {onRefresh !== undefined ? (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="mt-4"
                  onClick={onRefresh}
                  disabled={refreshing}
                  data-testid="exec-digest-refresh-status"
                  aria-label={refreshing ? "Refreshing status" : "Refresh status"}
                >
                  <RefreshCw className={cn("mr-1.5 size-3.5", refreshing && "animate-spin")} aria-hidden />
                  {refreshing ? "Refreshing…" : "Refresh status"}
                </Button>
              ) : null}
            </section>

            {pinLivePreviewRail && savedSummary !== null && prefs.isConfigured ? (
              <section
                className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
                data-testid="exec-digest-saved-summary"
              >
                <h3
                  className={cn(
                    "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
                    OPERATOR_TYPOGRAPHY.cardTitle,
                  )}
                >
                  Saved schedule
                </h3>
                <dl className="m-0 mt-3 grid gap-3">
                  <OperatorFormSummaryRow label="Delivery status" value={savedSummary.deliveryStatus} />
                  <OperatorFormSummaryRow label="Configured schedule" value={savedSummary.configuredCadence} />
                  <OperatorFormSummaryRow label="Time zone" value={savedSummary.timeZone} />
                  <OperatorFormSummaryRow label="Next send" value={savedSummary.nextScheduledSend} />
                  <OperatorFormSummaryRow label="Direct recipients" value={String(savedSummary.directRecipientCount)} />
                  <OperatorFormSummaryRow
                    label="Subscription destinations"
                    value={String(savedSummary.subscriptionDestinationCount)}
                  />
                  <OperatorFormSummaryRow label="Last schedule update" value={savedSummary.lastScheduleUpdate} />
                </dl>
              </section>
            ) : null}

            {pinLivePreviewRail ? (
            <section
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
              data-testid="exec-digest-latest-generated"
            >
              <h3
                className={cn(
                  "m-0 font-semibold text-neutral-900 dark:text-neutral-100",
                  OPERATOR_TYPOGRAPHY.cardTitle,
                )}
              >
                Latest architecture digest
              </h3>
              {hasPreviewDigest ? (
                <>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                    Generated {formatDigestInstant(healthSnap?.latestArchitectureDigestGeneratedUtc)}
                  </p>
                  <Button asChild size="sm" variant="outline" className="mt-3" data-testid="exec-digest-preview-action">
                    <Link href={previewHref}>{DIGESTS_SCHEDULE_PREVIEW_LABEL}</Link>
                  </Button>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {EXEC_DIGEST_PREVIEW_HELPER}
                  </p>
                </>
              ) : (
                <>
                  <p className={cn("m-0 mt-2 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                    No digest has been generated yet.
                  </p>
                  <p
                    id="exec-digest-preview-unavailable-hint"
                    className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  >
                    {EXEC_DIGEST_PREVIEW_UNAVAILABLE}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3"
                    disabled
                    data-testid="exec-digest-preview-action"
                    aria-describedby="exec-digest-preview-unavailable-hint"
                  >
                    {DIGESTS_SCHEDULE_PREVIEW_LABEL}
                  </Button>
                </>
              )}

              {!sampleModeBlocked ? (
                <div className="mt-4 border-t border-neutral-200 pt-3 dark:border-neutral-800">
                  <Button asChild size="sm" variant="outline" data-testid="exec-digest-test-action">
                    <Link href={ADVISORY_SCANS_SCHEDULES_HREF} title={EXEC_DIGEST_TEST_GENERATION_HELPER}>
                      {DIGESTS_SCHEDULE_GENERATE_TEST_LABEL}
                    </Link>
                  </Button>
                  <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                    {EXEC_DIGEST_TEST_GENERATION_HELPER}
                  </p>
                </div>
              ) : (
                <p
                  className={cn("m-0 mt-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="exec-digest-test-sample-blocked"
                >
                  Test generation and email delivery are unavailable in the sample workspace.
                </p>
              )}
            </section>
            ) : null}
            </>
          }
        />
      )}
    </div>
  );
}
