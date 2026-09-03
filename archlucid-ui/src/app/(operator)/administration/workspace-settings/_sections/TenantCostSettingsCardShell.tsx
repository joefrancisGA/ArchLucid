"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import type { FormEvent, ReactNode } from "react";

import { BaselineFieldMessage } from "@/components/forms/BaselineFieldMessage";
import { IntegrationConnectChecklist } from "@/components/integrations/IntegrationConnectChecklist";
import { MutatingInTenantChip } from "@/components/MutatingInTenantChip";
import { Button } from "@/components/ui/button";
import { OperatorSectionLoadFailure } from "@/components/operator/OperatorSectionLoadFailure";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { OperatorMutationInlineError } from "@/components/operator/OperatorMutationInlineError";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { formatRelativeTime } from "@/lib/relative-time";
import {
  TENANT_COST_SETTINGS_AUDIT_HREF,
  TENANT_COST_SETTINGS_AUDIT_TRAIL_LINK_LABEL,
  TENANT_COST_SETTINGS_DEFAULTS_STATUS_LABEL,
  TENANT_COST_SETTINGS_EA_DISCOUNT_HELPER,
  TENANT_COST_SETTINGS_LAST_CHANGED_PREFIX,
  TENANT_COST_SETTINGS_SAVE_READINESS_MESSAGE,
} from "@/lib/tenant-settings-page-copy";

import type { TenantCostSettingsFormState } from "./use-tenant-cost-settings-form";

type CurrencyUsdFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly readOnly: boolean;
  readonly testId: string;
  readonly error: string | null;
  readonly helperText?: string;
};

function CurrencyUsdField(props: CurrencyUsdFieldProps) {
  const errorId = `${props.id}-error`;
  const helperId = `${props.id}-helper`;
  const describedBy =
    props.error !== null
      ? errorId
      : props.helperText !== undefined
        ? helperId
        : undefined;

  return (
    <div>
      <Label htmlFor={props.id}>{props.label}</Label>
      <div className="relative mt-1">
        <span
          className={cn(
            "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-al-text-secondary",
            OPERATOR_TYPOGRAPHY.body,
          )}
          aria-hidden="true"
        >
          $
        </span>
        <Input
          id={props.id}
          inputMode="decimal"
          value={props.value}
          onChange={(ev) => props.onChange(ev.target.value)}
          readOnly={props.readOnly}
          data-testid={props.testId}
          aria-invalid={props.error !== null}
          aria-describedby={describedBy}
          className={cn("pl-7 font-mono", OPERATOR_TYPOGRAPHY.body)}
        />
      </div>
      <BaselineFieldMessage error={props.error} id={errorId} />
      {props.helperText !== undefined ? (
        <p
          id={helperId}
          className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
        >
          {props.helperText}
        </p>
      ) : null}
    </div>
  );
}

type CostSettingsLastChangedProps = {
  readonly updatedUtc: string | null;
};

function CostSettingsLastChangedAttribution(props: CostSettingsLastChangedProps) {
  const changedAt = props.updatedUtc?.trim();

  if (changedAt == null || changedAt.length === 0) {
    return null;
  }

  return (
    <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
      <span data-testid="tenant-cost-settings-last-changed">
        {TENANT_COST_SETTINGS_LAST_CHANGED_PREFIX} {formatRelativeTime(changedAt)}
      </span>
      {" — "}
      <Link
        className={OPERATOR_LINK.inline}
        href={TENANT_COST_SETTINGS_AUDIT_HREF}
        data-testid="tenant-cost-settings-audit-link"
      >
        {TENANT_COST_SETTINGS_AUDIT_TRAIL_LINK_LABEL}
      </Link>
    </p>
  );
}

type CostSettingsCardHeaderProps = {
  readonly isTenantConfigured: boolean;
  readonly updatedUtc: string | null;
  readonly helper: ReactNode;
};

function CostSettingsCardHeader(props: CostSettingsCardHeaderProps) {
  return (
    <CardHeader className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Cost settings
        </CardTitle>
        <MutatingInTenantChip />
        {!props.isTenantConfigured ? (
          <StatusTag
            kind="neutral"
            label={TENANT_COST_SETTINGS_DEFAULTS_STATUS_LABEL}
            data-testid="tenant-cost-settings-defaults-status"
          />
        ) : null}
      </div>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>{props.helper}</p>
      <CostSettingsLastChangedAttribution updatedUtc={props.updatedUtc} />
    </CardHeader>
  );
}

export function TenantCostSettingsDemoUnavailableCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle as="h3" className={OPERATOR_TYPOGRAPHY.cardTitle}>
          Cost settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
          {BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE}
        </p>
        <p className={cn("m-0 mt-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          In a connected tenant, tenant administrators configure architect rates and ROI inputs here.
        </p>
      </CardContent>
    </Card>
  );
}

export function TenantCostSettingsCardShell(state: TenantCostSettingsFormState) {
  const {
    canEdit,
    costSettingsQuery,
    saving,
    isTenantConfigured,
    updatedUtc,
    hourlyRate,
    setHourlyRate,
    incidentCost,
    setIncidentCost,
    eaDiscountPercentage,
    setEaDiscountPercentage,
    saveConfirmation,
    setSaveConfirmation,
    saveError,
    fieldValidation,
    onSave,
    loadFailure,
    loading,
    helperCopy,
    saveSteps,
    saveEmphasizedStepId,
  } = state;

  return (
    <Card data-testid="tenant-cost-settings-card">
      <CostSettingsCardHeader
        isTenantConfigured={isTenantConfigured}
        updatedUtc={updatedUtc}
        helper={helperCopy}
      />
      <CardContent>
        {loadFailure !== null ? (
          <OperatorSectionLoadFailure
            message={loadFailure}
            retrying={costSettingsQuery.isFetching}
            testId="tenant-cost-settings-load-failure"
            onRetry={() => void costSettingsQuery.refetch()}
          />
        ) : null}

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading cost settings…</p>
        ) : (
          <form onSubmit={(e: FormEvent) => void onSave(e)} className="space-y-4">
            {canEdit ? (
              <IntegrationConnectChecklist
                title="Save checklist"
                steps={saveSteps}
                emphasizedStepId={saveEmphasizedStepId}
                testIdPrefix="tenant-cost-settings"
              />
            ) : null}

            {saveConfirmation !== null ? (
              <OperatorSuccessCallout
                message={saveConfirmation}
                testId="tenant-cost-settings-saved"
                onDismiss={() => setSaveConfirmation(null)}
              />
            ) : null}

            {saveError !== null ? (
              <OperatorMutationInlineError
                message={saveError}
                testId="tenant-cost-settings-save-error"
                recoveryScenario="api-problem"
              />
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <CurrencyUsdField
                id="architect-hourly-rate"
                label="Average architect hourly rate (USD)"
                value={hourlyRate}
                onChange={setHourlyRate}
                readOnly={!canEdit}
                testId="tenant-cost-hourly-rate"
                error={fieldValidation.hourlyError}
              />
              <CurrencyUsdField
                id="average-incident-cost"
                label="Average incident cost (USD)"
                value={incidentCost}
                onChange={setIncidentCost}
                readOnly={!canEdit}
                testId="tenant-cost-incident-cost"
                error={fieldValidation.incidentError}
              />
            </div>

            <div>
              <Label htmlFor="ea-discount-percentage">Enterprise Agreement discount (% off Azure Retail)</Label>
              <div className="relative mt-1 max-w-[12rem]">
                <Input
                  id="ea-discount-percentage"
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  inputMode="decimal"
                  value={eaDiscountPercentage}
                  onChange={(ev) => setEaDiscountPercentage(ev.target.value)}
                  readOnly={!canEdit}
                  data-testid="tenant-cost-ea-percentage"
                  aria-invalid={fieldValidation.eaError !== null}
                  aria-describedby={
                    fieldValidation.eaError !== null ? "ea-discount-percentage-error" : "ea-discount-percentage-helper"
                  }
                  className={cn("pr-7 font-mono", OPERATOR_TYPOGRAPHY.body)}
                />
                <span
                  className={cn(
                    "pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-al-text-secondary",
                    OPERATOR_TYPOGRAPHY.body,
                  )}
                  aria-hidden="true"
                >
                  %
                </span>
              </div>
              <BaselineFieldMessage error={fieldValidation.eaError} id="ea-discount-percentage-error" />
              <p
                id="ea-discount-percentage-helper"
                className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
              >
                {TENANT_COST_SETTINGS_EA_DISCOUNT_HELPER}
              </p>
            </div>

            {!canEdit ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Editing requires operator rank (Execute) on the API; your session is read-only for these controls.
              </p>
            ) : null}

            <div className="flex flex-wrap items-center gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={!canEdit || saving || !fieldValidation.valid}
                data-testid="tenant-cost-settings-save"
              >
                {saving ? "Saving…" : "Save cost settings"}
              </Button>
              {!fieldValidation.valid && canEdit ? (
                <p
                  className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}
                  data-testid="tenant-cost-settings-save-readiness"
                >
                  {TENANT_COST_SETTINGS_SAVE_READINESS_MESSAGE}
                </p>
              ) : null}
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
