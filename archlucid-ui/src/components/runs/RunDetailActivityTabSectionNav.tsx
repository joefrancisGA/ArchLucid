"use client";

import {
  ProvenanceSectionNav,
} from "@/components/provenance/ProvenanceSectionNav";
import { useGovernanceMode } from "@/hooks/use-governance-mode";
import { isBuyerPolishedOperatorShellEnv } from "@/lib/demo-ui-env";
import { buildRunDetailActivityTabSections } from "@/lib/runs/run-detail-activity-tab-section-nav";

/** In-page anchor nav for the Activity tab on long review workspaces. */
export function RunDetailActivityTabSectionNav(props: {
  readonly hasManifestId?: boolean;
  readonly showFailureDetails?: boolean;
  readonly placement: "inline-top" | "sidebar";
}): React.JSX.Element | null {
  const { isGovernanceModeEnabled, vocabulary } = useGovernanceMode();
  const buyerPolishedArtifactTable = isBuyerPolishedOperatorShellEnv();
  const sections = buildRunDetailActivityTabSections({
    buyerPolishedArtifactTable,
    authorityChainLabel: isGovernanceModeEnabled ? vocabulary.authorityChainLabel : "",
    hasManifestId: props.hasManifestId,
    showFailureDetails: props.showFailureDetails,
  });

  return <ProvenanceSectionNav sections={sections} placement={props.placement} />;
}
