"use client";

import { OperatorOfflineReconnectBanner } from "@/components/operator/OperatorOfflineReconnectBanner";
import { ScopeChangeConsequenceBanner } from "@/components/ScopeChangeConsequenceBanner";
import { TenantMigrationMaintenanceBanner } from "@/components/tenancy/TenantMigrationMaintenanceBanner";
import { CtoDemoStaticFallbackPresenterBanner } from "@/components/cto-demo/CtoDemoStaticFallbackPresenterBanner";
import { ServiceBusHealthBanner } from "@/components/governance/ServiceBusHealthBanner";
import { LlmBudgetApproachingLimitBanner } from "@/components/llm/LlmBudgetApproachingLimitBanner";
import { PublicDemoAiUsageBanner, TrialAiBudgetStatusBanner } from "@/components/trial/TrialAiBudgetStatusBanner";
import { TeamExpansionNudge } from "@/components/TeamExpansionNudge";
import { TrialBanner } from "@/components/trial/TrialBanner";
import { TrialExpiryBanner } from "@/components/trial/TrialExpiryBanner";
import { TrialUsageUpgradeNudge } from "@/components/trial/TrialUsageUpgradeNudge";
import { PersistentTrialStatusStrip } from "@/components/usability/PersistentTrialStatusStrip";
import { SetupHealthShellBanner } from "@/components/usability/SetupHealthShellBanner";

type AppShellStatusBannersProps = {
  readonly variant: "minimal" | "full";
};

/** Operator shell readiness, budget, and trial banners loaded outside the AppShell critical path. */
export function AppShellStatusBanners({ variant }: AppShellStatusBannersProps) {
  return (
    <>
      <OperatorOfflineReconnectBanner />
      <TenantMigrationMaintenanceBanner />
      <ScopeChangeConsequenceBanner />
      {variant === "full" ? <CtoDemoStaticFallbackPresenterBanner /> : null}
      <PublicDemoAiUsageBanner />
      <ServiceBusHealthBanner />
      {variant === "full" ? <SetupHealthShellBanner /> : null}
      <LlmBudgetApproachingLimitBanner />
      <TrialAiBudgetStatusBanner />
      <TrialUsageUpgradeNudge />
      <TeamExpansionNudge />
      <TrialExpiryBanner />
      {variant === "full" ? (
        <>
          <PersistentTrialStatusStrip />
          <TrialBanner />
        </>
      ) : null}
    </>
  );
}
