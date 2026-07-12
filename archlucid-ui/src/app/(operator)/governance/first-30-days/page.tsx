import type { Metadata } from "next";

import { GovernanceSetupGuidePageView } from "@/app/(operator)/governance/first-30-days/_sections/GovernanceSetupGuidePageView";
import { resolveGovernanceSetupGuideViewModel } from "@/app/(operator)/governance/first-30-days/_sections/resolve-governance-setup-status";

export const metadata: Metadata = {
  title: "Governance setup",
};

/** Guided 30-day governance foundation setup — links to existing configuration workspaces. */
export default async function FirstThirtyDaysGovernancePage() {
  const model = await resolveGovernanceSetupGuideViewModel();

  return <GovernanceSetupGuidePageView model={model} />;
}
