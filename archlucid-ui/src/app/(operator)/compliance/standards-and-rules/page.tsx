import type { Metadata } from "next";

import { GovernanceResolutionPageClient } from "@/app/(operator)/governance/standards-and-rules/_sections/GovernanceResolutionPageClient";
import { loadGovernanceResolutionPageData } from "@/app/(operator)/governance/standards-and-rules/_sections/load-governance-resolution-page-data";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";

export const metadata: Metadata = {
  title: OPERATOR_NAV_LINK_LABELS.governanceResolution,
};

/** SecureNow standards and rules workspace. */
export default async function SecureNowStandardsAndRulesPage() {
  const loaded = await loadGovernanceResolutionPageData();

  return <GovernanceResolutionPageClient loaded={loaded} />;
}
