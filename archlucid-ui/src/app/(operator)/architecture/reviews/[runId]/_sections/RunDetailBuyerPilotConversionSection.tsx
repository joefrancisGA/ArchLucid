"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchLlmMonthlyDollarBudgetStatusCached, type LlmMonthlyDollarBudgetStatus } from "@/lib/llm-monthly-budget-status";
import { mergeRegistrationScopeForProxy } from "@/lib/proxy-fetch-registration-scope";
import type { TenantTrialStatusPayload } from "@/types/tenant-trial-status";

import { PilotConversionCta } from "./PilotConversionCta";

type RunDetailBuyerPilotConversionSectionProps = {
  readonly buyerPolishedArtifactTable: boolean;
};

/**
 * Buyer-shell-only section that surfaces a conversion CTA when trial execution is blocked by LLM budget limits.
 */
export function RunDetailBuyerPilotConversionSection(props: RunDetailBuyerPilotConversionSectionProps) {
  const { buyerPolishedArtifactTable } = props;
  const [budgetStatus, setBudgetStatus] = useState<LlmMonthlyDollarBudgetStatus | null>(null);
  const [trialStatus, setTrialStatus] = useState<"unknown" | "active" | "inactive">("unknown");

  useEffect(() => {
    if (!buyerPolishedArtifactTable) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const status = await fetchLlmMonthlyDollarBudgetStatusCached({ force: true });

        if (!cancelled) {
          setBudgetStatus(status);
        }
      } catch {
        if (!cancelled) {
          setBudgetStatus(null);
        }
      }
    })();

    void (async () => {
      try {
        const payload = await fetch(
          "/api/proxy/v1/tenant/trial-status",
          mergeRegistrationScopeForProxy({ headers: { Accept: "application/json" } }),
        ).then(async (res) => {
          if (!res.ok) {
            return null;
          }

          return (await res.json()) as TenantTrialStatusPayload;
        });

        if (cancelled) {
          return;
        }

        const nextStatus = payload?.status;

        if (nextStatus === "Active" || nextStatus === "ReadOnly" || nextStatus === "ExportOnly") {
          setTrialStatus("active");

          return;
        }

        if (typeof nextStatus === "string") {
          setTrialStatus("inactive");
        }
      } catch {
        if (!cancelled) {
          setTrialStatus("unknown");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [buyerPolishedArtifactTable]);

  const blocksAdditionalLlmExecution = useMemo(() => {
    return budgetStatus?.blocksAdditionalLlmExecution === true;
  }, [budgetStatus]);

  if (!buyerPolishedArtifactTable) {
    return null;
  }

  return <PilotConversionCta trialActive={trialStatus === "active"} blocksAdditionalLlmExecution={blocksAdditionalLlmExecution} />;
}
