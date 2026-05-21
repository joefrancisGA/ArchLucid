"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";

import { ContextualHelp } from "@/components/ContextualHelp";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { isNextPublicDemoMode } from "@/lib/demo-ui-env";
import { showError, showSuccess } from "@/lib/toast";
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

      if (
        architectHourlyRateUsd === null ||
        averageIncidentCostUsd === null ||
        Number.isNaN(architectHourlyRateUsd) ||
        Number.isNaN(averageIncidentCostUsd)
      ) {
        showError("Invalid values", "Enter numeric USD amounts for both fields.");

        return;
      }

      if (architectHourlyRateUsd <= 0 || averageIncidentCostUsd <= 0) {
        showError("Invalid values", "Both amounts must be greater than zero.");

        return;
      }

      const body: TenantCostSettingsPutRequest = {
        architectHourlyRateUsd,
        averageIncidentCostUsd,
      };

      setSaving(true);

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
        showSuccess("Cost settings saved.");
      } catch (error: unknown) {
        showError("Could not save cost settings", toApiLoadFailure(error).message);
      } finally {
        setSaving(false);
      }
    },
    [canEdit, demoMode, hourlyRate, incidentCost],
  );

  if (demoMode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cost settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="m-0 text-sm text-neutral-500">Not available in demo mode.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card data-testid="tenant-cost-settings-card">
      <CardHeader>
        <div className="flex items-start gap-2">
          <CardTitle className="text-base">Cost settings</CardTitle>
          <ContextualHelp helpKey="tenant-cost-settings" />
        </div>
        <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400">
          Customize architect hourly rate and average incident cost used when estimating USD savings on runs and the
          executive ROI summary.
          {!isTenantConfigured ? " Showing platform defaults until you save." : null}
        </p>
      </CardHeader>
      <CardContent>
        {loadFailure !== null ? (
          <p className="m-0 text-sm text-rose-800 dark:text-rose-200" role="alert">
            {loadFailure}
          </p>
        ) : null}

        {loading ? (
          <p className="m-0 text-sm text-neutral-500">Loading cost settings…</p>
        ) : (
          <form onSubmit={(e) => void onSave(e)} className="space-y-4">
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

            {!canEdit ? (
              <p className="m-0 text-xs text-neutral-500">
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
