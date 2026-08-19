"use client";

import { useCorePilotCommitContextQuery } from "@/hooks/use-core-pilot-commit-context-query";
import type { ReactNode } from "react";

/**
 * Hides tertiary operator-home surfaces until at least one committed manifest exists for the tenant (trial-status
 * anchor or golden manifest on a run row). Used for value realization, CS next actions, stickiness, operational metrics,
 * and maturity-layer cards. The review-cycle before/after delta card (`BeforeAfterDeltaPanel`) lives outside this gate so
 * trial baselines stay visible even when commit-context resolution is still empty. Fails open on resolution errors so
 * transient API issues do not strip the dashboard for returning operators.
 */
export function OperationalMetricsGate({ children }: { children: ReactNode }) {
  const { data, isPending, isError } = useCorePilotCommitContextQuery();

  if (isPending) {
    return null;
  }

  const showOperateDiscovery = isError || data?.hasCommittedManifest === true;

  if (!showOperateDiscovery) {
    return null;
  }

  return <>{children}</>;
}
