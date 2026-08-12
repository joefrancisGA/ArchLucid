"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent, type ReactNode } from "react";

import { BaselineFieldMessage } from "@/components/forms/BaselineFieldMessage";
import { Button } from "@/components/ui/button";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StatusTag } from "@/components/ui/status-tag";
import { BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE } from "@/lib/buyer/buyer-polish-copy";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { formatRelativeTime } from "@/lib/relative-time";
import { showError } from "@/lib/toast";
import {
  TENANT_COST_SETTINGS_AUDIT_HREF,
  TENANT_COST_SETTINGS_AUDIT_TRAIL_LINK_LABEL,
  TENANT_COST_SETTINGS_DEFAULTS_STATUS_LABEL,
  TENANT_COST_SETTINGS_LAST_CHANGED_PREFIX,
} from "@/lib/tenant-settings-page-copy";
import { validateTenantCostSettingsFields } from "@/lib/tenant-cost-settings-validation";
import type { TenantCostSettingsPutRequest, TenantCostSettingsResponse } from "@/types/tenant-cost-settings";

type TenantCostSettingsCardProps = {
  readonly canEdit: boolean;
};

type CurrencyUsdFieldProps = {
  readonly id: string;
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  readonly readOnly: boolean;
  readonly testId: string;
  readonly error: string | null;
};

function CurrencyUsdField(props: CurrencyUsdFieldProps) {
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
          className={cn("pl-7 font-mono", OPERATOR_TYPOGRAPHY.body)}
        />
      </div>
      <BaselineFieldMessage error={props.error} />
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
        {TENANT_COST_SETTINGS_LAST_CHANGED_PREFIX}: {formatRelativeTime(changedAt)}
      </span>{" "}
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

/** ROI cost assumptions for estimated USD savings on pilot deltas and executive summaries. */
export function TenantCostSettingsCard({ canEdit }: TenantCostSettingsCardProps) {
  const demoMode = isNextPublicDemoMode();
  const [loading, setLoading] = useState(!demoMode);
  const [saving, setSaving] = useState(false);
  const [loadFailure, setLoadFailure] = useState<string | null>(null);
  const [isTenantConfigured, setIsTenantConfigured] = useState(false);
  const [updatedUtc, setUpdatedUtc] = useState<string | null>(null);
  const [hourlyRate, setHourlyRate] = useState("");
  const [incidentCost, setIncidentCost] = useState("");
  const [eaDiscountPercentage, setEaDiscountPercentage] = useState("0");
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);
  const fieldValidation = useMemo(
    () => validateTenantCostSettingsFields(hourlyRate, incidentCost, eaDiscountPercentage),
    [eaDiscountPercentage, hourlyRate, incidentCost],
  );

  const applyLoadedSettings = useCallback((data: TenantCostSettingsResponse) => {
    setIsTenantConfigured(data.isTenantConfigured);
    setUpdatedUtc(data.updatedUtc);
    setHourlyRate(String(data.architectHourlyRateUsd));
    setIncidentCost(String(data.averageIncidentCostUsd));
    setEaDiscountPercentage(String(data.eaDiscountPercentage ?? 0));
  }, []);

  const load = useCallback(async () => {
    if (demoMode) {
      return;
    }

    setLoading(true);
    setLoadFailure(null);

    try {
      const res = await fetch("/api/proxy/v1/tenant/cost-settings", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: "include",
      });

      if (!res.ok) {
        const text = await res.text();

        throw { status: res.status, body: text };
      }

      const data = (await res.json()) as TenantCostSettingsResponse;

      applyLoadedSettings(data);
    } catch (error: unknown) {
      setLoadFailure(toApiLoadFailure(error).message);
    } finally {
      setLoading(false);
    }
  }, [applyLoadedSettings, demoMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!canEdit || demoMode || !fieldValidation.valid) {
        return;
      }

      const architectHourlyRateUsd = Number(hourlyRate.trim());
      const averageIncidentCostUsd = Number(incidentCost.trim());
      const eaDiscountPct = Number(eaDiscountPercentage.trim());

      const body: TenantCostSettingsPutRequest = {
        architectHourlyRateUsd,
        averageIncidentCostUsd,
        eaDiscountPercentage: eaDiscountPct,
      };

      setSaving(true);
      setSaveConfirmation(null);

      try {
        const res = await fetch("/api/proxy/v1/tenant/cost-settings", {
          method: "PUT",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const text = await res.text();

          throw { status: res.status, body: text };
        }

        const saved = (await res.json()) as TenantCostSettingsResponse;

        applyLoadedSettings(saved);
        setSaveConfirmation("Cost settings saved.");
      } catch (error: unknown) {
        showError("Could not save cost settings", toApiLoadFailure(error).message);
      } finally {
        setSaving(false);
      }
    },
    [applyLoadedSettings, canEdit, demoMode, fieldValidation.valid, hourlyRate, incidentCost, eaDiscountPercentage],
  );

  const helperCopy = isTenantConfigured
    ? "These values are used to estimate review savings and executive ROI when actual cost evidence is unavailable."
    : "These values are used to estimate review savings and executive ROI when actual cost evidence is unavailable. Showing platform defaults until you save.";

  if (demoMode) {
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

  return (
    <Card data-testid="tenant-cost-settings-card">
      <CostSettingsCardHeader
        isTenantConfigured={isTenantConfigured}
        updatedUtc={updatedUtc}
        helper={helperCopy}
      />
      <CardContent>
        {loadFailure !== null ? (
          <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {loadFailure}
          </p>
        ) : null}

        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading cost settings…</p>
        ) : (
          <form onSubmit={(e) => void onSave(e)} className="space-y-4">
            {saveConfirmation !== null ? (
              <OperatorSuccessCallout
                message={saveConfirmation}
                testId="tenant-cost-settings-saved"
                onDismiss={() => setSaveConfirmation(null)}
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
              <Input
                id="ea-discount-percentage"
                inputMode="decimal"
                value={eaDiscountPercentage}
                onChange={(ev) => setEaDiscountPercentage(ev.target.value)}
                readOnly={!canEdit}
                data-testid="tenant-cost-ea-percentage"
                aria-invalid={fieldValidation.eaError !== null}
                className={cn("max-w-[12rem] font-mono", OPERATOR_TYPOGRAPHY.body)}
              />
              <BaselineFieldMessage error={fieldValidation.eaError} />
              <p className={cn("m-0 mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                0 = list pricing. 15 applies EffectivePrice = RetailPrice × 0.85 to Cost-category ROI savings.
              </p>
            </div>

            {!canEdit ? (
              <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Editing requires operator rank (Execute) on the API; your session is read-only for these controls.
              </p>
            ) : null}

            <div>
              <Button
                type="submit"
                variant="primary"
                disabled={!canEdit || saving || !fieldValidation.valid}
                data-testid="tenant-cost-settings-save"
              >
                {saving ? "Saving…" : "Save cost settings"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
