"use client";

import type { JSX } from "react";

import {
  buildColdInviteUsersInviteVocabulary,
  resolveColdInviteUsersInvitePeerLink,
  type ColdInviteUsersInviteSurfaceId,
  type ColdInviteUsersInviteVocabularyModel,
} from "@/lib/vocabulary/cold-invite-users-invite-vocabulary";
import { VocabularyRail } from "@/components/vocabulary/VocabularyRail";

export type ColdInviteUsersInviteVocabularyRailProps = {
  /** Surface hosting the strip — marks the current job and links to the peer. */
  readonly currentSurfaceId: ColdInviteUsersInviteSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildColdInviteUsersInviteVocabulary}. */
  readonly model?: ColdInviteUsersInviteVocabularyModel;
};

/**
 * TB-2276 — Compact vocabulary rail between cold invite accept and Users / invite-reviewer send.
 * Mount on `/auth/invite`, invite-reviewer, and the Users invite panel.
 */
export function ColdInviteUsersInviteVocabularyRail(
  props: ColdInviteUsersInviteVocabularyRailProps,
): JSX.Element {
  const model = props.model ?? buildColdInviteUsersInviteVocabulary();
  const peer = resolveColdInviteUsersInvitePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "cold-invite" ? model.coldInviteLink : model.usersInviteLink;

  return (
    <VocabularyRail
      testIdPrefix="cold-invite-users-invite-vocabulary"
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
