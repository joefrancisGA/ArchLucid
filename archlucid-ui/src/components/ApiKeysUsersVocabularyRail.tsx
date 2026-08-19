"use client";

import type { JSX } from "react";

import {
  buildApiKeysUsersVocabulary,
  resolveApiKeysUsersPeerLink,
  type ApiKeysUsersSurfaceId,
  type ApiKeysUsersVocabularyModel,
} from "@/lib/vocabulary/api-keys-users-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ApiKeysUsersVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ApiKeysUsersSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildApiKeysUsersVocabulary}. */
  readonly model?: ApiKeysUsersVocabularyModel;
};

/**
 * TB-2327 — Compact vocabulary rail between API keys credentials and Users and roles.
 * Mount on API keys administration and Users settings.
 */
export function ApiKeysUsersVocabularyRail(
  props: ApiKeysUsersVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildApiKeysUsersVocabulary();
  const peer = resolveApiKeysUsersPeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "api-keys" ? model.apiKeysLink : model.usersLink;

  return (
    <VocabularyRail
      testIdPrefix="api-keys-users-vocabulary"
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
