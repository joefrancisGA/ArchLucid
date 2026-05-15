"use client";

import { X } from "lucide-react";
import * as React from "react";

import { Button } from "@/components/ui/button";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { components } from "@/lib/api-types.generated";

/** Session-dismiss key for deterministic agent execution simulator notice. */

const STORAGE_KEY = "archlucid.dismiss_agent_execution_simulator_banner_session_v1";

type AdminConfigSummaryResponse = components["schemas"]["AdminConfigSummaryResponse"];

async function fetchAgentExecutionModeEffective(): Promise<string | null> {
  const res = await fetch(
    "/api/proxy/v1/admin/config-summary?includeEffectiveValues=true",
    mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
  );

  if (!res.ok) {
    return null;
  }

  const body = (await res.json()) as AdminConfigSummaryResponse;
  const row = body.keys?.find((k) => k.configPath === "AgentExecution:Mode");

  if (row == null) {
    return null;
  }

  const raw = row.effectiveValue?.trim();

  if (raw != null && raw.length > 0) {
    return raw;
  }

  return row.isSet ? "(set)" : "Simulator";
}

export function SimulatorExecutionModeBanner() {
  const [dismissed, setDismissed] = React.useState(false);
  const [visibleMode, setVisibleMode] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(STORAGE_KEY) === "1") {
        setDismissed(true);
      }
    } catch {
      // sessionStorage can be unavailable in hardened profiles — keep banner usable after fetch instead.
      setDismissed(false);
    }
  }, []);

  React.useEffect(() => {
    if (dismissed) {
      return;
    }

    let canceled = false;

    void (async () => {
      try {
        const mode = await fetchAgentExecutionModeEffective();

        if (canceled || mode === null) {
          if (!canceled && mode === null) {
            setError(null);
            setVisibleMode(null);
          }

          return;
        }

        const norm = mode.trim();

        setError(null);
        setVisibleMode(norm.toLowerCase() === "simulator" ? norm : null);
      } catch (e: unknown) {
        if (!canceled) {
          setError(e instanceof Error ? e.message : String(e));
          setVisibleMode(null);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [dismissed]);

  function onDismiss(): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore persistence failure — transient dismiss via state still hides for this SPA session.
      void 0;
    }

    setDismissed(true);
  }

  // Non-simulator path: silently hide unless admin diagnostics failed conspicuously — keep UX quiet.

  if (dismissed) {
    return null;
  }

  if (error !== null || visibleMode === null) {
    return null;
  }

  return (
    <aside
      className="mb-4 flex items-start gap-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2.5 text-amber-950 shadow-sm print:hidden dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-100"
      aria-live="polite"
      data-testid="simulator-execution-banner"
      role="status"
    >
      <div className="flex-1 text-sm leading-relaxed">
        <strong className="font-semibold">Running in Simulator Mode</strong>
        {" "}
        <span className="font-mono text-xs opacity-95">({visibleMode})</span> — Agent outputs are deterministic mocks, not hosted model
        responses. Toggle <span className="font-mono text-xs">AgentExecution:Mode</span> on the API host to enable{" "}
        <span className="font-semibold">Real</span> execution paths.
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="shrink-0 text-amber-900 hover:bg-amber-200/80 dark:text-amber-100 dark:hover:bg-amber-900/60"
        aria-label="Dismiss simulator notice for this browser session"
        onClick={() => {
          onDismiss();
        }}
      >
        <X className="size-5" aria-hidden />
      </Button>
    </aside>
  );
}
