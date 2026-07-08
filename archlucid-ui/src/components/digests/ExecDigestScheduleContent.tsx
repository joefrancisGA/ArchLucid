"use client";

import { cn } from "@/lib/utils";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

import { useCallback, useEffect, useMemo, useState, type ReactElement } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
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
  EXEC_DIGEST_DAY_NAMES,
  EXEC_DIGEST_HOUR_OPTIONS,
  execDigestFormFromPreferences,
  execDigestUpsertFromForm,
  formatExecDigestNextSendPreview,
  hasUnsavedExecDigestChanges,
  isExecDigestScheduleFormValid,
  type ExecDigestScheduleFormState,
  validateExecDigestRecipientEmails,
} from "@/lib/exec-digest-schedule-form";
import {
  getIanaTimeZoneSelectOptions,
  normalizeIanaTimeZoneForSelect,
  toStoredIanaTimeZoneId,
} from "@/lib/iana-time-zone-select";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";

const SCHEDULE_SUBTITLE =
  "Send a weekly summary of review activity, governance signals, findings, and dashboard links to executive recipients.";

const DELIVERY_NOTE =
  "Digest emails are sent through the workspace's configured outbound email channel.";

const RECIPIENT_FALLBACK_NOTE =
  "If no recipients are listed, ArchLucid will use the configured workspace admin mailbox when available.";

const SELECT_CLASS = cn(
  "flex h-9 w-full rounded-md border border-neutral-200 bg-transparent px-3 py-1 shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-950 dark:focus-visible:ring-neutral-600",
  OPERATOR_TYPOGRAPHY.body,
);

export type ExecDigestScheduleContentProps = {
  readonly refreshToken?: number;
};

/**
 * Schedule tab: weekly executive digest email preferences (Read view; save requires operator rank / mutation hook).
 */
export function ExecDigestScheduleContent(props: ExecDigestScheduleContentProps = {}): ReactElement {
  const { refreshToken = 0 } = props;
  const canMutate: boolean = useOperateCapability();
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
  const nextSendPreview: string =
    form !== null ? formatExecDigestNextSendPreview(form) : "Loading schedule preview…";

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

  return (
    <div className="w-full max-w-3xl space-y-4" data-testid="exec-digest-schedule-content">
      <div>
        <h2 className={cn("m-0 font-semibold text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.pageTitle)}>
          Weekly executive digest
        </h2>
        <p className={cn("m-0 mt-1 max-w-2xl text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>
          {SCHEDULE_SUBTITLE}
        </p>
        <p className={cn("m-0 mt-2 max-w-2xl text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
          This is the default weekly digest schedule for executive recipients. Architecture digests from advisory scans
          and subscriptions are configured separately on the Browse and Subscriptions tabs.
        </p>
      </div>

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
        <p className={cn("text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.body)}>Loading schedule…</p>
      ) : (
        <>
          <div
            className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900"
            data-testid="exec-digest-schedule-preview"
          >
            <p className={cn("m-0 font-medium text-neutral-900 dark:text-neutral-100", OPERATOR_TYPOGRAPHY.body)}>
              {nextSendPreview}
            </p>
            <p className={cn("m-0 mt-1 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              {DELIVERY_NOTE}
            </p>
          </div>

          <div className="space-y-4 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-700 dark:bg-neutral-950">
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700">
              <input
                id="exec-digest-enabled"
                type="checkbox"
                className="h-4 w-4"
                checked={form.emailEnabled}
                disabled={!canMutate}
                onChange={(e) => updateForm({ emailEnabled: e.target.checked })}
              />
              <Label htmlFor="exec-digest-enabled" className={cn("m-0 font-medium", OPERATOR_TYPOGRAPHY.body)}>
                Enable weekly executive digest
              </Label>
            </div>

            <fieldset
              className={cn("m-0 space-y-4 border-0 p-0", !form.emailEnabled && "opacity-80")}
              disabled={!form.emailEnabled || !canMutate}
            >
              <div className="space-y-1.5">
                <Label htmlFor="exec-digest-recipients">Recipients</Label>
                <Input
                  id="exec-digest-recipients"
                  value={form.recipients}
                  onChange={(e) => updateForm({ recipients: e.target.value })}
                  onBlur={() => setRecipientsTouched(true)}
                  placeholder="ops@example.com; sponsor@example.com"
                  aria-invalid={recipientsTouched && !recipientValidation.valid}
                  aria-describedby="exec-digest-recipients-help"
                />
                <p
                  id="exec-digest-recipients-help"
                  className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}
                >
                  Add one or more email addresses or group mailboxes.
                </p>
                <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  {RECIPIENT_FALLBACK_NOTE}
                </p>
                {recipientsTouched && !recipientValidation.valid ? (
                  <p className={cn("m-0 text-rose-700 dark:text-rose-300", OPERATOR_TYPOGRAPHY.helper)} role="alert">
                    Invalid email address
                    {recipientValidation.invalidAddresses.length === 1 ? "" : "es"}:{" "}
                    {recipientValidation.invalidAddresses.join(", ")}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="exec-digest-tz">Time zone</Label>
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
                  <p className={cn("m-0 text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                    Digest send time uses this time zone.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="exec-digest-dow">Day of week</Label>
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
                  <Label htmlFor="exec-digest-hour">Send time</Label>
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

            <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
              <Button
                type="button"
                size="sm"
                variant="primary"
                disabled={!canMutate || saving || !formValid || (!unsavedChanges && prefs.isConfigured)}
                onClick={() => void onSave()}
                data-testid="exec-digest-save-schedule"
              >
                {saving ? "Saving…" : "Save schedule"}
              </Button>
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
              ) : (
                <span className={cn("text-neutral-500 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
                  Changes have not been saved.
                </span>
              )}
            </div>
          </div>

          <div
            className="rounded-md border border-neutral-200 px-3 py-2 dark:border-neutral-700"
            data-testid="exec-digest-action-notes"
          >
            <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>About actions</p>
            <ul className={cn("m-0 mt-2 list-disc space-y-1 pl-5 text-neutral-600 dark:text-neutral-400", OPERATOR_TYPOGRAPHY.helper)}>
              <li>
                <strong className="font-medium text-al-text-primary">Preview digest</strong> opens the most recently
                generated digest summary. It reflects saved delivery history, not unsaved form edits.
              </li>
              <li>
                <strong className="font-medium text-al-text-primary">Send test</strong> triggers an advisory scan to
                generate a digest. Test delivery uses saved subscriptions and the recipient list saved on this schedule.
              </li>
              <li>
                Test emails are sent only to the configured recipients on this schedule. If none are listed, ArchLucid
                uses the workspace admin mailbox when available.
              </li>
            </ul>
          </div>

          <CollapsibleSection
            title="Technical details"
            defaultOpen={false}
            sectionTestId="exec-digest-schedule-technical-details"
          >
            <dl className={cn("m-0 grid gap-2", OPERATOR_TYPOGRAPHY.helper)}>
              <div>
                <dt className="font-medium text-al-text-primary">Schema version</dt>
                <dd className="m-0 font-mono">{prefs.schemaVersion}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Last saved</dt>
                <dd className="m-0">{new Date(prefs.updatedUtc).toLocaleString()}</dd>
              </div>
              <div>
                <dt className="font-medium text-al-text-primary">Development-only</dt>
                <dd className="m-0">
                  Local and non-production environments may simulate outbound email delivery. Confirm integration
                  readiness before relying on production sends.
                </dd>
              </div>
            </dl>
          </CollapsibleSection>
        </>
      )}
    </div>
  );
}
