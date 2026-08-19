"use client";

import type { JSX } from "react";

import {
  buildScimUsersVocabulary,
  resolveScimUsersPeerLink,
  type ScimUsersSurfaceId,
  type ScimUsersVocabularyModel,
} from "@/lib/vocabulary/scim-users-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ScimUsersVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ScimUsersSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildScimUsersVocabulary}. */
  readonly model?: ScimUsersVocabularyModel;
};

/**
 * TB-2321 — Compact vocabulary rail between SCIM directory sync and Users invite.
 * Mount on SCIM provisioning and Users administration.
 */
export function ScimUsersVocabularyRail(props: ScimUsersVocabularyRailProps): JSX.Element {
  const model = props.model ?? buildScimUsersVocabulary();
  const peer = resolveScimUsersPeerLink(props.currentSurfaceId);
  const currentLink = props.currentSurfaceId === "scim" ? model.scimLink : model.usersLink;

  return (
    <VocabularyRail
      testIdPrefix="scim-users-vocabulary"
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
