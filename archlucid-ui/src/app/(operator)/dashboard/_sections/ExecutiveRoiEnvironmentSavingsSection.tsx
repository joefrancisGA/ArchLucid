"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";

type EnvironmentSlice = {
  environment: string;
  estimatedUsdSavings: number;
};

const SLICE_COLORS = ["#059669", "#2563eb", "#d97706", "#7c3aed", "#dc2626", "#64748b"];

/** Pie-style breakdown of estimated savings by environment tag. */
export function ExecutiveRoiEnvironmentSavingsSection() {
  const [slices, setSlices] = useState<EnvironmentSlice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetch(
          `/api/proxy/${ApiV1Routes.roiExecutiveSummary}/export`,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!response.ok) {
          return;
        }

        const json = (await response.json()) as { savingsByEnvironment?: EnvironmentSlice[] };

        if (!cancelled) {
          setSlices(json.savingsByEnvironment ?? []);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const total = slices.reduce((sum, slice) => sum + slice.estimatedUsdSavings, 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Savings by environment</CardTitle>
        <CardDescription className="text-xs">
          Aggregated from deduplicated findings via <span className="font-mono">GET /v1/roi/executive-summary/export</span>.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? <p className="m-0 text-sm text-neutral-500">Loading environment breakdown…</p> : null}
        {!loading && slices.length === 0 ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400">No tagged environment savings yet.</p>
        ) : null}
        {!loading && slices.length > 0 ? (
          <div className="space-y-3" data-testid="exec-roi-environment-pie">
            <div className="flex h-4 overflow-hidden rounded-full">
              {slices.map((slice, index) => (
                <div
                  key={slice.environment}
                  style={{
                    width: `${Math.max(4, (slice.estimatedUsdSavings / Math.max(total, 1)) * 100)}%`,
                    backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
                  }}
                  title={`${slice.environment}: $${Math.round(slice.estimatedUsdSavings).toLocaleString()}`}
                />
              ))}
            </div>
            <ul className="m-0 space-y-1 p-0 text-sm">
              {slices.map((slice, index) => (
                <li key={slice.environment} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
                    />
                    {slice.environment}
                  </span>
                  <span className="font-mono tabular-nums">${Math.round(slice.estimatedUsdSavings).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
