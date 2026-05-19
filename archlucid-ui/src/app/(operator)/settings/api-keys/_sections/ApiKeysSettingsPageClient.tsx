"use client";

import { useCallback, useEffect, useState } from "react";

import type { components } from "@/lib/api-types.generated";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type AdminApiKeySettingsResponse = components["schemas"]["AdminApiKeySettingsResponse"];
type AdminApiKeyRotateResponse = components["schemas"]["AdminApiKeyRotateResponse"];
type ApiKeySlotStatusDto = components["schemas"]["ApiKeySlotStatusDto"];

const settingsPath = "/api/proxy/v1/admin/settings/api-keys";

type LoadState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; settings: AdminApiKeySettingsResponse }
  | { status: "blocked"; note: string };

type RotateReveal = {
  response: AdminApiKeyRotateResponse;
};

function ApiKeySlotPanel(props: { label: string; slot: ApiKeySlotStatusDto | undefined }) {
  const segments = props.slot?.maskedSegments ?? [];

  return (
    <>
      <p className="m-0 font-medium text-neutral-900 dark:text-neutral-100">{props.label}</p>
      {segments.length === 0 ? (
        <p className="m-0 text-sm text-neutral-500">Not configured</p>
      ) : (
        <ul className="m-0 list-inside list-disc font-mono text-xs text-neutral-800 dark:text-neutral-200">
          {segments.map((segment) => (
            <li key={segment}>{segment}</li>
          ))}
        </ul>
      )}
      {props.slot?.expiresAtUtc ? (
        <p className="m-0 text-xs text-neutral-500">Expires (UTC): {props.slot.expiresAtUtc}</p>
      ) : null}
    </>
  );
}

export function ApiKeysSettingsPageClient() {
  const [state, setState] = useState<LoadState>({ status: "idle" });
  const [rotateReveal, setRotateReveal] = useState<RotateReveal | null>(null);
  const [rotating, setRotating] = useState(false);

  const load = useCallback(async () => {
    setState({ status: "loading" });

    try {
      const res = await fetch(
        settingsPath,
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!res.ok) {
        setState({
          status: "blocked",
          note:
            res.status === 401 || res.status === 403
              ? "Admin session required for API key management (`AdminAuthority`)."
              : `API key settings unavailable (HTTP ${res.status}).`,
        });

        return;
      }

      const settings = (await res.json()) as AdminApiKeySettingsResponse;
      setState({ status: "ready", settings });
    } catch (e: unknown) {
      setState({ status: "blocked", note: e instanceof Error ? e.message : String(e) });
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const rotate = useCallback(async (slot: "Admin" | "ReadOnly", invalidatePrevious: boolean) => {
    setRotating(true);
    setRotateReveal(null);

    try {
      const res = await fetch(`${settingsPath}/rotate`, {
        ...mergeRegistrationScopeForProxy({
          method: "POST",
          headers: { Accept: "application/json", "Content-Type": "application/json" },
        }),
        body: JSON.stringify({ slot, invalidatePrevious }),
      });

      if (!res.ok) {
        setState({
          status: "blocked",
          note: `Rotation failed (HTTP ${res.status}).`,
        });

        return;
      }

      const response = (await res.json()) as AdminApiKeyRotateResponse;
      setRotateReveal({ response });
    } catch (e: unknown) {
      setState({ status: "blocked", note: e instanceof Error ? e.message : String(e) });
    } finally {
      setRotating(false);
    }
  }, []);

  return (
    <div className="mx-auto max-w-3xl space-y-6" data-testid="api-keys-settings-page">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">API keys</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Host authentication keys under <span className="font-mono text-xs">Authentication:ApiKey</span>. This UI never
          stores raw keys — copy new material once and update Key Vault or app settings. For zero-downtime overlap, append
          the suffix to your existing config value (comma-separated segments).
        </p>
      </header>

      {state.status === "loading" ? <p className="text-sm text-neutral-500">Loading API key status…</p> : null}
      {state.status === "blocked" ? (
        <p className="text-sm text-rose-800 dark:text-rose-200" role="alert">
          {state.note}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Current status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <dl className="m-0 grid grid-cols-[minmax(0,200px)_1fr] gap-2">
              <dt className="text-neutral-500">Authentication:ApiKey:Enabled</dt>
              <dd className="font-mono text-neutral-900 dark:text-neutral-100">{String(state.settings.enabled)}</dd>
              <dt className="text-neutral-500">DevelopmentBypassAll</dt>
              <dd className="font-mono text-neutral-900 dark:text-neutral-100">
                {String(state.settings.developmentBypassAll)}
              </dd>
            </dl>

            {state.settings.developmentBypassAll ? (
              <p className="m-0 text-amber-900 dark:text-amber-100" role="status">
                Development bypass is enabled on this host — do not use in production.
              </p>
            ) : null}

            <div className="space-y-3">
              <section className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                <ApiKeySlotPanel label="Admin key" slot={state.settings.admin} />
              </section>
              <section className="space-y-2 rounded-md border border-neutral-200 p-3 dark:border-neutral-700">
                <ApiKeySlotPanel label="Read-only key" slot={state.settings.readOnly} />
              </section>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <Button type="button" size="sm" disabled={rotating} onClick={() => void rotate("Admin", true)}>
                Rotate admin key (replace)
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={rotating}
                onClick={() => void rotate("Admin", false)}
              >
                Issue admin overlap key
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={rotating}
                onClick={() => void rotate("ReadOnly", true)}
              >
                Rotate read-only key
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {rotateReveal ? (
        <Card data-testid="api-key-rotate-reveal">
          <CardHeader>
            <CardTitle className="text-base">Copy new key material</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="m-0 text-rose-900 dark:text-rose-100" role="alert">
              Shown once. It will not appear again after you dismiss this panel.
            </p>
            <p className="m-0">
              Config path:{" "}
              <span className="font-mono text-xs">{rotateReveal.response.configPath ?? "—"}</span>
            </p>
            <label className="block space-y-1">
              <span className="text-neutral-600 dark:text-neutral-400">New key</span>
              <textarea
                className="w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono text-xs dark:border-neutral-600 dark:bg-neutral-900"
                readOnly
                rows={2}
                value={rotateReveal.response.plaintextKey ?? ""}
                data-testid="api-key-plaintext"
              />
            </label>
            {rotateReveal.response.deploymentAction === "Replace" ? (
              <label className="block space-y-1">
                <span className="text-neutral-600 dark:text-neutral-400">Set config value to</span>
                <textarea
                  className="w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono text-xs dark:border-neutral-600 dark:bg-neutral-900"
                  readOnly
                  rows={2}
                  value={rotateReveal.response.replaceConfigValue ?? ""}
                />
              </label>
            ) : (
              <label className="block space-y-1">
                <span className="text-neutral-600 dark:text-neutral-400">Append to existing config value</span>
                <textarea
                  className="w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono text-xs dark:border-neutral-600 dark:bg-neutral-900"
                  readOnly
                  rows={1}
                  value={rotateReveal.response.appendConfigSuffix ?? ""}
                />
              </label>
            )}
            <Button type="button" size="sm" variant="secondary" onClick={() => setRotateReveal(null)}>
              Dismiss
            </Button>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

