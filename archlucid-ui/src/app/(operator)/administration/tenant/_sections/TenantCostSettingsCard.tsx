"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { OperatorSuccessCallout } from "@/components/operator/OperatorSuccessCallout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BUYER_DEMO_CAPABILITY_UNAVAILABLE_TITLE } from "@/lib/buyer-polish-copy";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { showError } from "@/lib/toast";
import type { TenantCostSettingsPutRequest, TenantCostSettingsResponse } from "@/types/tenant-cost-settings";

type TenantCostSettingsCardProps = {
  readonly canEdit: boolean;
};

function parseUsdField(raw: string): number | null {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    return null;
  }

  const value = Number(trimmed);

  if (!Number.isFinite(value)) {
    return Number.NaN;
  }

  return value;
}

/** ROI cost assumptions for estimated USD savings on pilot deltas and executive summaries. */
export function TenantCostSettingsCard({ canEdit }: TenantCostSettingsCardProps) {
  const demoMode = isNextPublicDemoMode();
  const [loading, setLoading] = useState(!demoMode);
  const [saving, setSaving] = useState(false);
  const [loadFailure, setLoadFailure] = useState<string | null>(null);
  const [isTenantConfigured, setIsTenantConfigured] = useState(false);
  const [hourlyRate, setHourlyRate] = useState("");
  const [incidentCost, setIncidentCost] = useState("");
  const [eaDiscountPercentage, setEaDiscountPercentage] = useState("0");
  const [saveConfirmation, setSaveConfirmation] = useState<string | null>(null);

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

      setIsTenantConfigured(data.isTenantConfigured);
      setHourlyRate(String(data.architectHourlyRateUsd));
      setIncidentCost(String(data.averageIncidentCostUsd));
      setEaDiscountPercentage(String(data.eaDiscountPercentage ?? 0));
    } catch (error: unknown) {
      setLoadFailure(toApiLoadFailure(error).message);
    } finally {
      setLoading(false);
    }
  }, [demoMode]);

  useEffect(() => {
    void load();
  }, [load]);

  const onSave = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();

      if (!canEdit || demoMode) {
        return;
      }

      const architectHourlyRateUsd = parseUsdField(hourlyRate);
      const averageIncidentCostUsd = parseUsdField(incidentCost);
      const eaDiscountPct = parseUsdField(eaDiscountPercentage);

      if (
        architectHourlyRateUsd === null ||
        averageIncidentCostUsd === null ||
        eaDiscountPct === null ||
        Number.isNaN(architectHourlyRateUsd) ||
        Number.isNaN(averageIncidentCostUsd) ||
        Number.isNaN(eaDiscountPct)
      ) {
        showError("Invalid values", "Enter numeric values for all fields.");

        return;
      }

      if (architectHourlyRateUsd <= 0 || averageIncidentCostUsd <= 0) {
        showError("Invalid values", "Both USD amounts must be greater than zero.");

        return;
      }

      if (eaDiscountPct < 0 || eaDiscountPct > 100) {
        showError("Invalid EA discount", "EA discount percentage must be between 0 and 100.");

        return;
      }

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

        setIsTenantConfigured(saved.isTenantConfigured);
        setHourlyRate(String(saved.architectHourlyRateUsd));
        setIncidentCost(String(saved.averageIncidentCostUsd));
        setEaDiscountPercentage(String(saved.eaDiscountPercentage ?? 0));
        setSaveConfirmation("Cost settings saved.");
      } catch (error: unknown) {
        showError("Could not save cost settings", toApiLoadFailure(error).message);
      } finally {
        setSaving(false);
      }
    },
    [canEdit, demoMode, hourlyRate, incidentCost, eaDiscountPercentage],
  );

  if (demoMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Cost settings</CardTitle>
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
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Cost settings</CardTitle>
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
          These values are used to estimate review savings and executive ROI when actual cost evidence is unavailable.
          {!isTenantConfigured ? " Showing platform defaults until you save." : null}
        </p>
      </CardHeader>
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
              <div>
                <Label htmlFor="architect-hourly-rate">Average architect hourly rate (USD)</Label>
                <Input
                  id="architect-hourly-rate"
                  inputMode="decimal"
                  value={hourlyRate}
                  onChange={(ev) => setHourlyRate(ev.target.value)}
                  readOnly={!canEdit}
                  data-testid="tenant-cost-hourly-rate"
                />
              </div>
              <div>
                <Label htmlFor="average-incident-cost">Average incident cost (USD)</Label>
                <Input
                  id="average-incident-cost"
                  inputMode="decimal"
                  value={incidentCost}
                  onChange={(ev) => setIncidentCost(ev.target.value)}
                  readOnly={!canEdit}
                  data-testid="tenant-cost-incident-cost"
                />
              </div>
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
              />
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
              <Button type="submit" disabled={!canEdit || saving} data-testid="tenant-cost-settings-save">
                {saving ? "Saving…" : "Save cost settings"}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );
}
