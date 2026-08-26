"use client";

import { cn } from "@/lib/utils";
import { useMemo } from "react";

import { OperatorApiProblem } from "@/components/operator/OperatorApiProblem";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useSponsorRoiEnvironmentSavingsQuery } from "@/hooks/use-sponsor-roi-environment-savings-query";
import { toApiLoadFailure } from "@/lib/api-load-failure";
import { OPERATOR_KPI_CARD_DESCRIPTION, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import {
  BUYER_SPONSOR_DATA_SOURCE_NOTE,
  BUYER_SPONSOR_ENVIRONMENT_SAVINGS_DESCRIPTION,
} from "@/lib/buyer/buyer-polish-copy";

const SLICE_COLORS = ["#059669", "#2563eb", "#d97706", "#7c3aed", "#dc2626", "#64748b"];

/** Pie-style breakdown of estimated savings by environment tag. */
export function SponsorRoiEnvironmentSavingsSection() {
  const savingsQuery = useSponsorRoiEnvironmentSavingsQuery();
  const slices = useMemo(() => savingsQuery.data ?? [], [savingsQuery.data]);
  const loading = savingsQuery.isPending;
  const failure = savingsQuery.isError ? toApiLoadFailure(savingsQuery.error) : null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className={OPERATOR_TYPOGRAPHY.cardTitle}>Savings by environment</CardTitle>
        <CardDescription className={OPERATOR_KPI_CARD_DESCRIPTION}>
          {`${BUYER_SPONSOR_ENVIRONMENT_SAVINGS_DESCRIPTION} ${BUYER_SPONSOR_DATA_SOURCE_NOTE}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>Loading environment breakdown…</p>
        ) : null}
        {!loading && failure !== null ? (
          <div className="space-y-3" data-testid="exec-roi-environment-load-failed" role="alert">
            <OperatorApiProblem failure={failure} />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                void savingsQuery.refetch();
              }}
              data-testid="exec-roi-environment-retry"
            >
              Retry load
            </Button>
          </div>
        ) : null}
        {!loading && failure === null && slices.length === 0 ? (
          <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>No tagged environment savings yet.</p>
        ) : null}
        {!loading && failure === null && slices.length > 0 ? (
          <div className="space-y-3" data-testid="exec-roi-environment-pie">
            <div className="flex h-4 overflow-hidden rounded-full" aria-hidden="true">
              {slices.map((slice, index) => (
                <div
                  key={slice.environment}
                  style={{
                    flex: `${Math.max(Number(slice.estimatedUsdSavings) || 0, 1)} 1 0%`,
                    backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length],
                  }}
                />
              ))}
            </div>
            <ul className={cn("m-0 space-y-1 p-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.body)}>
              {slices.map((slice, index) => (
                <li key={slice.environment} className="flex items-center justify-between gap-3">
                  <span className="inline-flex items-center gap-2">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: SLICE_COLORS[index % SLICE_COLORS.length] }}
                    />
                    {slice.environment}
                  </span>
                  <span className="font-mono tabular-nums">${Math.round(Number(slice.estimatedUsdSavings) || 0).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
