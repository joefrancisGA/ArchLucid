import { PolicyPacksPageClient } from "./_sections/PolicyPacksPageClient";
import { loadPolicyPacksPageData } from "./_sections/load-policy-packs-page-data";

export default async function PolicyPacksPage() {
  const loaded = await loadPolicyPacksPageData();

  return <PolicyPacksPageClient loaded={loaded} />;
}
