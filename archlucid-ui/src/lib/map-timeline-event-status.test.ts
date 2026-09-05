import { describe, expect, it } from "vitest";

import {
  mapTimelineEventToStatusKind,
  timelineEventStatusLabel,
} from "@/lib/map-timeline-event-status";

describe("mapTimelineEventToStatusKind", () => {
  it("maps milestone events to ready", () => {
    expect(mapTimelineEventToStatusKind("RunCompleted")).toBe("ready");
  });

  it("maps non-milestone events to neutral", () => {
    expect(mapTimelineEventToStatusKind("RunStarted")).toBe("neutral");
  });
});

describe("timelineEventStatusLabel", () => {
  it("labels milestones and steps distinctly", () => {
    expect(timelineEventStatusLabel("RunCompleted")).toBe("Milestone");
    expect(timelineEventStatusLabel("RunStarted")).toBe("Step");
  });
});
