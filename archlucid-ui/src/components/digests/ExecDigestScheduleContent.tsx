"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import { OperatorApiProblem } from "@/components/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { useOperateCapability } from "@/hooks/use-operate-capability";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { getExecDigestPreferences, saveExecDigestPreferences } from "@/lib/api";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import {
  DIGESTS_BROWSE_PREVIEW_DISABLED_TITLE,
  DIGESTS_SCHEDULE_GENERATE_TEST_LABEL,
  DIGESTS_SCHEDULE_PREVIEW_LABEL,
} from "@/lib/digests-browse-copy";
import {
  EXEC_DIGEST_DAY_NAMES,
  EXEC_DIGEST_HOUR_OPTIONS,
  execDigestFormFromPreferences,
  execDigestUpsertFromForm,
  formatExecDigestCadenceLabel,
  hasUnsavedExecDigestChanges,
  isExecDigestScheduleFormValid,
  parseExecDigestRecipientEmails,
  validateExecDigestRecipientEmails,
  type ExecDigestScheduleFormState,
} from "@/lib/exec-digest-schedule-form";
import {
  buildExecDigestDeliveryReadiness,
  buildExecDigestSavedScheduleSummary,
  EXEC_DIGEST_DIRECT_RECIPIENTS_HELPER,
  EXEC_DIGEST_PREVIEW_HELPER,
  EXEC_DIGEST_TEST_GENERATION_HELPER,
  formatExecDigestNextSendLabel,
  resolveExecDigestStatus,
} from "@/lib/exec-digest-schedule-page-model";
import {
  getIanaTimeZoneSelectOptions,
  normalizeIanaTimeZoneForSelect,
  toStoredIanaTimeZoneId,
} from "@/lib/iana-time-zone-select";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { formatDigestInstant } from "@/lib/digest-setup-gap-actions";
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

