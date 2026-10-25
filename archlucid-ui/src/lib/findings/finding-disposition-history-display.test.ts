import { describe, expect, it } from "vitest";

import {
  formatActiveWaiverEvidenceRef,
  formatActiveWaiverRationale,
  formatDispositionHistoryActor,
  formatDispositionHistoryRationale,
  formatFindingDispositionHistoryLine,
} from "@/lib/findings/finding-disposition-history-display";

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

describe("finding-disposition-history-display", () => {
  it("labels missing waiver rationale and evidence reference", () => {
    expect(formatActiveWaiverRationale(null)).toBe("Waiver rationale was not stored.");
    expect(formatActiveWaiverEvidenceRef(undefined)).toBe("Waiver evidence reference was not stored.");
  });

  it("labels missing disposition history reviewer and rationale", () => {
    expect(formatDispositionHistoryActor("  ")).toBe("Reviewer was not stored.");
    expect(formatDispositionHistoryRationale(null)).toBe("Rationale was not stored.");
    expect(formatDispositionHistoryRationale("")).toBe("Rationale was stored empty.");
  });
});
