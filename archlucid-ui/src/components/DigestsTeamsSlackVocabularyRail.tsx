"use client";

import type { JSX } from "react";

import {
  buildDigestsTeamsSlackVocabulary,
  resolveDigestsTeamsSlackLink,
  resolveDigestsTeamsSlackPeerLinks,
  type DigestsTeamsSlackSurfaceId,
  type DigestsTeamsSlackVocabularyModel,
} from "@/lib/vocabulary/digests-teams-slack-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type DigestsTeamsSlackVocabularyRailProps = {
  readonly currentSurfaceId: DigestsTeamsSlackSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: DigestsTeamsSlackVocabularyModel;
};

/**
 * TB-2325 — Digests email cadence vs Teams / Slack chat alert channels.
 * Mount on Digests hub, Teams, and Slack integration pages.
 */
export function DigestsTeamsSlackVocabularyRail(
  props: DigestsTeamsSlackVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildDigestsTeamsSlackVocabulary();
  const peers = resolveDigestsTeamsSlackPeerLinks(props.currentSurfaceId);
  const currentLink = resolveDigestsTeamsSlackLink(props.currentSurfaceId);

  return (
    <VocabularyRail
      testIdPrefix="digests-teams-slack-vocabulary"
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
