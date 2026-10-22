import { PolicyPacksPageClient } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksPageClient";
import { loadPolicyPacksPageData } from "@/app/(operator)/governance/policy-packs/_sections/load-policy-packs-page-data";

/** Canonical policy packs list (TB-405). */
export default async function GovernancePolicyPacksPage() {
  const loaded = await loadPolicyPacksPageData();

  return <PolicyPacksPageClient loaded={loaded} />;
}
