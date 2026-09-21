import type { Metadata } from "next";

import { PolicyPacksPageClient } from "@/app/(operator)/governance/policy-packs/_sections/PolicyPacksPageClient";
import { loadPolicyPacksPageData } from "@/app/(operator)/governance/policy-packs/_sections/load-policy-packs-page-data";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.policyPacks,
};

/** SecureNow policy packs hub. */
export default async function SecureNowPolicyPacksPage() {
  const loaded = await loadPolicyPacksPageData();

  return <PolicyPacksPageClient loaded={loaded} />;
}
