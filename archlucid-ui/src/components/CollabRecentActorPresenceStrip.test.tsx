import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { CollabRecentActorPresenceStrip } from "@/components/CollabRecentActorPresenceStrip";
import {
  COLLAB_RECENT_ACTOR_PRESENCE_EMPTY_BODY,
  COLLAB_RECENT_ACTOR_PRESENCE_HEADING,
  COLLAB_RECENT_ACTOR_PRESENCE_HONESTY_NOTE,
} from "@/lib/collab-recent-actor-presence";

describe("CollabRecentActorPresenceStrip (TB-2248)", () => {
  it("renders empty honesty teaching when no recent actors", () => {
    render(<CollabRecentActorPresenceStrip recentActors={[]} />);

    const strip = screen.getByTestId("collab-recent-actor-presence");
    expect(strip).toHaveAttribute("data-has-recent-actors", "false");
    expect(screen.getByText(COLLAB_RECENT_ACTOR_PRESENCE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(COLLAB_RECENT_ACTOR_PRESENCE_EMPTY_BODY)).toBeInTheDocument();
    expect(screen.getByTestId("collab-recent-actor-presence-honesty")).toHaveTextContent(
      COLLAB_RECENT_ACTOR_PRESENCE_HONESTY_NOTE,
    );
  });

  it("renders recent disposition actor from convenience prop", () => {
    render(
      <CollabRecentActorPresenceStrip
        recentDispositionActor={{
          actorLabel: "reviewer-42",
          whenLabel: "2026-08-11T15:00:00Z",
        }}
      />,
    );

    const strip = screen.getByTestId("collab-recent-actor-presence");
    expect(strip).toHaveAttribute("data-has-recent-actors", "true");
    expect(strip.textContent ?? "").toContain("reviewer-42");
    expect(strip.textContent ?? "").toContain("2026-08-11T15:00:00Z");
    expect(strip.textContent ?? "").not.toContain("live multiplayer");
  });

  it("exposes as-of text and refresh without live presence copy", () => {
    const onRefresh = vi.fn();
    render(
      <CollabRecentActorPresenceStrip
        recentActors={[]}
        asOfUtc="2026-09-04T18:00:00.000Z"
        onRefresh={onRefresh}
      />,
    );

    expect(screen.getByTestId("collab-recent-actor-presence-as-of")).toHaveTextContent("As of");
    expect(screen.getByTestId("collab-recent-actor-presence-refresh")).toBeInTheDocument();
    expect(screen.queryByText(/viewing now/i)).not.toBeInTheDocument();
  });

  it("accepts a prebuilt model override", () => {
    render(
      <CollabRecentActorPresenceStrip
        model={{
          heading: "Override heading",
          body: "Override body",
          honestyNote: "Override note",
          hasRecentActors: true,
          actors: [{ actorLabel: "x", whenLabel: "y" }],
        }}
      />,
    );

    expect(screen.getByText("Override heading")).toBeInTheDocument();
    expect(screen.getByText("Override body")).toBeInTheDocument();
    expect(screen.getByText("Override note")).toBeInTheDocument();
  });
});
