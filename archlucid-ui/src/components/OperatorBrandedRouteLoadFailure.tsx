"use client";

import { OperatorBrandedNotFound } from "@/components/OperatorBrandedNotFound";
import { OperatorBrandedTransientFailure } from "@/components/OperatorBrandedTransientFailure";
import type { ApiLoadFailureState } from "@/lib/api-load-failure";
import { resolveApiLoadFailurePresentation } from "@/lib/api-load-failure";

export type OperatorBrandedRouteLoadFailureProps = {
  readonly failure: ApiLoadFailureState;
  readonly retryLabel?: string;
};

/** Branded recovery for route loads: missing resource (404) vs retryable outage (timeout/unavailable). */
export function OperatorBrandedRouteLoadFailure({
  failure,
  retryLabel,
}: OperatorBrandedRouteLoadFailureProps) {
  const presentation = resolveApiLoadFailurePresentation(failure);

  if (presentation === "transient") {
    return <OperatorBrandedTransientFailure failure={failure} retryLabel={retryLabel} />;
  }

  return <OperatorBrandedNotFound showProcessingHint retryLabel={retryLabel} />;
}
