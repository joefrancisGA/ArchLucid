"use client";

import { type ReactElement } from "react";

import {
  OperatorRecipientChipField,
  OperatorRecipientSubscriptionsHelperLink,
} from "@/components/advisory/OperatorRecipientChipField";
import { DigestPreviewBeforeSubscribePanel } from "@/components/digests/DigestPreviewBeforeSubscribePanel";
import { ExecDigestSchedulePreviewPanel } from "@/components/digests/ExecDigestSchedulePreviewPanel";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { WhyDisabledCtaHint } from "@/components/usability/WhyDisabledCtaHint";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { DIGESTS_SUBSCRIPTIONS_TAB_PATH } from "@/lib/digests-route-paths";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  EXEC_DIGEST_DAY_NAMES,
  EXEC_DIGEST_HOUR_OPTIONS,
  maskExecDigestRecipientForDisplay,
  type ExecDigestScheduleFormState,
} from "@/lib/exec-digest-schedule-form";
import {
  EXEC_DIGEST_DIRECT_RECIPIENTS_HELPER,
  EXEC_DIGEST_SUBSCRIPTIONS_HELPER,
  type ExecDigestDeliveryReadinessModel,
  type ExecDigestSavedScheduleSummary,
  type ExecDigestStatusPresentation,
} from "@/lib/exec-digest-schedule-page-model";
import {
  formatIanaTimeZoneOptionLabel,
  normalizeIanaTimeZoneForSelect,
  toStoredIanaTimeZoneId,
  type IanaTimeZoneSelectOption,
} from "@/lib/iana-time-zone-select";
import {
  resolveExecDigestScheduleEmphasizedStepId,
  resolveExecDigestScheduleSteps,
} from "@/lib/exec-digest-schedule-checklist";
import type { ExecDigestPreferencesResponse } from "@/types/exec-digest-preferences";
import type { WeeklyDigestHealthDto } from "@/types/operate-rhythm";
import type { WhyDisabledCtaReason } from "@/lib/why-disabled-cta";
import { cn } from "@/lib/utils";
import { validateExecDigestRecipientEmails } from "@/lib/exec-digest-schedule-form";

export type ExecDigestScheduleFormProps = {
  readonly sampleModeBlocked: boolean;
  readonly canMutate: boolean;
  readonly form: ExecDigestScheduleFormState;
  readonly prefs: ExecDigestPreferencesResponse;
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
  readonly saving: boolean;
  readonly enabling: boolean;
  readonly pausing: boolean;
  readonly saveSuccess: string | null;
  readonly healthSnap: WeeklyDigestHealthDto | null | undefined;
  readonly onRefresh: (() => void) | undefined;
  readonly refreshing: boolean;
  readonly updateForm: (patch: Partial<ExecDigestScheduleFormState>) => void;
  readonly onSaveSchedule: () => Promise<void>;
  readonly onEnableDelivery: () => Promise<void>;
  readonly onPauseDelivery: () => Promise<void>;
  readonly selectClassName: string;
};

