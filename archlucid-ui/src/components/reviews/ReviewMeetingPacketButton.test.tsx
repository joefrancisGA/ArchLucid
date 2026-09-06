import { describe, expect, it } from "vitest";

import { buildReviewMeetingPacketSteps } from "@/components/reviews/ReviewMeetingPacketButton";
import { PACKAGE_PRINT_MEETING_CAPTURE_SECTION_ID } from "@/lib/reviews/review-meeting-capture-export";

describe("buildReviewMeetingPacketSteps (PC-09 optional)", () => {
  it("includes meeting capture print step with anchor to print section", () => {
    const steps = buildReviewMeetingPacketSteps({
      runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      findingsQueueHref: "/architecture/reviews/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/findings",
    });

    const meetingCapture = steps.find((step) => step.id === "meeting-capture");

    expect(meetingCapture).toBeDefined();
    expect(meetingCapture?.href).toBe(
      `/architecture/reviews/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/print#${PACKAGE_PRINT_MEETING_CAPTURE_SECTION_ID}`,
    );
    expect(meetingCapture?.label).toContain("Meeting capture");
  });
});
