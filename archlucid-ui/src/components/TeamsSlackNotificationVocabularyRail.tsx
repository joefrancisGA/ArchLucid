"use client";

import type { JSX } from "react";

import Link from "next/link";

import {
  buildTeamsSlackNotificationVocabulary,
  resolveTeamsSlackNotificationPeerLink,
  type TeamsSlackNotificationSurfaceId,
  type TeamsSlackNotificationVocabularyModel,
} from "@/lib/vocabulary/teams-slack-notification-vocabulary";
import { OPERATOR_LINK, OPERATOR_TYPOGRAPHY } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export type TeamsSlackNotificationVocabularyRailProps = {
  /** Surface hosting the strip — hub shows both channels; Teams/Slack link the peer. */
  readonly currentSurfaceId: TeamsSlackNotificationSurfaceId;
  /** Compact one-line strip (default) vs fuller why-two explanation. */
  readonly variant?: "compact" | "full";
  readonly className?: string;
  /** Optional override for tests; defaults to {@link buildTeamsSlackNotificationVocabulary}. */
  readonly model?: TeamsSlackNotificationVocabularyModel;
};

/**
 * TB-2247 — Compact vocabulary rail between Teams and Slack notification channels.
 * Mount on the notifications hub and both integration pages.
 */
export function TeamsSlackNotificationVocabularyRail(
  props: TeamsSlackNotificationVocabularyRailProps,
): JSX.Element {
  const variant = props.variant ?? "compact";
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

  if (variant === "compact") {
    return (
      <p
        className={cn(
          "m-0 mb-3 leading-relaxed text-al-text-secondary",
          OPERATOR_TYPOGRAPHY.helper,
          props.className,
        )}
        data-testid="teams-slack-notification-vocabulary"
        data-variant="compact"
        data-current-surface={props.currentSurfaceId}
      >
        <span>{model.compactLine}</span>{" "}
        {isHub ? (
          <>
            <Link
              href={model.teamsLink.href}
              className={cn(OPERATOR_LINK.inline, "font-medium")}
              data-testid="teams-slack-notification-vocabulary-teams-link"
            >
              {model.teamsLink.label}
            </Link>
            {" · "}
            <Link
              href={model.slackLink.href}
              className={cn(OPERATOR_LINK.inline, "font-medium")}
              data-testid="teams-slack-notification-vocabulary-slack-link"
            >
              {model.slackLink.label}
            </Link>
          </>
        ) : peer !== null ? (
          <Link
            href={peer.href}
            className={cn(OPERATOR_LINK.inline, "font-medium")}
            data-testid="teams-slack-notification-vocabulary-peer-link"
          >
            {peer.label}
          </Link>
        ) : null}
      </p>
    );
  }

  return (
    <section
      className={cn(
        "mb-3 space-y-2 rounded-md border border-neutral-200 bg-neutral-50/50 px-3 py-2 dark:border-neutral-700 dark:bg-neutral-900/30",
        props.className,
      )}
      aria-labelledby="teams-slack-notification-vocabulary-heading"
      data-testid="teams-slack-notification-vocabulary"
      data-variant="full"
      data-current-surface={props.currentSurfaceId}
    >
      <h2
        id="teams-slack-notification-vocabulary-heading"
        className={cn(OPERATOR_TYPOGRAPHY.helper, "m-0 font-medium text-al-text-primary")}
      >
        {model.heading}
      </h2>
      <p className={cn("m-0 text-al-text-secondary", OPERATOR_TYPOGRAPHY.helper)}>
        {model.whyTwo}
      </p>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {currentLink !== null ? (
          <span
            className={cn("font-medium text-al-text-primary", OPERATOR_TYPOGRAPHY.helper)}
            data-testid="teams-slack-notification-vocabulary-current"
            aria-current="page"
          >
            {currentLink.label}
          </span>
        ) : null}
        {isHub ? (
          <>
            <Link
              href={model.teamsLink.href}
              className={OPERATOR_LINK.optional}
              data-testid="teams-slack-notification-vocabulary-teams-link"
            >
              {model.teamsLink.label}
            </Link>
            <Link
              href={model.slackLink.href}
              className={OPERATOR_LINK.optional}
              data-testid="teams-slack-notification-vocabulary-slack-link"
            >
              {model.slackLink.label}
            </Link>
          </>
        ) : peer !== null ? (
          <Link
            href={peer.href}
            className={OPERATOR_LINK.optional}
            data-testid="teams-slack-notification-vocabulary-peer-link"
          >
            {peer.label}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
