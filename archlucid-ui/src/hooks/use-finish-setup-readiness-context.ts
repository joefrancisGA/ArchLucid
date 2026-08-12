"use client";

import { useEffect, useState } from "react";

import { loadCurrentPrincipal } from "@/lib/current-principal";
import { fetchHealthReadySummary } from "@/lib/fetch-health-ready";
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
  const [phase, setPhase] = useState<"loading" | "ready">("loading");
  const [context, setContext] = useState<FinishSetupWizardContext | null>(null);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      const principal = await loadCurrentPrincipal();
      let healthReady = false;
      let healthLoadFailed = true;

      try {
        const health = await fetchHealthReadySummary();
        healthReady = health !== null && health.status.toLowerCase().includes("healthy");
        healthLoadFailed = health === null;
      } catch {
        healthLoadFailed = true;
      }

      if (!canceled) {
        setContext({
          healthReady,
          healthLoadFailed,
          principalAdmin: (principal?.authorityRank ?? 0) >= AUTHORITY_RANK.AdminAuthority,
        });
        setPhase("ready");
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  const resolvedContext = context ?? INITIAL_CONTEXT;
  const counts = countFinishSetupReadySteps(resolvedContext);

  return {
    phase,
    context: phase === "ready" ? resolvedContext : null,
    readyCount: counts.ready,
    totalCount: counts.total,
  };
}
