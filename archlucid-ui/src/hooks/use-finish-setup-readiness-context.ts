"use client";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
import { useHealthReadySummaryQuery } from "@/hooks/use-health-ready-summary-query";
import {
  countFinishSetupReadySteps,
  type FinishSetupWizardContext,
} from "@/lib/finish-setup-wizard-steps";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

export type FinishSetupReadinessSummary = {
  readonly phase: "loading" | "ready";
  readonly context: FinishSetupWizardContext | null;
  readonly readyCount: number;
  readonly totalCount: number;
};

const INITIAL_CONTEXT: FinishSetupWizardContext = {
  healthReady: false,
  healthLoadFailed: true,
  principalAdmin: false,
};

/** Loads health + principal signals used by finish-setup readiness and operator-home metrics. */
export function useFinishSetupReadinessContext(): FinishSetupReadinessSummary {
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const { data: health, isPending: healthPending } = useHealthReadySummaryQuery();

  const healthReady = health !== null && health !== undefined && health.status.toLowerCase().includes("healthy");
  const healthLoadFailed = !healthPending && health === null;
  const phase = isAuthorityLoading || healthPending ? "loading" : "ready";
  const context: FinishSetupWizardContext =
    phase === "ready"
      ? {
          healthReady,
          healthLoadFailed,
          principalAdmin: currentPrincipal.authorityRank >= AUTHORITY_RANK.AdminAuthority,
        }
      : INITIAL_CONTEXT;
  const counts = countFinishSetupReadySteps(context);

  return {
    phase,
    context: phase === "ready" ? context : null,
    readyCount: counts.ready,
    totalCount: counts.total,
  };
}
