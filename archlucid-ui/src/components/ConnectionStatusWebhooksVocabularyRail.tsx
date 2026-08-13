"use client";

import type { JSX } from "react";

import {
  buildConnectionStatusWebhooksVocabulary,
  resolveConnectionStatusWebhooksPeerLink,
  type ConnectionStatusWebhooksSurfaceId,
  type ConnectionStatusWebhooksVocabularyModel,
} from "@/lib/vocabulary/connection-status-webhooks-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ConnectionStatusWebhooksVocabularyRailProps = {
  readonly currentSurfaceId: ConnectionStatusWebhooksSurfaceId;
  readonly variant?: "compact" | "full";
  readonly className?: string;
  readonly model?: ConnectionStatusWebhooksVocabularyModel;
};

/** TB-2301 — Connection status readiness vs Webhooks subscription editor. */
export function ConnectionStatusWebhooksVocabularyRail(
  props: ConnectionStatusWebhooksVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildConnectionStatusWebhooksVocabulary();
  const peer = resolveConnectionStatusWebhooksPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "connection-status"
      ? model.connectionStatusLink
      : model.webhooksLink;

  return (
    <VocabularyRail
      testIdPrefix="connection-status-webhooks-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
