import { describe, expect, it } from "vitest";

import { buildDemoPreviewTimelineRows } from "@/lib/demo-preview-timeline-present";

describe("demo-preview-timeline-present", () => {
  it("uses descriptive lifecycle action labels", () => {
    const rows = buildDemoPreviewTimelineRows(
      [
        {
          eventId: "1",
          occurredUtc: "2026-01-10T09:15:22.000Z",
          eventType: "RunStarted",
          actorUserName: "Jordan Lee",
          correlationId: null,
        },
        {
          eventId: "2",
          occurredUtc: "2026-01-31T21:52:06.000Z",
          eventType: "finalize.run",
          actorUserName: "Taylor Morgan",
          correlationId: null,
        },
      ],
      {
        runId: "customer-intake-modernization",
        manifestId: "manifest-1",
        isRunDetailAvailable: false,
      },
    );

    expect(rows[0]?.action?.label).toBe("Open review");
    expect(rows[1]?.action?.label).toBe("Open signed review");
    expect(rows[0]?.action?.href).toBe("#artifact-signed-review-record");
  });
});
