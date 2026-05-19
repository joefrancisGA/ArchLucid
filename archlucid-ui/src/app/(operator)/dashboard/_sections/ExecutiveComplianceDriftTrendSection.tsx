"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { ComplianceDriftOpenResolvedChart } from "@/components/ComplianceDriftOpenResolvedChart";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getComplianceDriftTrend } from "@/lib/api";
import type { ComplianceDriftTrendPoint } from "@/types/governance-dashboard";

function rollingBounds30Days(): { fromUtc: string; toUtc: string } {
  const to = new Date();
  const from = new Date(to);

  from.setUTCDate(from.getUTCDate() - 30);

  return { fromUtc: from.toISOString(), toUtc: to.toISOString() };
}

/** Live compliance drift panel for the executive summary dashboard (`/dashboard`). */
export function ExecutiveComplianceDriftTrendSection() {
  const [loading, setLoading] = useState(true);
  const [points, setPoints] = useState<ComplianceDriftTrendPoint[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const window = rollingBounds30Days();

    void (async () => {
      try {
        const data = await getComplianceDriftTrend(window.fromUtc, window.toUtc, 1440);

        if (!cancelled) {
          setPoints(data);
        }
      } catch {
        if (!cancelled) {
          setError(true);
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

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Compliance drift (last 30 days)</CardTitle>
        <CardDescription className="text-xs">
          Daily trend of findings opened when reviews capture snapshots vs resolved through human review. Data from{" "}
          <span className="font-mono">GET /v1/governance/compliance-drift-trend</span>.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="m-0 text-sm text-neutral-500 dark:text-neutral-400" data-testid="exec-compliance-drift-loading">
            Loading compliance drift…
          </p>
        ) : null}
        {!loading && error ? (
          <p className="m-0 text-sm text-neutral-600 dark:text-neutral-400" role="alert">
            Compliance drift trend is unavailable right now.
          </p>
        ) : null}
        {!loading && !error ? <ComplianceDriftOpenResolvedChart points={points} /> : null}
        <p className="m-0 text-sm">
          <Link href="/governance/dashboard" className="font-medium text-blue-700 underline dark:text-blue-400">
            Open executive workspace health
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
