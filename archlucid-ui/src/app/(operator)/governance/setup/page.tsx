import type { Metadata } from "next";

import { GovernanceSetupGuidePageView } from "@/app/(operator)/governance/setup/_sections/GovernanceSetupGuidePageView";
import { resolveGovernanceSetupGuideViewModel } from "@/app/(operator)/governance/setup/_sections/resolve-governance-setup-status";

export const metadata: Metadata = {
  title: "Governance setup",
};

/** Guided governance foundation setup — links to existing configuration workspaces. */
export default async function GovernanceSetupPage() {
  const model = await resolveGovernanceSetupGuideViewModel();

  return <GovernanceSetupGuidePageView model={model} />;
}
