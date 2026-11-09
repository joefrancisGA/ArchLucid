import { describe, expect, it, beforeEach } from "vitest";

import {
  readArchLucidOpenGateReturnRecord,
  writeArchLucidOpenGateReturnRecord,
} from "./archlucid-open-gate-return-storage";

describe("archlucid-open-gate-return-storage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips finding id and recorded time", () => {
    writeArchLucidOpenGateReturnRecord("workspace-1", {
      runId: "run-1",
      openGateLabel: "Record disposition",
      href: "/architecture/reviews/run-1?reviewTab=findings",
      recordedAtUtc: "2026-11-09T12:00:00.000Z",
      findingId: "finding-9",
    });

    expect(readArchLucidOpenGateReturnRecord("workspace-1")).toMatchObject({
      runId: "run-1",
      findingId: "finding-9",
      recordedAtUtc: "2026-11-09T12:00:00.000Z",
    });
  });
});
