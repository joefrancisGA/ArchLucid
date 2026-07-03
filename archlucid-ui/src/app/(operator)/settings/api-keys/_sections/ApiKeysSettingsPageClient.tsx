"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useState } from "react";

import type { components } from "@/lib/api-types.generated";
import { Button } from "@/components/ui/button";
import { DismissControl } from "@/components/usability/DismissControl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
      <p className={cn("m-0 font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>{props.label}</p>
      {segments.length === 0 ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Not configured</p>
      ) : (
        <ul
          className={cn(
            "m-0 list-inside list-disc font-mono text-al-text-primary",
            OPERATOR_TYPOGRAPHY.micro,
          )}
        >
          {segments.map((segment) => (
            <li key={segment}>{segment}</li>
          ))}
        </ul>
      )}
      {props.slot?.expiresAtUtc ? (
        <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.micro)}>
          Expires (UTC): {props.slot.expiresAtUtc}
        </p>
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
    <div className="w-full max-w-3xl space-y-6" data-testid="api-keys-settings-page">
      <header>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>API keys</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Host authentication keys under{" "}
          <span className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
            Authentication:ApiKey
          </span>
          . This UI never stores raw keys — copy new material once and update Key Vault or app settings. For
          zero-downtime overlap, append the suffix to your existing config value (comma-separated segments).
        </p>
      </header>

      {state.status === "loading" ? (
        <p className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading API key status…</p>
      ) : null}
      {state.status === "blocked" ? (
        <p className={cn(OPERATOR_TYPOGRAPHY.body, "text-rose-800 dark:text-rose-200")} role="alert">
          {state.note}
        </p>
      ) : null}

      {state.status === "ready" ? (
        <Card>
          <CardHeader>
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Current status</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-4", OPERATOR_TYPOGRAPHY.body)}>
            <dl className="m-0 grid grid-cols-[minmax(0,200px)_1fr] gap-2">
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
                Authentication:ApiKey:Enabled
              </dt>
              <dd className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {String(state.settings.enabled)}
              </dd>
              <dt className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>DevelopmentBypassAll</dt>
              <dd className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.body)}>
                {String(state.settings.developmentBypassAll)}
              </dd>
            </dl>

            {state.settings.developmentBypassAll ? (
              <p className={cn("m-0", OPERATOR_TYPOGRAPHY.body, "text-amber-900 dark:text-amber-100")} role="status">
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
            <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Copy new key material</CardTitle>
          </CardHeader>
          <CardContent className={cn("space-y-3", OPERATOR_TYPOGRAPHY.body)}>
            <p className={cn("m-0 text-rose-900 dark:text-rose-100", OPERATOR_TYPOGRAPHY.body)} role="alert">
              Shown once. It will not appear again after you dismiss this panel.
            </p>
            <p className="m-0">
              Config path:{" "}
              <span className={cn("font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                {rotateReveal.response.configPath ?? "—"}
              </span>
            </p>
            <label className="block space-y-1">
              <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>New key</span>
              <textarea
                className={cn(
                  "w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono dark:border-neutral-600 dark:bg-neutral-900",
                  OPERATOR_TYPOGRAPHY.micro,
                )}
                readOnly
                rows={2}
                value={rotateReveal.response.plaintextKey ?? ""}
                data-testid="api-key-plaintext"
              />
            </label>
            {rotateReveal.response.deploymentAction === "Replace" ? (
              <label className="block space-y-1">
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>Set config value to</span>
                <textarea
                  className={cn(
                    "w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono dark:border-neutral-600 dark:bg-neutral-900",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                  readOnly
                  rows={2}
                  value={rotateReveal.response.replaceConfigValue ?? ""}
                />
              </label>
            ) : (
              <label className="block space-y-1">
                <span className={cn("text-al-text-secondary", OPERATOR_TYPOGRAPHY.label)}>
                  Append to existing config value
                </span>
                <textarea
                  className={cn(
                    "w-full rounded-md border border-neutral-300 bg-neutral-50 p-2 font-mono dark:border-neutral-600 dark:bg-neutral-900",
                    OPERATOR_TYPOGRAPHY.micro,
                  )}
                  readOnly
                  rows={1}
                  value={rotateReveal.response.appendConfigSuffix ?? ""}
                />
              </label>
            )}
            <DismissControl onDismiss={() => setRotateReveal(null)} />
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
