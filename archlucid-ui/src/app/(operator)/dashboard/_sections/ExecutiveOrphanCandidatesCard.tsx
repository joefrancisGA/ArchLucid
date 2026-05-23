"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ApiV1Routes } from "@/lib/api-v1-routes";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import { getRunDetail, fetchArtifactContentUtf8 } from "@/lib/api";
import { heuristicAnnualUsdOpportunityFromOrphanCandidatesJson } from "@/lib/run-potential-savings-parser";
import type { ExecutiveRoiSummary } from "./ExecutiveRoiSummarySection";

function formatUsd(value: number): string {
  if (!Number.isFinite(value)) {
    return "—";
  }

  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ExecutiveOrphanCandidatesCard() {
  const [data, setData] = useState<{ count: number; savings: number } | null>(null);
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

        if (cancelled) return;

        // Find the latest committed run
        const latestSystem = json.systems
          .filter((s) => s.committedUtc !== null)
          .sort((a, b) => new Date(b.committedUtc!).getTime() - new Date(a.committedUtc!).getTime())[0];

        if (!latestSystem) {
          setData({ count: 0, savings: 0 });
          return;
        }

        const runDetail = await getRunDetail(latestSystem.runId);
        if (cancelled) return;

        const manifestId = runDetail.data?.goldenManifestId;
        if (!manifestId) {
          setData({ count: 0, savings: 0 });
          return;
        }

        try {
          const artifact = await fetchArtifactContentUtf8(manifestId, "orphan-candidates");
          if (cancelled) return;

          const parsed = JSON.parse(artifact.text);
          const list = Array.isArray(parsed) ? parsed : (parsed as any).candidates ?? [];
          const count = list.length;
          const savings = heuristicAnnualUsdOpportunityFromOrphanCandidatesJson(parsed);

          setData({ count, savings });
        } catch (e) {
          // Artifact might not exist
          if (!cancelled) {
            setData({ count: 0, savings: 0 });
          }
        }
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
            From latest committed review
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
            From latest committed review
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
          From latest committed review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="font-mono text-4xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
          {data.count}
        </p>
        {data.count > 0 && (
          <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-400">
            Estimated savings: {formatUsd(data.savings)}/yr
          </p>
        )}
      </CardContent>
    </Card>
  );
}