export function ExecDigestScheduleForm(props: ExecDigestScheduleFormProps): ReactElement {
  const scheduleChecklistInput = {
    recipientsConfigured: props.recipientCount > 0,
    scheduleConfigured: props.formValid,
    deliveryEnabled: props.status?.kind === "active",
  };
  const scheduleSteps = resolveExecDigestScheduleSteps(scheduleChecklistInput);
  const scheduleEmphasizedStepId = resolveExecDigestScheduleEmphasizedStepId(scheduleChecklistInput);

  return (
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
          {props.liveScheduleSummary}
        </p>
      </div>
      {props.canMutate && scheduleSteps.length > 0 ? (
        <IntegrationConnectChecklist
          title="Schedule checklist"
          steps={scheduleSteps}
          emphasizedStepId={scheduleEmphasizedStepId}
          testIdPrefix="exec-digest-schedule"
        />
      ) : null}

      <OperatorRecipientChipField
        idPrefix="exec-digest"
        label="Direct recipients"
        canMutate={props.canMutate}
        recipientDraft={props.recipientDraft}
        recipientDraftError={props.recipientDraftError}
        recipientsTouched={props.recipientsTouched}
        recipientEmails={props.recipientEmails}
        recipientValidation={props.recipientValidation}
        maskEmailForDisplay={
          props.sampleModeBlocked ? maskExecDigestRecipientForDisplay : undefined
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
        onRecipientDraftChange={props.onRecipientDraftChange}
        onRecipientDraftBlur={props.onRecipientDraftBlur}
        onAddRecipient={props.addRecipientFromDraft}
        onRemoveRecipient={props.removeRecipient}
      />

      <fieldset className="m-0 grid gap-4 border-0 p-0 sm:grid-cols-2" disabled={!props.canMutate}>
        <legend className={cn("mb-1 font-semibold text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          Schedule
        </legend>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="exec-digest-tz" className="font-semibold">
            Time zone
          </Label>
          <select
            id="exec-digest-tz"
            className={props.selectClassName}
            value={normalizeIanaTimeZoneForSelect(props.form.ianaTimeZoneId)}
            disabled={!props.canMutate}
            onChange={(e) => props.updateForm({ ianaTimeZoneId: toStoredIanaTimeZoneId(e.target.value) })}
          >
            {props.ianaTimeZoneOptions.map((option) => (
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
            className={props.selectClassName}
            value={String(props.form.dayOfWeek)}
            disabled={!props.canMutate}
            onChange={(e) => props.updateForm({ dayOfWeek: Number.parseInt(e.target.value, 10) })}
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
            className={props.selectClassName}
            value={String(props.form.hourOfDay)}
            disabled={!props.canMutate}
            onChange={(e) => props.updateForm({ hourOfDay: Number.parseInt(e.target.value, 10) })}
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
        variant="sponsor-schedule"
        recipientEmails={props.recipientEmails}
        cadenceSummary={props.liveScheduleSummary ?? undefined}
      />

      {!props.pinLivePreviewRail ? (
        <ExecDigestSchedulePreviewPanel
          variant="delivery-readiness"
          sampleModeBlocked={props.sampleModeBlocked}
          form={props.form}
          prefs={props.prefs}
          status={props.status}
          readiness={props.readiness}
          savedSummary={props.savedSummary}
          recipientCount={props.recipientCount}
          subscriptionDestinationCount={props.subscriptionDestinationCount}
          liveScheduleSummary={props.liveScheduleSummary}
          pinLivePreviewRail={props.pinLivePreviewRail}
          hasPreviewDigest={props.hasPreviewDigest}
          previewHref={props.previewHref}
          healthSnap={props.healthSnap}
          onRefresh={props.onRefresh}
          refreshing={props.refreshing}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4 dark:border-neutral-800">
        <Button
          type="button"
          size="sm"
          variant="primary"
          disabled={!props.canMutate || props.busy || !props.formValid || !props.unsavedChanges}
          onClick={() => void props.onSaveSchedule()}
          data-testid="exec-digest-save-schedule"
        >
          {props.saving ? "Saving schedule…" : "Save schedule"}
        </Button>
        {props.form.emailEnabled ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!props.canMutate || props.busy}
            onClick={() => void props.onPauseDelivery()}
            data-testid="exec-digest-pause-delivery"
          >
            {props.pausing ? "Pausing…" : "Pause scheduled delivery"}
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!props.canMutate || props.busy || props.recipientCount === 0 || !props.recipientValidation.valid}
            aria-describedby={
              props.enableDeliveryRecipientRequiredReason === null
                ? undefined
                : props.enableDeliveryRecipientRequiredHintId
            }
            onClick={() => void props.onEnableDelivery()}
            data-testid="exec-digest-enable-delivery"
          >
            {props.enabling ? "Enabling delivery…" : "Enable scheduled delivery"}
          </Button>
        )}
      </div>

      <WhyDisabledCtaHint
        id={props.enableDeliveryRecipientRequiredHintId}
        reason={props.enableDeliveryRecipientRequiredReason}
        testId={props.enableDeliveryRecipientRequiredHintId}
      />

      <div className="flex flex-wrap items-center gap-2">
        {props.unsavedChanges ? (
          <StatusTag kind="needs-attention" label="Unsaved changes" data-testid="exec-digest-unsaved-status" />
        ) : null}
        {props.saveSuccess !== null ? (
          <span
            className={cn("text-emerald-800 dark:text-emerald-200", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="exec-digest-save-success"
            role="status"
          >
            {props.saveSuccess}
          </span>
        ) : null}
      </div>
    </section>
  );
}
