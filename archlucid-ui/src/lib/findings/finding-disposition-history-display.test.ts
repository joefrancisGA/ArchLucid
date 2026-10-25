import { describe, expect, it } from "vitest";

import { formatFindingDispositionHistoryLine } from "@/lib/findings/finding-disposition-history-display";

describe("formatFindingDispositionHistoryLine", () => {
  it("labels missing deferred revisit metadata", () => {
    const line = formatFindingDispositionHistoryLine({
      eventId: "evt-1",
      findingId: "f-1",
      disposition: "Deferred",
      reviewerUserId: "",
      rationale: null,
      revisitDueUtc: null,
      occurredAtUtc: "",
    });

    expect(line).toContain("Reviewer was not stored.");
    expect(line).toContain("Rationale was not stored.");
    expect(line).toContain("Revisit due was not stored.");
  });
});
