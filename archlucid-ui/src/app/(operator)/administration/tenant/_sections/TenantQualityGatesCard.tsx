"use client";

import { cn } from "@/lib/utils";
import { Fragment, useCallback, useEffect, useState } from "react";

import type { components } from "@/lib/api-types.generated";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { agentOutputQualityGateConfigPaths, selectAgentOutputQualityGateRows } from "@/lib/quality-gate-config-summary";
import { buyerLabelForQualityGateMode } from "@/lib/quality-gate-mode-buyer-label";
import { STRICT_AI_QUALITY_MODE_BUYER_LABEL, WARN_ONLY_QUALITY_MODE_BUYER_LABEL } from "@/lib/usability/canonical-product-terms";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";

type AdminConfigSummaryResponse = components["schemas"]["AdminConfigSummaryResponse"];
type AdminQualityGateDiagnosticsResponse = components["schemas"]["AdminQualityGateDiagnosticsResponse"];
type TenantAgentOutputQualityGateModeResponse = components["schemas"]["TenantAgentOutputQualityGateModeResponse"];

type QualityGateMode = "WarnOnly" | "PilotStrict";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ready";
      mode: TenantAgentOutputQualityGateModeResponse;
      rows: ReturnType<typeof selectAgentOutputQualityGateRows>;
      diagnostics: AdminQualityGateDiagnosticsResponse | null;
      diagnosticsNote: string | null;
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
    <QualityGateModeControlsSection
      mode={mode}
      saving={saving}
      usingOverride={usingOverride}
      onSelectMode={onSelectMode}
      onClearOverride={onClearOverride}
    />
  );
}

