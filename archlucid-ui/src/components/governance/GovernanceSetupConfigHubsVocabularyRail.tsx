"use client";

import type { JSX } from "react";

import {
  buildGovernanceSetupConfigHubsVocabulary,
  resolveGovernanceSetupConfigHubsLink,
  resolveGovernanceSetupConfigHubsPeerLinks,
  type GovernanceSetupConfigHubsSurfaceId,
  type GovernanceSetupConfigHubsVocabularyModel,
} from "@/lib/vocabulary/governance-setup-config-hubs-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type GovernanceSetupConfigHubsVocabularyRailProps = {
  readonly currentSurfaceId: GovernanceSetupConfigHubsSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: GovernanceSetupConfigHubsVocabularyModel;
};

/** TB-2297 — Approval setup guide vs live Alert rules / Policy packs / Standards hubs. */
export function GovernanceSetupConfigHubsVocabularyRail(
  props: GovernanceSetupConfigHubsVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildGovernanceSetupConfigHubsVocabulary();
  const peers = resolveGovernanceSetupConfigHubsPeerLinks(props.currentSurfaceId);
  const currentLink = resolveGovernanceSetupConfigHubsLink(props.currentSurfaceId);

  return (
    <VocabularyRail
      testIdPrefix="governance-setup-config-hubs-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whySeparate}
      currentLabel={currentLink?.label ?? null}
      links={peers.map((peer) => ({
        href: peer.href,
        label: peer.label,
        testIdSuffix: `peer-${peer.id}`,
        compactLineAnchor: peer.compactLineAnchor,
      }))}
    />
  );
}
