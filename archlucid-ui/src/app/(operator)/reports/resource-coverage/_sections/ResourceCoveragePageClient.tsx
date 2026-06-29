"use client";
import { cn } from "@/lib/utils";

import { useCallback, useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
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
    <div className="w-full max-w-[1200px] space-y-6" data-testid="resource-coverage-page">
      <header>
        <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Resource type coverage</h1>
        <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
          Breakdown of Azure provider types in the latest uploaded extractor ZIP for this workspace.
        </p>
      </header>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Ingested resource types</CardTitle>
          <CardDescription>Data from GET /v1/reports/resource-coverage.</CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className={cn("m-0 text-red-600", OPERATOR_TYPOGRAPHY.body)}>{error}</p> : null}
          {!error && rows.length === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              Upload an Azure extractor ZIP to populate coverage metrics.
            </p>
          ) : null}
          {!error && rows.length > 0 ? (
            <div className="overflow-x-auto">
              <table className={cn("min-w-full text-left", OPERATOR_TYPOGRAPHY.body)}>
                <thead>
                  <tr className={cn("border-b border-neutral-200 dark:border-neutral-700", OPERATOR_NAV_GROUP_LABEL)}>
                    <th className="py-2 pr-3">Resource type</th>
                    <th className="py-2">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.resourceType} className="border-b border-neutral-100 dark:border-neutral-800">
                      <td className={cn("py-2 pr-3 font-mono text-al-text-primary", OPERATOR_TYPOGRAPHY.micro)}>
                        {row.resourceType}
                      </td>
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
