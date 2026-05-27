import { GovernanceResolutionPageClient } from "./_sections/GovernanceResolutionPageClient";
import { loadGovernanceResolutionPageData } from "./_sections/load-governance-resolution-page-data";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { redirect } from "next/navigation";

export default async function GovernanceResolutionPage() {
  if (isBuyerPolishedOperatorShellEnv()) {
    redirect("/governance");
  }

  const loaded = await loadGovernanceResolutionPageData();

  return <GovernanceResolutionPageClient loaded={loaded} />;
}
