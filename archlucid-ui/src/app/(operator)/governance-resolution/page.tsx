import { GovernanceResolutionPageClient } from "./_sections/GovernanceResolutionPageClient";
import { loadGovernanceResolutionPageData } from "./_sections/load-governance-resolution-page-data";

export default async function GovernanceResolutionPage() {
  const loaded = await loadGovernanceResolutionPageData();

  return <GovernanceResolutionPageClient loaded={loaded} />;
}
