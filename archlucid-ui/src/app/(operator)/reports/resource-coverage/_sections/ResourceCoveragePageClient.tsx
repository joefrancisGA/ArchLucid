"use client";

import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type ResourceCoverageRow = {
  resourceType: string;
  count: number;
};

/** Table of Azure resource types from the latest scoped extractor ZIP. */
export function ResourceCoveragePageClient() {
  const [rows, setRows] = useState<ResourceCoverageRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch(
        "/api/proxy/v1/reports/resource-coverage",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!response.ok) {
        setError(`Resource coverage unavailable (HTTP ${response.status}).`);

        return;
      }

      const json = (await response.json()) as { rows?: ResourceCoverageRow[] };
      setRows(json.rows ?? []);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="mx-auto max-w-5xl space-y-6" data-testid="resource-coverage-page">
      <header>
        <h1 className="text-xl font-semibold text-neutral-900 dark:text-neutral-50">Resource type coverage</h1>
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
          Breakdown of Azure provider types in the latest uploaded extractor ZIP for this workspace.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ingested resource types</CardTitle>
          <CardDescription>Data from GET /v1/reports/resource-coverage.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className="m-0 text-sm text-red-600">{error}</p> : null}
          {!error && rows.length === 0 ? (
            <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">
              Upload an Azure extractor ZIP to populate coverage metrics.
            </p>
          ) : null}
          {!error && rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 dark:border-neutral-700">
                    <th className="py-2 pr-3 font-medium">Resource type</th>
                    <th className="py-2 font-medium">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.resourceType} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className="py-2 pr-3 font-mono text-xs">{row.resourceType}</td>
                      <td className="py-2 tabular-nums">{row.count}</td>
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
