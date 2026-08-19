import { describe, expect, it } from "vitest";

import type { FindingDispositionEvent } from "@/lib/api/governance-stickiness-api";
import {
  formatDispositionConcurrentUpdateMessage,
  latestDispositionEvent,
  resolveDispositionConcurrentUpdateNotice,
} from "@/lib/findings/finding-disposition-concurrent-update";

function event(
  partial: Partial<FindingDispositionEvent> & Pick<FindingDispositionEvent, "eventId" | "disposition" | "occurredAtUtc">,
): FindingDispositionEvent {
  return {
    findingId: "finding-1",
    reviewerUserId: "reviewer-1",
    ...partial,
  };
}

describe("finding-disposition-concurrent-update", () => {
  it("returns null when the saved event remains current", () => {
    const saved = event({
      eventId: "evt-2",
      disposition: "Accepted",
      occurredAtUtc: "2026-08-10T12:00:00.000Z",
    });

    const notice = resolveDispositionConcurrentUpdateNotice(saved, [
      saved,
      event({
        eventId: "evt-1",
        disposition: "Deferred",
        occurredAtUtc: "2026-08-10T11:00:00.000Z",
      }),
    ]);

    expect(notice).toBeNull();
  });

  it("returns concurrent-update copy when a newer event wins", () => {
    const saved = event({
      eventId: "evt-1",
      disposition: "Accepted",
      occurredAtUtc: "2026-08-10T11:00:00.000Z",
    });
    const winner = event({
      eventId: "evt-2",
      disposition: "RejectedAsNotApplicable",
      occurredAtUtc: "2026-08-10T12:00:00.000Z",
    });

    expect(resolveDispositionConcurrentUpdateNotice(saved, [winner, saved])).toBe(
      formatDispositionConcurrentUpdateMessage(winner),
    );
    expect(latestDispositionEvent([winner, saved])?.eventId).toBe("evt-2");
  });
});