function QualityGateModeControlsSection(
  props: QualityGateModeControlsProps & { usingOverride: boolean },
) {
  const { mode, saving, usingOverride, onSelectMode, onClearOverride } = props;

  return (
    <div className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700" data-testid="quality-gate-mode-controls">
      <p className={cn("m-0 text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
        Effective mode: <span className="font-medium">{buyerLabelForQualityGateMode(mode.effectiveMode)}</span>
        {usingOverride ? (
          <span className="text-al-text-secondary"> (tenant override)</span>
        ) : (
          <span className="text-al-text-secondary">
            {" "}
            (host default: {buyerLabelForQualityGateMode(mode.hostDefaultMode)})
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
            Use host default
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

      const [modeRes, summaryRes, diagnosticsRes] = await Promise.all([
        fetch(modeEndpoint, fetchOpts),
        fetch("/api/proxy/v1/admin/config-summary?includeEffectiveValues=true", fetchOpts),
        fetch("/api/proxy/v1/admin/diagnostics/quality-gates", fetchOpts),
      ]);

      if (!modeRes.ok || !summaryRes.ok) {
        const failed = !modeRes.ok ? modeRes : summaryRes;

        setState({
          status: "blocked",
          note:
            failed.status === 401 || failed.status === 403
              ? "Admin session required to manage quality gate mode (`AdminAuthority`)."
              : `Quality gate settings unavailable (HTTP ${failed.status}).`,
        });

        return;
      }

      const modeBody = parseModeSettings(await modeRes.json());
      const summaryBody = (await summaryRes.json()) as AdminConfigSummaryResponse;

      if (modeBody == null) {
        setState({ status: "blocked", note: "Unexpected quality gate mode response from the API." });

        return;
      }

      let diagnostics: AdminQualityGateDiagnosticsResponse | null = null;
      let diagnosticsNote: string | null = null;

      if (!diagnosticsRes.ok) {
        diagnosticsNote =
          diagnosticsRes.status === 401 || diagnosticsRes.status === 403
            ? "Admin session required to read quality gate diagnostics."
            : `Quality gate diagnostics unavailable (HTTP ${diagnosticsRes.status}).`;
      } else {
        diagnostics = (await diagnosticsRes.json()) as AdminQualityGateDiagnosticsResponse;
      }

      setState({
        status: "ready",
        mode: modeBody,
        rows: selectAgentOutputQualityGateRows(summaryBody.keys ?? []),
        diagnostics,
        diagnosticsNote,
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
          Tenant override for{" "}
          <span className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>{agentOutputQualityGateConfigPaths.mode}</span>{" "}
          (<code>WarnOnly</code> vs <code>PilotStrict</code> — shown as {WARN_ONLY_QUALITY_MODE_BUYER_LABEL} vs{" "}
          {STRICT_AI_QUALITY_MODE_BUYER_LABEL}). Warn floors below remain host-configured via{" "}
          <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>GET /v1/admin/config-summary</span>. Effective reject floors and strict
          quality thresholds come from{" "}
          <span className={cn("font-mono", OPERATOR_TYPOGRAPHY.micro)}>GET /v1/admin/diagnostics/quality-gates</span>.
        </p>

        {state.status === "loading" ? <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading quality gate settings…</p> : null}
        {state.status === "blocked" ? (
          <p className={cn("m-0 text-rose-800 dark:text-rose-200", OPERATOR_TYPOGRAPHY.body)} role="alert">
            {state.note}
          </p>
        ) : null}
        {state.status === "ready" ? (
          <>
            <QualityGateModeControls
              mode={state.mode}
              saving={saving}
              onSelectMode={applyMode}
              onClearOverride={clearOverride}
            />
            <dl className={cn("m-0 grid grid-cols-[minmax(0,220px)_1fr] gap-x-3 gap-y-2 rounded-md border border-neutral-200 p-3 font-mono dark:border-neutral-700", OPERATOR_TYPOGRAPHY.micro)}>
              {state.rows.map((slot) => {
                const detail = slot.row;
                const value =
                  detail == null ? "—" : detail.effectiveValue != null ? detail.effectiveValue : detail.isSet ? "(set)" : "(default)";
                const trimmedCatalogPath = detail?.configPath?.trim();
                const pathLabel =
                  trimmedCatalogPath != null && trimmedCatalogPath.length > 0
                    ? trimmedCatalogPath
                    : slot.label === "Mode"
                      ? agentOutputQualityGateConfigPaths.mode
                      : slot.label === "StructuralWarnBelow"
                        ? agentOutputQualityGateConfigPaths.structuralWarnBelow
                        : agentOutputQualityGateConfigPaths.semanticWarnBelow;

                return (
                  <Fragment key={slot.label}>
                    <dt className="m-0 pt-2 text-neutral-500 first:pt-0 dark:text-neutral-400">
                      <span className="font-medium text-neutral-800 dark:text-neutral-100">{slot.label}</span>
                      <span className={cn("mt-0.5 block break-all leading-snug text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
                        {pathLabel}
                      </span>
                    </dt>
                    <dd className="m-0 pt-2 text-neutral-900 first:pt-0 dark:text-neutral-100">{value}</dd>
                  </Fragment>
                );
              })}
            </dl>
            {state.diagnosticsNote ? (
              <p className={cn("m-0 text-amber-900 dark:text-amber-100", OPERATOR_TYPOGRAPHY.helper)} data-testid="quality-gate-diagnostics-note">
                {state.diagnosticsNote}
              </p>
            ) : null}
            {state.diagnostics ? (
              <dl
                className={cn("m-0 grid grid-cols-[minmax(0,220px)_1fr] gap-x-3 gap-y-2 rounded-md border border-neutral-200 p-3 font-mono dark:border-neutral-700", OPERATOR_TYPOGRAPHY.micro)}
                data-testid="quality-gate-diagnostics-panel"
              >
                <dt className="m-0 text-neutral-500">StructuralRejectBelow</dt>
                <dd className="m-0 text-neutral-900 dark:text-neutral-100">{state.diagnostics.structuralRejectBelow}</dd>
                <dt className="m-0 pt-2 text-neutral-500">SemanticRejectBelow</dt>
                <dd className="m-0 pt-2 text-neutral-900 dark:text-neutral-100">{state.diagnostics.semanticRejectBelow}</dd>
                <dt className="m-0 pt-2 text-neutral-500">
                  Strict quality — min structural completeness
                </dt>
                <dd className="m-0 pt-2 text-neutral-900 dark:text-neutral-100">
                  {state.diagnostics.pilotStrictMinStructuralCompleteness}
                </dd>
                <dt className="m-0 pt-2 text-neutral-500">
                  Strict quality — min semantic score
                </dt>
                <dd className="m-0 pt-2 text-neutral-900 dark:text-neutral-100">
                  {state.diagnostics.pilotStrictMinSemanticScore}
                </dd>
                <dt className="m-0 pt-2 text-neutral-500">
                  Strict quality — min evidence refs
                </dt>
                <dd className="m-0 pt-2 text-neutral-900 dark:text-neutral-100">
                  {state.diagnostics.pilotStrictMinEvidenceRefCount}
                </dd>
              </dl>
            ) : null}
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
