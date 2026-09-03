import { describe, expect, it } from "vitest";

import {
  computeFindingDispositionRevisitDueUtc,
  FINDING_DISPOSITION_REVISIT_WINDOW_HOURS,
  isFindingDispositionRevisitWindowOpen,
} from "@/lib/findings/finding-disposition-revisit-window";

describe("finding-disposition-revisit-window", () => {
  it("uses a 24-hour revisit window", () => {
    expect(FINDING_DISPOSITION_REVISIT_WINDOW_HOURS).toBe(24);
  });

  it("computes revisit due 24 hours ahead", () => {
    const now = new Date("2026-09-03T12:00:00.000Z");
    const due = computeFindingDispositionRevisitDueUtc(now);

    expect(due).toBe("2026-09-04T12:00:00.000Z");
  });

  it("reports open revisit windows before due time", () => {
    const now = new Date("2026-09-03T12:00:00.000Z");

    expect(isFindingDispositionRevisitWindowOpen("2026-09-04T12:00:00.000Z", now)).toBe(true);
    expect(isFindingDispositionRevisitWindowOpen("2026-09-02T12:00:00.000Z", now)).toBe(false);
  });
});
