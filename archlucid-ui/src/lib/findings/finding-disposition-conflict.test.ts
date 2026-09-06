import { describe, expect, it } from "vitest";

import {
  formatFindingDispositionConflictMessage,
  readFindingDispositionConflictDetail,
} from "@/lib/findings/finding-disposition-conflict";

describe("finding-disposition-conflict (DR-08)", () => {
  it("readFindingDispositionConflictDetail parses extensions payload", () => {
    const detail = readFindingDispositionConflictDetail({
      type: "conflict",
      title: "Conflict",
      status: 409,
      detail: "lost race",
      currentDisposition: {
        eventId: "11111111-1111-1111-1111-111111111111",
        findingId: "finding-1",
        disposition: "Accepted",
        reviewerUserId: "alice",
        occurredAtUtc: "2026-09-06T12:00:00.000Z",
        currentDispositionRowVersionBase64: "AQID",
      },
    } as import("@/lib/api-problem").ApiProblemDetails);

    expect(detail).toEqual({
      eventId: "11111111-1111-1111-1111-111111111111",
      findingId: "finding-1",
      disposition: "Accepted",
      reviewerUserId: "alice",
      occurredAtUtc: "2026-09-06T12:00:00.000Z",
      currentDispositionRowVersionBase64: "AQID",
    });
  });

  it("formatFindingDispositionConflictMessage names the winning disposition", () => {
    const message = formatFindingDispositionConflictMessage({
      eventId: "11111111-1111-1111-1111-111111111111",
      findingId: "finding-1",
      disposition: "Remediated",
      reviewerUserId: "bob",
      occurredAtUtc: "2026-09-06T12:00:00.000Z",
      currentDispositionRowVersionBase64: "AQID",
    });

    expect(message).toContain("Remediated");
    expect(message).toContain("Reload");
  });
});
