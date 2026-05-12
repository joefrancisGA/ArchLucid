"use client";

import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { components } from "@/lib/api-types.generated";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type AdminConfigSummaryResponse = components["schemas"]["AdminConfigSummaryResponse"];
type ConfigSummaryKeyRow = components["schemas"]["ConfigSummaryKeyRow"];

/**
 * Read-only catalog slice for generic OIDC wiring — surfaces ArchLucidAuth:* keys with masked effective values.
 */
export default function IdentityProvidersSettingsPage() {
  const [rows, setRows] = useState<ConfigSummaryKeyRow[] | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const load = useCallback(async () => {
    setNote(null);

    try {
      const res = await fetch(
        "/api/proxy/v1/admin/configuration/summary?includeEffectiveValues=true",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!res.ok) {
        setRows(null);
        setNote(
          res.status === 401 || res.status === 403
            ? "This page requires an Admin session to read identity settings from the configuration catalog."
            : `Configuration summary unavailable (HTTP ${res.status}).`,
        );

        return;
      }

      const body = (await res.json()) as AdminConfigSummaryResponse;
      const keys: ConfigSummaryKeyRow[] = body.keys ?? [];
      const authRows = keys.filter((k) => (k.configPath ?? "").startsWith("ArchLucidAuth:"));

      setRows(authRows);
    } catch (e) {
      setRows(null);
      setNote(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Identity providers</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Read-only view of <strong className="font-medium text-neutral-800 dark:text-neutral-200">ArchLucidAuth</strong>{" "}
          catalog rows (authority, audience, mode). Effective values are masked server-side — configure secrets only in
          your hosting environment or Key Vault, not in this UI.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">OIDC catalog alignment</CardTitle>
        </CardHeader>
        <CardContent>
          {note !== null ? (
            <p className="m-0 text-sm text-amber-900 dark:text-amber-100" data-testid="identity-providers-note">
              {note}
            </p>
          ) : null}
          {rows !== null && rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" data-testid="identity-providers-table">
                <thead>
                  <tr className="border-b border-neutral-200 text-xs uppercase text-neutral-500 dark:border-neutral-700">
                    <th className="py-2 pr-3">Config path</th>
                    <th className="py-2 pr-3">Set</th>
                    <th className="py-2 pr-3">Effective value</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.configPath} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-3 font-mono text-xs text-neutral-900 dark:text-neutral-100">
                        {r.configPath}
                      </td>
                      <td className="py-2 pr-3 text-neutral-700 dark:text-neutral-300">{r.isSet ? "yes" : "no"}</td>
                      <td className="break-all py-2 pr-3 text-neutral-700 dark:text-neutral-300">
                        {r.effectiveValue ?? "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
