"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SamlOperationalHealthStrip } from "./SamlOperationalHealthStrip";
import type { UseIdentityProvidersSettingsPageModel } from "./use-identity-providers-settings-page";

type IdentityProvidersSettingsPageViewProps = {
  model: UseIdentityProvidersSettingsPageModel;
};

export function IdentityProvidersSettingsPageView({ model }: IdentityProvidersSettingsPageViewProps) {
  const { note, rows, samlOperationalHealth, samlOperationalHealthNote, samlOperationalHealthLoaded } = model;

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

      {samlOperationalHealthLoaded ? (
        <SamlOperationalHealthStrip payload={samlOperationalHealth} fetchNote={samlOperationalHealthNote} />
      ) : null}
    </div>
  );
}