function ScheduleSummaryRow(props: { readonly label: string; readonly value: string }): ReactElement {
  return (
    <div>
      <dt className={cn("font-medium text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.label}</dt>
      <dd className={cn("m-0 mt-0.5 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.value}</dd>
    </div>
  );
}

/** Schedule tab: executive digest email preferences with a focused scheduling workflow. */
export function ExecDigestScheduleContent(props: ExecDigestScheduleContentProps = {}): ReactElement {
  const { refreshToken = 0, healthSnap = null, onRefresh, refreshing = false } = props;
  const canMutate: boolean = useOperateCapability();
  const showTechnicalDetails: boolean = isShowSystemAdministrationNavEnabled();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [failure, setFailure] = useState<ApiLoadFailureState | null>(null);
  const [prefs, setPrefs] = useState<ExecDigestPreferencesResponse | null>(null);
  const [form, setForm] = useState<ExecDigestScheduleFormState | null>(null);
  const [recipientsTouched, setRecipientsTouched] = useState(false);

  const ianaTimeZoneOptions = useMemo(() => getIanaTimeZoneSelectOptions(), []);

  const load = useCallback(async () => {
    setLoading(true);
    setFailure(null);

    try {
      const data = await getExecDigestPreferences();
      setPrefs(data);
      setForm(execDigestFormFromPreferences(data));
      setRecipientsTouched(false);
      setSaveSuccess(false);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load, refreshToken]);

  const recipientValidation = useMemo(
    () => validateExecDigestRecipientEmails(form?.recipients ?? ""),
    [form?.recipients],
  );

  const unsavedChanges: boolean =
    prefs !== null && form !== null && hasUnsavedExecDigestChanges(prefs, form);
  const formValid: boolean = form !== null && isExecDigestScheduleFormValid(form);
  const status =
    prefs !== null && form !== null
      ? resolveExecDigestStatus(prefs, form, unsavedChanges)
      : null;
  const savedSummary =
    prefs !== null ? buildExecDigestSavedScheduleSummary(prefs, healthSnap) : null;
  const readinessItems =
    prefs !== null && form !== null
      ? buildExecDigestDeliveryReadiness(prefs, form, healthSnap, unsavedChanges)
      : [];
  const recipientCount: number =
    form !== null ? parseExecDigestRecipientEmails(form.recipients).length : 0;
  const latestDigestId: string = healthSnap?.latestArchitectureDigestId?.trim() ?? "";
  const hasPreviewDigest: boolean = latestDigestId.length > 0;
  const previewHref: string = hasPreviewDigest
    ? `/digests?tab=browse#digest-${encodeURIComponent(latestDigestId)}`
    : "/digests";
  const saveLabel: string =
    form !== null && !form.emailEnabled && unsavedChanges
      ? "Save schedule"
      : form !== null && form.emailEnabled && (status?.kind === "off" || status?.kind === "paused") && unsavedChanges
        ? "Enable and save schedule"
        : "Save schedule";
  const enableActivationSummary: string | null =
    form !== null && form.emailEnabled && unsavedChanges
      ? `Activating will send to ${recipientCount} recipient${recipientCount === 1 ? "" : "s"} on ${formatExecDigestCadenceLabel(form)} (${form.ianaTimeZoneId}).`
      : null;

  async function onSave(): Promise<void> {
    if (!canMutate || form === null || !formValid || saving) {
      return;
    }

    setSaving(true);
    setSaveSuccess(false);
    setFailure(null);

    try {
      const saved = await saveExecDigestPreferences(execDigestUpsertFromForm(form));
      setPrefs(saved);
      setForm(execDigestFormFromPreferences(saved));
      setRecipientsTouched(false);
      setSaveSuccess(true);
    } catch (e) {
      setFailure(toApiLoadFailure(e));
    } finally {
      setSaving(false);
    }
  }

  function updateForm(patch: Partial<ExecDigestScheduleFormState>): void {
    setForm((current) => (current === null ? current : { ...current, ...patch }));
    setSaveSuccess(false);
  }

  function onEnableDigest(): void {
    if (!canMutate || form === null) {
      return;
    }

    updateForm({ emailEnabled: true });
  }

  return (
    <div className="w-full space-y-4" data-testid="exec-digest-schedule-content">
      {failure !== null ? (
        <div role="alert">
          <OperatorApiProblem
            problem={failure.problem}
            fallbackMessage={failure.message}
            correlationId={failure.correlationId}
          />
        </div>
      ) : null}

      {loading || form === null || prefs === null ? (
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)} role="status">
          Loading schedule…
        </p>
      ) : (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(18rem,1fr)]">
          <div className="space-y-4">
            <section
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
              data-testid="exec-digest-status-block"
              aria-labelledby="exec-digest-status-heading"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2
                    id="exec-digest-status-heading"
                    className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
                  >
                    Executive digest
                  </h2>
                  <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    Status
                  </p>
                </div>
                {status !== null ? (
                  <StatusTag kind={status.statusTagKind} label={status.label} data-testid="exec-digest-status-tag" />
                ) : null}
              </div>

              <p className={cn("m-0 mt-3 text-neutral-700 dark:text-neutral-300", OPERATOR_TYPOGRAPHY.body)} role="status">
                {status?.summary}
              </p>

              {status?.kind === "off" ? (
                <div className="mt-4">
                  <Button
                    type="button"
                    size="sm"
                    variant="primary"
                    disabled={!canMutate}
                    onClick={onEnableDigest}
                    data-testid="exec-digest-enable-action"
                  >
                    Enable digest
                  </Button>
                </div>
              ) : null}

              {status?.kind === "active" && form.emailEnabled ? (
                <dl className="m-0 mt-4 grid gap-3 sm:grid-cols-2" data-testid="exec-digest-active-summary">
                  <ScheduleSummaryRow label="Next send" value={formatExecDigestNextSendLabel(form)} />
                  <ScheduleSummaryRow label="Cadence" value={formatExecDigestCadenceLabel(form)} />
                  <ScheduleSummaryRow label="Recipients" value={String(recipientCount)} />
                  <ScheduleSummaryRow
                    label="Time zone"
                    value={form.ianaTimeZoneId}
                  />
                </dl>
              ) : null}

              {status?.kind === "off" || status?.kind === "paused" ? (
                <dl className="m-0 mt-4 grid gap-2 sm:grid-cols-3" data-testid="exec-digest-inactive-summary">
                  <ScheduleSummaryRow label="Digest status" value={status.label} />
                  <ScheduleSummaryRow label="Recipients" value={recipientCount === 0 ? "None" : String(recipientCount)} />
                  <ScheduleSummaryRow label="Next send" value="Not scheduled" />
                </dl>
              ) : null}
            </section>

            <section
              className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
              aria-labelledby="exec-digest-schedule-form-heading"
            >
              <div>
                <h2
                  id="exec-digest-schedule-form-heading"
                  className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}
                >
                  Schedule
                </h2>
                <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Cadence: {formatExecDigestCadenceLabel(form)} ({form.ianaTimeZoneId})
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="exec-digest-enabled"
                  type="checkbox"
                  className="h-4 w-4"
                  checked={form.emailEnabled}
                  disabled={!canMutate}
                  aria-describedby="exec-digest-enabled-help"
                  onChange={(e) => updateForm({ emailEnabled: e.target.checked })}
                />
                <Label htmlFor="exec-digest-enabled" className={cn("m-0 font-semibold", OPERATOR_TYPOGRAPHY.body)}>
                  Send executive digest
                </Label>
              </div>
              <p id="exec-digest-enabled-help" className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                Turn on recurring outbound email delivery for executive recipients.
              </p>

              <fieldset
                className={cn("m-0 space-y-4 border-0 p-0", !form.emailEnabled && "opacity-80")}
                disabled={!form.emailEnabled || !canMutate}
              >
                <div className="space-y-1.5">
                  <Label htmlFor="exec-digest-recipients" className="font-semibold">
                    Recipients
                  </Label>
                  <Input
                    id="exec-digest-recipients"
                    value={form.recipients}
                    onChange={(e) => updateForm({ recipients: e.target.value })}
                    onBlur={() => setRecipientsTouched(true)}
                    aria-invalid={recipientsTouched && !recipientValidation.valid}
                    aria-describedby="exec-digest-recipients-help exec-digest-recipients-errors"
                  />
                  <p
                    id="exec-digest-recipients-help"
                    className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                  >
                    {EXEC_DIGEST_DIRECT_RECIPIENTS_HELPER}
                  </p>
                  <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    <Link href="/digests?tab=subscriptions" className="text-al-link underline-offset-2 hover:underline">
                      Manage subscriptions
                    </Link>
                    {" "}for architecture digest delivery.
                  </p>
                  <div id="exec-digest-recipients-errors">
                    {recipientsTouched && recipientValidation.invalidAddresses.length > 0 ? (
                      <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                        Invalid email address
                        {recipientValidation.invalidAddresses.length === 1 ? "" : "es"}:{" "}
                        {recipientValidation.invalidAddresses.join(", ")}
                      </p>
                    ) : null}
                    {recipientsTouched && recipientValidation.duplicateAddresses.length > 0 ? (
                      <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                        Duplicate recipient: {recipientValidation.duplicateAddresses.join(", ")}
                      </p>
                    ) : null}
                    {recipientsTouched && recipientValidation.unsupportedGroupMailboxes.length > 0 ? (
                      <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                        Unsupported group mailbox: {recipientValidation.unsupportedGroupMailboxes.join(", ")}
                      </p>
                    ) : null}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label htmlFor="exec-digest-tz" className="font-semibold">
                      Time zone
                    </Label>
                    <select
                      id="exec-digest-tz"
                      className={SELECT_CLASS}
                      value={normalizeIanaTimeZoneForSelect(form.ianaTimeZoneId)}
                      onChange={(e) => updateForm({ ianaTimeZoneId: toStoredIanaTimeZoneId(e.target.value) })}
                    >
                      {ianaTimeZoneOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
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
                      onChange={(e) => updateForm({ hourOfDay: Number.parseInt(e.target.value, 10) })}
                    >
                      {EXEC_DIGEST_HOUR_OPTIONS.map((option) => (
                        <option key={option.value} value={String(option.value)}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </fieldset>

              {enableActivationSummary !== null ? (
                <p
                  className={cn("m-0 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-950 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="exec-digest-activation-summary"
                  role="status"
                >
                  {enableActivationSummary} Generation may consume AI budget when advisory scans run.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
                <Button
                  type="button"
                  size="sm"
                  variant="primary"
                  disabled={!canMutate || saving || !formValid || (!unsavedChanges && prefs.isConfigured)}
                  onClick={() => void onSave()}
                  data-testid="exec-digest-save-schedule"
                >
                  {saving ? "Saving…" : saveLabel}
                </Button>
                <Button
                  asChild={hasPreviewDigest}
                  size="sm"
                  variant="outline"
                  disabled={!hasPreviewDigest}
                  data-testid="exec-digest-preview-action"
                  title={hasPreviewDigest ? EXEC_DIGEST_PREVIEW_HELPER : DIGESTS_BROWSE_PREVIEW_DISABLED_TITLE}
                >
                  {hasPreviewDigest ? (
                    <Link href={previewHref}>{DIGESTS_SCHEDULE_PREVIEW_LABEL}</Link>
                  ) : (
                    <span>{DIGESTS_SCHEDULE_PREVIEW_LABEL}</span>
                  )}
                </Button>
                <Button
                  asChild
                  size="sm"
                  variant="outline"
                  data-testid="exec-digest-test-action"
                  title={EXEC_DIGEST_TEST_GENERATION_HELPER}
                >
                  <Link href="/advisory?tab=schedules">{DIGESTS_SCHEDULE_GENERATE_TEST_LABEL}</Link>
                </Button>
              </div>

              <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                {EXEC_DIGEST_PREVIEW_HELPER}
              </p>

              <div className="flex flex-wrap items-center gap-2">
                {unsavedChanges ? (
                  <StatusTag kind="needs-attention" label="Unsaved changes" data-testid="exec-digest-unsaved-status" />
                ) : saveSuccess ? (
                  <span
                    className={cn("text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.helper)}
                    data-testid="exec-digest-save-success"
                    role="status"
                  >
                    Schedule saved
                  </span>
                ) : prefs.isConfigured ? (
                  <StatusTag kind="ready" label="Schedule saved" data-testid="exec-digest-saved-status" />
                ) : null}
              </div>
            </section>
          </div>

          <aside className="space-y-4">
            <section
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
              data-testid="exec-digest-delivery-readiness"
            >
              <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Delivery readiness
              </h2>
              <ul className="m-0 mt-3 list-none space-y-3 p-0">
                {readinessItems.map((item) => (
                  <li key={item.id} className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{item.label}</p>
                      <p className={cn("m-0 mt-0.5 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{item.value}</p>
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
                  variant="ghost"
                  className="mt-4"
                  onClick={onRefresh}
                  disabled={refreshing}
                  data-testid="exec-digest-refresh-status"
                >
                  {refreshing ? "Refreshing…" : "Refresh status"}
                </Button>
              ) : null}
            </section>

            {savedSummary !== null && prefs.isConfigured ? (
              <section
                className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
                data-testid="exec-digest-saved-summary"
              >
                <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  Saved schedule
                </h2>
                <dl className="m-0 mt-3 grid gap-3">
                  <ScheduleSummaryRow label="Status" value={savedSummary.statusLabel} />
                  <ScheduleSummaryRow label="Cadence" value={savedSummary.cadence} />
                  <ScheduleSummaryRow label="Time zone" value={savedSummary.timeZone} />
                  <ScheduleSummaryRow label="Next scheduled send" value={savedSummary.nextScheduledSend} />
                  <ScheduleSummaryRow label="Direct recipients" value={String(savedSummary.directRecipientCount)} />
                  <ScheduleSummaryRow
                    label="Subscription recipients"
                    value={String(savedSummary.subscriptionRecipientCount)}
                  />
                  <ScheduleSummaryRow label="Last successful delivery" value={savedSummary.lastSuccessfulDelivery} />
                  <ScheduleSummaryRow label="Last failed delivery" value={savedSummary.lastFailedDelivery} />
                </dl>
              </section>
            ) : null}

            <section
              className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
              data-testid="exec-digest-latest-generated"
            >
              <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                Latest generated digest
              </h2>
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
                {hasPreviewDigest
                  ? formatDigestInstant(healthSnap?.latestArchitectureDigestGeneratedUtc)
                  : "No architecture digest generated yet."}
              </p>
              <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                {EXEC_DIGEST_TEST_GENERATION_HELPER}
              </p>
            </section>

            {showTechnicalDetails ? (
              <section
                className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950"
                data-testid="exec-digest-schedule-technical-details"
              >
                <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.cardTitle)}>
                  Technical details
                </h2>
                <dl className={cn("m-0 mt-3 grid gap-2", OPERATOR_TYPOGRAPHY.helper)}>
                  <div>
                    <dt className="font-medium text-al-text-primary">Schema version</dt>
                    <dd className="m-0 font-mono">{prefs.schemaVersion}</dd>
                  </div>
                  <div>
                    <dt className="font-medium text-al-text-primary">Last saved</dt>
                    <dd className="m-0">{new Date(prefs.updatedUtc).toLocaleString()}</dd>
                  </div>
                </dl>
              </section>
            ) : null}
          </aside>
        </div>
      )}
    </div>
  );
}
