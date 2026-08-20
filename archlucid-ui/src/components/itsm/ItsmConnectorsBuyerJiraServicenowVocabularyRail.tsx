"use client";

import type { JSX } from "react";

import {
  buildItsmConnectorsBuyerJiraServicenowVocabulary,
  resolveItsmConnectorsBuyerJiraServicenowLink,
  resolveItsmConnectorsBuyerJiraServicenowPeerLinks,
  type ItsmConnectorsBuyerJiraServicenowSurfaceId,
  type ItsmConnectorsBuyerJiraServicenowVocabularyModel,
} from "@/lib/vocabulary/itsm-connectors-buyer-jira-servicenow-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ItsmConnectorsBuyerJiraServicenowVocabularyRailProps = {
  readonly currentSurfaceId: ItsmConnectorsBuyerJiraServicenowSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ItsmConnectorsBuyerJiraServicenowVocabularyModel;
};

/** TB-2324 — Admin ITSM connectors vs buyer Jira vs buyer ServiceNow triad. */
export function ItsmConnectorsBuyerJiraServicenowVocabularyRail(
  props: ItsmConnectorsBuyerJiraServicenowVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildItsmConnectorsBuyerJiraServicenowVocabulary();
  const peers = resolveItsmConnectorsBuyerJiraServicenowPeerLinks(props.currentSurfaceId);
  const currentLink = resolveItsmConnectorsBuyerJiraServicenowLink(props.currentSurfaceId);

  return (
    <VocabularyRail
      testIdPrefix="itsm-connectors-buyer-jira-servicenow-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyThree}
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
