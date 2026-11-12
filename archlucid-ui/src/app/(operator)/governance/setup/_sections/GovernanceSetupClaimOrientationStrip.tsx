"use client";

import {
  EvidenceOrientationClaimAndSourcesStrip,
} from "@/components/evidence-orientation/EvidenceOrientationClaimAndSourcesStrip";
import { useProductLine } from "@/components/product-line/ProductLineProvider";
import {
  GOVERNANCE_SETUP_FOLLOW_UPS_TITLE,
  GOVERNANCE_SETUP_SOURCES_INTRO,
  resolveGovernanceSetupOrientationSources,
} from "@/lib/governance/governance-setup-evidence-copy";

/** Sources index for the approval setup guide (GFX). */
export function GovernanceSetupClaimOrientationStrip(): React.JSX.Element {
  const { productLine } = useProductLine();

  return (
    <EvidenceOrientationClaimAndSourcesStrip
      slug="governance-setup"
      sourcesTitle={GOVERNANCE_SETUP_FOLLOW_UPS_TITLE}
      sourcesIntro={GOVERNANCE_SETUP_SOURCES_INTRO}
      sources={resolveGovernanceSetupOrientationSources(productLine)}
      hubSecondary
    />
  );
}
