"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import type { components } from "@/lib/api-types.generated";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { buyerLabelForQualityGateMode } from "@/lib/quality-gate-mode-buyer-label";
import { STRICT_AI_QUALITY_MODE_BUYER_LABEL, WARN_ONLY_QUALITY_MODE_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type TenantAgentOutputQualityGateModeResponse = components["schemas"]["TenantAgentOutputQualityGateModeResponse"];

type QualityGateMode = "WarnOnly" | "PilotStrict";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      mode: TenantAgentOutputQualityGateModeResponse;
    }
  | { status: "blocked"; note: string };

const modeEndpoint = "/api/proxy/v1/admin/settings/agent-output-quality-gate-mode";

function parseModeSettings(body: unknown): TenantAgentOutputQualityGateModeResponse | null {
  if (body == null || typeof body !== "object") return null;

  const record = body as TenantAgentOutputQualityGateModeResponse;
  const effectiveMode = record.effectiveMode;
  const source = record.source;
  const hostDefaultMode = record.hostDefaultMode;

  if (effectiveMode !== "WarnOnly" && effectiveMode !== "PilotStrict") return null;
  if (hostDefaultMode !== "WarnOnly" && hostDefaultMode !== "PilotStrict") return null;
  if (source !== "HostDefault" && source !== "TenantOverride") return null;

  return record;
}

type QualityGateModeControlsProps = {
  mode: TenantAgentOutputQualityGateModeResponse;
  saving: boolean;
  onSelectMode: (mode: QualityGateMode) => void;
  onClearOverride: () => void;
};

function QualityGateModeControls(props: QualityGateModeControlsProps) {
  const { mode, saving, onSelectMode, onClearOverride } = props;
  const usingOverride = mode.source === "TenantOverride";

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700" data-testid="quality-gate-mode-controls">
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Effective mode: <span className="font-medium">{buyerLabelForQualityGateMode(mode.effectiveMode)}</span>
        {usingOverride ? (
          <span className="text-al-text-secondary"> (workspace override)</span>
        ) : (
          <span className="text-al-text-secondary">
            {" "}
            (deployment default: {buyerLabelForQualityGateMode(mode.hostDefaultMode)})
          </span>
        )}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          variant={mode.effectiveMode === "WarnOnly" ? "default" : "outline"}
          disabled={saving || mode.effectiveMode === "WarnOnly"}
          onClick={() => void onSelectMode("WarnOnly")}
        >
          {WARN_ONLY_QUALITY_MODE_BUYER_LABEL}
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode.effectiveMode === "PilotStrict" ? "default" : "outline"}
          disabled={saving || mode.effectiveMode === "PilotStrict"}
          onClick={() => void onSelectMode("PilotStrict")}
        >
          {STRICT_AI_QUALITY_MODE_BUYER_LABEL}
        </Button>
        {usingOverride ? (
          <Button type="button" size="sm" variant="outline" disabled={saving} onClick={() => void onClearOverride()}>
            Use default
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function TenantQualityGatesCard() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const fetchOpts = mergeRegistrationScopeForProxy({
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      const modeRes = await fetch(modeEndpoint, fetchOpts);

      if (!modeRes.ok) {
        setState({
          status: "blocked",
          note:
            modeRes.status === 401 || modeRes.status === 403
              ? "Admin session required to manage quality gate mode."
              : `Quality gate settings unavailable (HTTP ${modeRes.status}).`,
        });

        return;
      }

      const modeBody = parseModeSettings(await modeRes.json());

      if (modeBody == null) {
        setState({ status: "blocked", note: "Unexpected quality gate mode response from the API." });

        return;
      }

      setState({
        status: "ready",
        mode: modeBody,
      });
    } catch (e: unknown) {
      setState({ status: "blocked", note: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const applyMode = useCallback(
    async (mode: QualityGateMode) => {
      setSaving(true);

      try {
        const res = await fetch(modeEndpoint, {
          ...mergeRegistrationScopeForProxy({
            method: "PUT",
            headers: { Accept: "application/json", "Content-Type": "application/json" },
          }),
          body: JSON.stringify({ mode }),
        });

        if (!res.ok) {
          setState({
            status: "blocked",
            note: `Failed to update quality gate mode (HTTP ${res.status}).`,
          });

          return;
        }

        await load();
      } catch (e: unknown) {
        setState({ status: "blocked", note: e instanceof Error ? e.message : String(e) });
      } finally {
        setSaving(false);
      }
    },
    [load],
  );

  const clearOverride = useCallback(async () => {
    setSaving(true);

    try {
      const res = await fetch(
        modeEndpoint,
        mergeRegistrationScopeForProxy({ method: "DELETE", headers: { Accept: "application/json" } }),
      );

      if (!res.ok) {
        setState({
          status: "blocked",
          note: `Failed to reset quality gate mode (HTTP ${res.status}).`,
        });

        return;
      }

      await load();
    } catch (e: unknown) {
      setState({ status: "blocked", note: e instanceof Error ? e.message : String(e) });
    } finally {
      setSaving(false);
    }
  }, [load]);

  return (
    <Card data-testid="tenant-quality-gates-card">
      <CardHeader>
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Quality gates</CardTitle>
      </CardHeader>
      <CardContent className={cn("space-y-4 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
        <p className="m-0">
          Choose whether this workspace warns on weak agent output or blocks the review.{" "}
          {WARN_ONLY_QUALITY_MODE_BUYER_LABEL} keeps the pipeline moving; {STRICT_AI_QUALITY_MODE_BUYER_LABEL} rejects
          runs that miss evidence or score floors.
        </p>

        {state.status === "loading" ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading quality gate settings…</p> : null}
        {state.status === "blocked" ? (
          <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {state.note}
          </p>
        ) : null}
        {state.status === "ready" ? (
          <QualityGateModeControls
            mode={state.mode}
            saving={saving}
            onSelectMode={applyMode}
            onClearOverride={clearOverride}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
