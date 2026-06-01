"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { ExecutiveRoiSummary } from "@/lib/executive-summary-markdown";

function formatUsd(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Server-authoritative orphan KPI tile (TB-103). */
export function ExecutiveOrphanCandidatesCard() {
  const [data, setData] = useState<{ count: number; savings: number | null } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const res = await fetch(
          `/api/proxy/${ApiV1Routes.roiExecutiveSummary}`,
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        );

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }

        const json = (await res.json()) as ExecutiveRoiSummary;

        if (cancelled) {
          return;
        }

        const orphans = json.orphanCandidates;

        setData({
          count: orphans?.candidateCount ?? 0,
          savings: orphans?.annualSavingsUsd ?? null,
        });
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load orphan candidates.");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Orphan Candidates
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            Server-classified from latest committed review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (data === null) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
            Orphan Candidates
          </CardTitle>
          <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
            Server-classified from latest committed review
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-neutral-500">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
          Orphan Candidates
        </CardTitle>
        <CardDescription className="text-xs text-neutral-500 dark:text-neutral-500">
          Server-classified from latest committed review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
          {data.count}
        </p>
        {data.count > 0 ? (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Estimated savings: {formatUsd(data.savings)}/yr
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
