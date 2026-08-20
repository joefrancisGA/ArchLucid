"use client";

import type { JSX } from "react";

import {
  buildWebhooksVsDlqVocabulary,
  resolveWebhooksVsDlqPeerLink,
  type WebhooksVsDlqSurfaceId,
  type WebhooksVsDlqVocabularyModel,
} from "@/lib/vocabulary/webhooks-vs-dlq-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type WebhooksVsDlqVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: WebhooksVsDlqSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildWebhooksVsDlqVocabulary}. */
  readonly model?: WebhooksVsDlqVocabularyModel;
};

/**
 * TB-2264 — Compact vocabulary rail between Webhooks outbound delivery and integration-events DLQ recovery.
 * Mount on Webhooks settings and the integration-events DLQ page.
 */
export function WebhooksVsDlqVocabularyRail(
  props: WebhooksVsDlqVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildWebhooksVsDlqVocabulary();
  const peer = resolveWebhooksVsDlqPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "webhooks" ? model.webhooksLink : model.dlqLink;

  return (
    <VocabularyRail
      testIdPrefix="webhooks-vs-dlq-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLine={model.compactLine}
      compactLinkPlacement="inline"
      heading={model.heading}
      whyTwo={model.whyTwo}
      currentLabel={currentLink.label}
      links={[{ ...peer, testIdSuffix: "peer-link" }]}
    />
  );
}
