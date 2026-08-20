"use client";

import type { JSX } from "react";

import {
  buildTeamsSlackNotificationVocabulary,
  resolveTeamsSlackNotificationPeerLink,
  type TeamsSlackNotificationSurfaceId,
  type TeamsSlackNotificationVocabularyModel,
} from "@/lib/vocabulary/teams-slack-notification-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type TeamsSlackNotificationVocabularyRailProps = {
  readonly currentSurfaceId: TeamsSlackNotificationSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: TeamsSlackNotificationVocabularyModel;
};

/**
 * TB-2247 — Compact vocabulary rail between Teams and Slack notification channels.
 * Mount on the notifications hub and both integration pages.
 */
export function TeamsSlackNotificationVocabularyRail(
  props: TeamsSlackNotificationVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildTeamsSlackNotificationVocabulary();
  const isHub = props.currentSurfaceId === "notifications-hub";
  const peer =
    props.currentSurfaceId === "notifications-hub"
      ? null
      : resolveTeamsSlackNotificationPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "teams"
      ? model.teamsLink
      : props.currentSurfaceId === "slack"
        ? model.slackLink
        : null;

  const links = isHub
    ? [
        {
          href: model.teamsLink.href,
          label: model.teamsLink.label,
          testIdSuffix: "teams-link",
          compactLineAnchor: model.teamsLink.compactLineAnchor,
        },
        {
          href: model.slackLink.href,
          label: model.slackLink.label,
          testIdSuffix: "slack-link",
          compactLineAnchor: model.slackLink.compactLineAnchor,
        },
      ]
    : peer !== null
      ? [
          {
            href: peer.href,
            label: peer.label,
            testIdSuffix: "peer-link",
            compactLineAnchor: peer.compactLineAnchor,
          },
        ]
      : [];

  return (
    <VocabularyRail
      testIdPrefix="teams-slack-notification-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink?.label ?? null}
      links={links}
    />
  );
}
