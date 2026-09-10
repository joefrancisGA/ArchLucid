"use client";

import { useEffect, useMemo, useState } from "react";

import { useLlmMonthlyBudgetStatusQuery } from "@/hooks/use-llm-monthly-budget-status-query";
import { useProductionEvalChrome } from "@/hooks/useProductionDeskChrome";
import { useTenantTrialStatusQuery } from "@/hooks/use-tenant-trial-status-query";

import { PilotConversionCta } from "./PilotConversionCta";

type RunDetailBuyerPilotConversionSectionProps = {
  readonly buyerPolishedArtifactTable: boolean;
};

/**
 * Buyer-shell-only section that surfaces a conversion CTA when trial execution is blocked by LLM budget limits.
 */
export function RunDetailBuyerPilotConversionSection(_props: RunDetailBuyerPilotConversionSectionProps) {
  const evalChromeShell = useProductionEvalChrome();
  const { data: budgetStatus } = useLlmMonthlyBudgetStatusQuery({ enabled: evalChromeShell });
  const { data: trialPayload } = useTenantTrialStatusQuery({ enabled: evalChromeShell });
  const [trialStatus, setTrialStatus] = useState<"unknown" | "active" | "inactive">("unknown");

  useEffect(() => {
    if (!evalChromeShell) {
      return;
    }

    if (trialPayload === undefined) {
      return;
    }

    if (trialPayload === null) {
      setTrialStatus("unknown");

      return;
    }

    const nextStatus = trialPayload.status;

    if (nextStatus === "Active" || nextStatus === "ReadOnly" || nextStatus === "ExportOnly") {
      setTrialStatus("active");

      return;
    }

    if (typeof nextStatus === "string") {
      setTrialStatus("inactive");

      return;
    }

    setTrialStatus("unknown");
  }, [evalChromeShell, trialPayload]);

  const blocksAdditionalLlmExecution = useMemo(() => {
    return budgetStatus?.blocksAdditionalLlmExecution === true;
  }, [budgetStatus]);

  if (!evalChromeShell) {
    return null;
  }

  return <PilotConversionCta trialActive={trialStatus === "active"} blocksAdditionalLlmExecution={blocksAdditionalLlmExecution} />;
}
