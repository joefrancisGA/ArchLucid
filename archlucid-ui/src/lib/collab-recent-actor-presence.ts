/**
 * TB-2248 — Honest collab recent-actor presence (no fake live multiplayer).
 *
 * Builds soft teaching from optional recent disposition actors (name + when),
 * or an empty “no recent other actors” message. Complements the concurrent
 * update notice — does not invent viewers or heartbeat presence.
 */

export type CollabRecentActor = {
  /** Display label already resolved by the parent (user id when no display name). */
  readonly actorLabel: string;
  /** Human-readable when string (parent formats timestamps). */
  readonly whenLabel: string;
};

export type CollabRecentActorPresenceModel = {
  readonly heading: string;
  readonly body: string;
  readonly honestyNote: string;
  readonly hasRecentActors: boolean;
  readonly actors: readonly CollabRecentActor[];
};

export const COLLAB_RECENT_ACTOR_PRESENCE_HEADING = "Recent disposition activity" as const;

export const COLLAB_RECENT_ACTOR_PRESENCE_EMPTY_BODY =
  "No recent other actors on this finding. Others may still be working — dispositions append; refresh if this view looks stale." as const;

export const COLLAB_RECENT_ACTOR_PRESENCE_HONESTY_NOTE =
  "This is recent disposition history, not live presence. Refresh if the trail looks stale." as const;

export type BuildCollabRecentActorPresenceInput = {
  readonly recentActors?: readonly CollabRecentActor[] | null;
};

/** Build teaching from optional recent actors or the empty honesty message. */
export function buildCollabRecentActorPresence(
  input: BuildCollabRecentActorPresenceInput | null | undefined,
): CollabRecentActorPresenceModel {
  const rawActors = input?.recentActors;
  const actors: CollabRecentActor[] = [];

  if (rawActors !== null && rawActors !== undefined) {
    for (const actor of rawActors) {
      if (actor === null || actor === undefined) {
        continue;
      }

      const actorLabel = actor.actorLabel?.trim() ?? "";
      const whenLabel = actor.whenLabel?.trim() ?? "";

      if (actorLabel.length === 0) {
        continue;
      }

      actors.push({
        actorLabel,
        whenLabel: whenLabel.length > 0 ? whenLabel : "time unknown",
      });
    }
  }

  if (actors.length === 0) {
    return {
      heading: COLLAB_RECENT_ACTOR_PRESENCE_HEADING,
      body: COLLAB_RECENT_ACTOR_PRESENCE_EMPTY_BODY,
      honestyNote: COLLAB_RECENT_ACTOR_PRESENCE_HONESTY_NOTE,
      hasRecentActors: false,
      actors: [],
    };
  }

  const summary = actors
    .map((actor) => `${actor.actorLabel} (${actor.whenLabel})`)
    .join("; ");

  return {
    heading: COLLAB_RECENT_ACTOR_PRESENCE_HEADING,
    body: `Recent disposition activity: ${summary}.`,
    honestyNote: COLLAB_RECENT_ACTOR_PRESENCE_HONESTY_NOTE,
    hasRecentActors: true,
    actors,
  };
}

export type DispositionHistoryActorSource = {
  readonly reviewerUserId: string;
  readonly occurredAtUtc: string;
};

/**
 * Map disposition events to recent-actor rows for the strip.
 * Skips empty reviewer ids; optionally excludes the current operator.
 */
export function collabRecentActorsFromDispositionHistory(
  history: readonly DispositionHistoryActorSource[] | null | undefined,
  options?: {
    readonly excludeReviewerUserId?: string | null;
    readonly take?: number;
  },
): CollabRecentActor[] {
  if (history === null || history === undefined || history.length === 0) {
    return [];
  }

  const excludeRaw = options?.excludeReviewerUserId?.trim() ?? "";
  const take = options?.take !== undefined && options.take > 0 ? options.take : 3;
  const actors: CollabRecentActor[] = [];
  const seen = new Set<string>();

  for (const event of history) {
    if (event === null || event === undefined) {
      continue;
    }

    const reviewerUserId = event.reviewerUserId?.trim() ?? "";

    if (reviewerUserId.length === 0) {
      continue;
    }

    if (excludeRaw.length > 0 && reviewerUserId === excludeRaw) {
      continue;
    }

    if (seen.has(reviewerUserId)) {
      continue;
    }

    seen.add(reviewerUserId);
    const whenRaw = event.occurredAtUtc?.trim() ?? "";
    actors.push({
      actorLabel: reviewerUserId,
      whenLabel: whenRaw.length > 0 ? whenRaw : "time unknown",
    });

    if (actors.length >= take) {
      break;
    }
  }

  return actors;
}
