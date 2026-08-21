"use client";

import type { JSX } from "react";

import { PairwiseVocabularyRailFromModel } from "@/components/vocabulary/PairwiseVocabularyRailFromModel";
import {
  buildColdInviteUsersInvitePairwiseRail,
  type ColdInviteUsersInviteSurfaceId,
  type ColdInviteUsersInviteVocabularyModel,
} from "@/lib/vocabulary/cold-invite-users-invite-vocabulary";

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
  const pairwiseModel =
    props.model !== undefined
      ? {
          heading: props.model.heading,
          whyTwo: props.model.whyTwo,
          compactLine: props.model.compactLine,
          currentLink: props.model.coldInviteLink,
          peerLink: props.model.usersInviteLink,
        }
      : buildColdInviteUsersInvitePairwiseRail();

  return (
    <PairwiseVocabularyRailFromModel
      testIdPrefix="cold-invite-users-invite-vocabulary"
      currentSurfaceId={props.currentSurfaceId}
      variant={props.variant}
      className={props.className}
      compactLinkPlacement="inline"
      model={pairwiseModel}
    />
  );
}
