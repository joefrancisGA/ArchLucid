"use client";

import type { JSX } from "react";

import {
  buildWebhooksApiKeysVocabulary,
  resolveWebhooksApiKeysPeerLink,
  type WebhooksApiKeysSurfaceId,
  type WebhooksApiKeysVocabularyModel,
} from "@/lib/vocabulary/webhooks-api-keys-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type WebhooksApiKeysVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: WebhooksApiKeysSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildWebhooksApiKeysVocabulary}. */
  readonly model?: WebhooksApiKeysVocabularyModel;
};

/**
 * TB-2320 — Compact vocabulary rail between Webhooks outbound delivery and API keys credentials.
 * Mount on Webhooks settings and API keys administration.
 */
export function WebhooksApiKeysVocabularyRail(
  props: WebhooksApiKeysVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildWebhooksApiKeysVocabulary();
  const peer = resolveWebhooksApiKeysPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "webhooks" ? model.webhooksLink : model.apiKeysLink;

  return (
    <VocabularyRail
      testIdPrefix="webhooks-api-keys-vocabulary"
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
