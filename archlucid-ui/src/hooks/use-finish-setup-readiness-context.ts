"use client";

import { useEffect, useState } from "react";

import { useOperatorNavAuthority } from "@/components/operator/OperatorNavAuthorityProvider";
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
  const { currentPrincipal, isAuthorityLoading } = useOperatorNavAuthority();
  const [healthPhase, setHealthPhase] = useState<"loading" | "ready">("loading");
  const [healthReady, setHealthReady] = useState(false);
  const [healthLoadFailed, setHealthLoadFailed] = useState(true);

  useEffect(() => {
    let canceled = false;

    void (async () => {
      setHealthPhase("loading");

      try {
        const health = await fetchHealthReadySummary();
        const ready = health !== null && health.status.toLowerCase().includes("healthy");

        if (!canceled) {
          setHealthReady(ready);
          setHealthLoadFailed(health === null);
          setHealthPhase("ready");
        }
      } catch {
        if (!canceled) {
          setHealthLoadFailed(true);
          setHealthPhase("ready");
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, []);

  const phase = isAuthorityLoading || healthPhase === "loading" ? "loading" : "ready";
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
