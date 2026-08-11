"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildColdInviteUsersInviteVocabulary,
  resolveColdInviteUsersInvitePeerLink,
  type ColdInviteUsersInviteSurfaceId,
  type ColdInviteUsersInviteVocabularyModel,
} from "@/lib/cold-invite-users-invite-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

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
  const variant = props.variant ?? "compact";
  const model = props.model ?? buildColdInviteUsersInviteVocabulary();
  const peer = resolveColdInviteUsersInvitePeerLink(props.currentSurfaceId);
  const currentLink =
    props.currentSurfaceId === "cold-invite" ? model.coldInviteLink : model.usersInviteLink;

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="cold-invite-users-invite-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, "font-medium")}
          data-testid="cold-invite-users-invite-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="cold-invite-users-invite-vocabulary-heading"
      data-testid="cold-invite-users-invite-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="cold-invite-users-invite-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        <span
          className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
          data-testid="cold-invite-users-invite-vocabulary-current"
          aria-current="page"
        >
          {currentLink.label}
        </span>
        <Link
          href={peer.href}
          className={cn(OPERATOR_LINK.inline, OPERATOR_TYPOGRAPHY.helper)}
          data-testid="cold-invite-users-invite-vocabulary-peer-link"
        >
          {peer.label}
        </Link>
      </div>
    </section>
  );
}
