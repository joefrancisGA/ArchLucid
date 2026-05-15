"use client";

import { Fragment, useCallback, useEffect, useState } from "react";

import type { components } from "@/lib/api-types.generated";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { agentOutputQualityGateConfigPaths, selectAgentOutputQualityGateRows } from "@/lib/quality-gate-config-summary";

type AdminConfigSummaryResponse = components["schemas"]["AdminConfigSummaryResponse"];

export function TenantQualityGatesCard() {
  type LoadState =
    | { status: "idle" }
    | { status: "loading" }
    | { status: "ready"; rows: ReturnType<typeof selectAgentOutputQualityGateRows> }
    | { status: "blocked"; note: string };

  const [state, setState] = useState<LoadState>({ status: "idle" });

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const res = await fetch(
        "/api/proxy/v1/admin/config-summary?includeEffectiveValues=true",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!res.ok) {
        setState({
          status: "blocked",
          note:
            res.status === 401 || res.status === 403
              ? "Admin session required to read the configuration catalog (`GET /v1/admin/config-summary`)."
              : `Quality gate thresholds unavailable (HTTP ${res.status}).`,
        });

        return;
      }

      const body = (await res.json()) as AdminConfigSummaryResponse;
      setState({
        status: "ready",
        rows: selectAgentOutputQualityGateRows(body.keys ?? []),
      });
    } catch (e: unknown) {
      setState({ status: "blocked", note: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Card data-testid="tenant-quality-gates-card">
      <CardHeader>
        <CardTitle className="text-base">Quality gates (read-only)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-neutral-600 dark:text-neutral-300">
        <p className="m-0">
          Effective host values for agent output thresholds from{" "}
          <span className="font-mono text-xs text-neutral-800 dark:text-neutral-200">{agentOutputQualityGateConfigPaths.mode}</span> /
          warn floors (catalog-aligned with <span className="font-mono text-xs">GET /v1/admin/config-summary</span>). UI does not change
          these settings — adjust configuration on the API host only.
        </p>

        {state.status === "loading" ? <p className="m-0 text-neutral-500">Loading configuration summary…</p> : null}
        {state.status === "blocked" ? (
          <p className="m-0 text-rose-800 dark:text-rose-200" role="alert">
            {state.note}
          </p>
        ) : null}
        {state.status === "ready" ? (
          <dl className="m-0 grid grid-cols-[minmax(0,220px)_1fr] gap-x-3 gap-y-2 rounded-md border border-neutral-200 p-3 font-mono text-xs dark:border-neutral-700">
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
                    <span className="mt-0.5 block break-all text-[10px] leading-snug text-neutral-500 dark:text-neutral-500">
                      {pathLabel}
                    </span>
                  </dt>
                  <dd className="m-0 pt-2 text-neutral-900 first:pt-0 dark:text-neutral-100">{value}</dd>
                </Fragment>
              );
            })}
          </dl>
        ) : null}
      </CardContent>
    </Card>
  );
}
