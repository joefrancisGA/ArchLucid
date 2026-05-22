"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getExecutiveSummary, type ExecutiveSummaryResult } from "@/lib/api/reports-api";
import { DollarSign, ShieldAlert, Activity } from "lucide-react";

export function BusinessImpactSummaryWidget() {
  const [data, setData] = useState<ExecutiveSummaryResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;
    getExecutiveSummary()
      .then((res) => {
        if (mounted) {
          setData(res);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err);
          setIsLoading(false);
        }
      });
    return () => {
      mounted = false;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">
        Failed to load business impact summary.
      </div>
    );
  }

  const costWaste = data?.costWasteUsd ?? 0;
  const securityRisk = data?.securityRiskCount ?? 0;
  const reliabilityGaps = data?.reliabilityGapCount ?? 0;

  return (
    <section aria-labelledby="business-impact-heading" className="space-y-4">
      <h2 id="business-impact-heading" className="text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
        Business Impact Summary
      </h2>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Cost Waste
            </CardTitle>
            <DollarSign className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-24 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                ${costWaste.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Security/Compliance Risk
            </CardTitle>
            <ShieldAlert className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {securityRisk}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-neutral-600 dark:text-neutral-400">
              Reliability Gaps
            </CardTitle>
            <Activity className="h-4 w-4 text-neutral-500" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="h-8 w-16 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
            ) : (
              <p className="font-mono text-3xl font-semibold tabular-nums text-neutral-900 dark:text-neutral-50">
                {reliabilityGaps}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
