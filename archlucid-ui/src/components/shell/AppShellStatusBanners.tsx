"use client";

import { CtoDemoStaticFallbackPresenterBanner } from "@/components/cto-demo/CtoDemoStaticFallbackPresenterBanner";
import { ServiceBusHealthBanner } from "@/components/governance/ServiceBusHealthBanner";
import { LlmBudgetApproachingLimitBanner } from "@/components/LlmBudgetApproachingLimitBanner";
import { TeamExpansionNudge } from "@/components/TeamExpansionNudge";
import { TrialBanner } from "@/components/TrialBanner";
import { TrialExpiryBanner } from "@/components/TrialExpiryBanner";
import { TrialUsageUpgradeNudge } from "@/components/TrialUsageUpgradeNudge";
import { PersistentTrialStatusStrip } from "@/components/usability/PersistentTrialStatusStrip";
import { SetupHealthShellBanner } from "@/components/usability/SetupHealthShellBanner";

type AppShellStatusBannersProps = {
  readonly variant: "minimal" | "full";
};

/** Operator shell readiness, budget, and trial banners loaded outside the AppShell critical path. */
export function AppShellStatusBanners({ variant }: AppShellStatusBannersProps) {
  return (
    <>
      {variant === "full" ? <CtoDemoStaticFallbackPresenterBanner /> : null}
      <ServiceBusHealthBanner />
      {variant === "full" ? <SetupHealthShellBanner /> : null}
      <LlmBudgetApproachingLimitBanner />
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
