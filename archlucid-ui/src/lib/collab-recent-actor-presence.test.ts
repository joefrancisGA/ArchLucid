import { describe, expect, it } from "vitest";

import {
  COLLAB_RECENT_ACTOR_PRESENCE_EMPTY_BODY,
  COLLAB_RECENT_ACTOR_PRESENCE_HEADING,
  COLLAB_RECENT_ACTOR_PRESENCE_HONESTY_NOTE,
  buildCollabRecentActorPresence,
  collabRecentActorsFromDispositionHistory,
} from "@/lib/collab-recent-actor-presence";

describe("collab-recent-actor-presence (TB-2248)", () => {
  it("builds empty teaching when no recent actors", () => {
    const empty = buildCollabRecentActorPresence({ recentActors: [] });

    expect(empty.heading).toBe(COLLAB_RECENT_ACTOR_PRESENCE_HEADING);
    expect(empty.body).toBe(COLLAB_RECENT_ACTOR_PRESENCE_EMPTY_BODY);
    expect(empty.body.toLowerCase()).toContain("no recent other actors");
    expect(empty.body.toLowerCase()).toContain("dispositions append");
    expect(empty.honestyNote).toBe(COLLAB_RECENT_ACTOR_PRESENCE_HONESTY_NOTE);
    expect(empty.hasRecentActors).toBe(false);
    expect(empty.actors).toEqual([]);

    expect(buildCollabRecentActorPresence(null).hasRecentActors).toBe(false);
    expect(buildCollabRecentActorPresence(undefined).hasRecentActors).toBe(false);
  });

  it("builds teaching from recent actors without inventing live presence", () => {
    const model = buildCollabRecentActorPresence({
      recentActors: [
        { actorLabel: "alex@example.com", whenLabel: "2026-08-11T12:00:00Z" },
        { actorLabel: "sam", whenLabel: "2026-08-10T09:00:00Z" },
      ],
    });

    expect(model.hasRecentActors).toBe(true);
    expect(model.body).toContain("alex@example.com");
    expect(model.body).toContain("2026-08-11T12:00:00Z");
    expect(model.body).toContain("sam");
    expect(model.honestyNote.toLowerCase()).toContain("not live presence");
    expect(model.honestyNote.toLowerCase()).toContain("refresh");
  });

  it("maps disposition history to unique recent actors and can exclude self", () => {
    const actors = collabRecentActorsFromDispositionHistory(
      [
        { reviewerUserId: "alice", occurredAtUtc: "2026-08-11T12:00:00Z" },
        { reviewerUserId: "bob", occurredAtUtc: "2026-08-11T11:00:00Z" },
        { reviewerUserId: "alice", occurredAtUtc: "2026-08-10T10:00:00Z" },
        { reviewerUserId: "carol", occurredAtUtc: "2026-08-09T09:00:00Z" },
      ],
      { excludeReviewerUserId: "alice", take: 2 },
    );

    expect(actors).toEqual([
      { actorLabel: "bob", whenLabel: "2026-08-11T11:00:00Z" },
      { actorLabel: "carol", whenLabel: "2026-08-09T09:00:00Z" },
    ]);
  });

  it("returns empty actors for null history or blank reviewer ids", () => {
    expect(collabRecentActorsFromDispositionHistory(null)).toEqual([]);
    expect(
      collabRecentActorsFromDispositionHistory([
        { reviewerUserId: "  ", occurredAtUtc: "2026-08-11T12:00:00Z" },
      ]),
    ).toEqual([]);
  });
});
