import { describe, expect, it } from "vitest";

import {
  formatActiveWaiverEvidenceRef,
  formatActiveWaiverRationale,
  formatDispositionHistoryActor,
  formatDispositionHistoryRationale,
} from "@/lib/findings/finding-disposition-history-display";

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
