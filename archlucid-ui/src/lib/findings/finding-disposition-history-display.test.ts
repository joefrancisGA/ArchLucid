import { describe, expect, it } from "vitest";

import {
  formatActiveWaiverEvidenceRef,
  formatActiveWaiverRationale,
  formatDispositionHistoryActor,
  formatDispositionHistoryDisposition,
  formatDispositionHistoryRationale,
  formatDispositionHistoryRecordedTime,
} from "@/lib/findings/finding-disposition-history-display";

describe("finding-disposition-history-display", () => {
  it("labels missing waiver rationale and evidence reference", () => {
    expect(formatActiveWaiverRationale(null)).toBe("Waiver rationale was not stored.");
    expect(formatActiveWaiverEvidenceRef(undefined)).toBe("Waiver evidence reference was not stored.");
  });

  it("labels disposition history disposition, reviewer, and recorded time honestly", () => {
    expect(formatDispositionHistoryDisposition("")).toBe("Disposition was stored empty.");
    expect(formatDispositionHistoryDisposition("UnknownWire")).toBe("Disposition was not stored.");
    expect(formatDispositionHistoryDisposition("Accepted")).toBe("Accepted");
    expect(formatDispositionHistoryActor("  ")).toBe("Reviewer was stored empty.");
    expect(
      formatDispositionHistoryActor("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
    ).toBe("Reviewer name was not stored. Reviewer id aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee.");
    expect(formatDispositionHistoryRationale(null)).toBe("Rationale was not stored.");
    expect(formatDispositionHistoryRationale("")).toBe("Rationale was stored empty.");
    expect(formatDispositionHistoryRecordedTime("   ")).toBe("Recorded time was stored empty.");
    expect(formatDispositionHistoryRecordedTime("not-a-time")).toBe("Recorded time was not readable.");
    expect(formatDispositionHistoryRecordedTime("2026-01-15T12:00:00Z")).toBe("2026-01-15T12:00:00Z");
  });
});
