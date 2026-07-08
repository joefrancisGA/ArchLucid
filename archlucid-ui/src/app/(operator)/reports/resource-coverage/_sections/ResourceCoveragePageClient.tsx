"use client";

import { cn } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";

import { CollapsibleSection } from "@/components/CollapsibleSection";
import { HealthRefreshToolbar } from "@/components/health-dashboard/HealthDashboardSections";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { OPERATOR_NAV_GROUP_LABEL, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { CLOUD_NEUTRAL_PRIMARY_COPY } from "@/lib/cloud-neutral-primary-copy";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type ResourceCoverageRow = {
  resourceType: string;
  count: number;
};

/** Table of resource provider types from the latest scoped cloud inventory ZIP. */
export function ResourceCoveragePageClient() {
  const [rows, setRows] = useState<ResourceCoverageRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(null);
  const loadInFlightRef = useRef(false);
  const showTechnicalDetails = isShowSystemAdministrationNavEnabled();

  const load = useCallback(async () => {
    if (loadInFlightRef.current) {
      return;
    }

    loadInFlightRef.current = true;
    setLoading(true);

    try {
      const response = await fetch(
        "/api/proxy/v1/reports/resource-coverage",
        mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" }, cache: "no-store" }),
      );

      if (!response.ok) {
        setError("Resource coverage is temporarily unavailable. Try refreshing.");

        return;
      }

      const json = (await response.json()) as { rows?: ResourceCoverageRow[] };
      setRows(json.rows ?? []);
      setError(null);
      setLastRefreshedAt(new Date());
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not load resource coverage. Try again.");
    } finally {
      loadInFlightRef.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="w-full max-w-[1200px] space-y-6" data-testid="resource-coverage-page">
      <header className="space-y-3">
        <div>
          <h1 className={OPERATOR_TYPOGRAPHY.pageTitle}>Resource type coverage</h1>
          <p className={cn("mt-1 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
            Breakdown of resource provider types in the latest uploaded cloud inventory ZIP for this workspace.
          </p>
        </div>
        <HealthRefreshToolbar
          loading={loading}
          lastRefreshedAt={lastRefreshedAt}
          onRefresh={load}
          refreshTestId="resource-coverage-refresh"
        />
      </header>

      <Card>
        <CardHeader>
          <CardTitle className={OPERATOR_TYPOGRAPHY.sectionTitle}>Ingested resource types</CardTitle>
          <CardDescription>
            Counts from the latest cloud inventory upload for this workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? <p className={cn("m-0 text-red-600", OPERATOR_TYPOGRAPHY.body)}>{error}</p> : null}
          {!error && !loading && rows.length === 0 ? (
            <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {CLOUD_NEUTRAL_PRIMARY_COPY.resourceCoverageEmptyHint}
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

      {showTechnicalDetails ? (
        <CollapsibleSection title="Technical details" sectionTestId="resource-coverage-technical-details">
          <dl className={cn("m-0 space-y-2 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
            <div>
              <dt className={cn("text-al-text-primary", OPERATOR_TYPOGRAPHY.cardTitle)}>Diagnostics source</dt>
              <dd className={cn("m-0 font-mono", OPERATOR_TYPOGRAPHY.micro)}>GET /v1/reports/resource-coverage</dd>
            </div>
          </dl>
        </CollapsibleSection>
      ) : null}
    </div>
  );
}
