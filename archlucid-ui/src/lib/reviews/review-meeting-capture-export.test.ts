import { describe, expect, it } from "vitest";

import {
  PACKAGE_PRINT_MEETING_CAPTURE_HEADING,
  REVIEW_MEETING_CAPTURE_DISCLAIMER,
  buildReviewMeetingCaptureEntries,
  formatReviewMeetingCapturePlainText,
  presenterAssertedQuestionLabel,
  resolveReviewMeetingCaptureEntries,
} from "@/lib/reviews/review-meeting-capture-export";

describe("review-meeting-capture-export (PC-09 optional)", () => {
  it("exposes stable copy and heading", () => {
    expect(PACKAGE_PRINT_MEETING_CAPTURE_HEADING).toBe("Room answers on record");
    expect(REVIEW_MEETING_CAPTURE_DISCLAIMER.toLowerCase()).toContain("not a sealed record");
  });

  it("strips answer. prefix from question keys", () => {
    expect(presenterAssertedQuestionLabel("answer.latency-slo")).toBe("latency-slo");
    expect(presenterAssertedQuestionLabel("businessOutcome")).toBe("businessOutcome");
  });

  it("builds capture entries with responder and timestamp labels", () => {
    const entries = buildReviewMeetingCaptureEntries([
      {
        key: "answer.encryption-at-rest",
        value: "Yes",
        responderLabel: "Room",
        recordedUtc: "2026-08-01T12:00:00Z",
      },
    ]);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.questionLabel).toBe("encryption-at-rest");
    expect(entries[0]?.answer).toBe("Yes");
    expect(entries[0]?.responderLabel).toBe("Room");
    expect(entries[0]?.recordedAtLabel).toBeTruthy();
  });

  it("filters presenter answers from transparency trail", () => {
    const entries = resolveReviewMeetingCaptureEntries({
      asserted: [
        { key: "businessOutcome", value: "Reduce latency" },
        { key: "answer.latency", value: "No", responderLabel: "Room" },
      ],
      inferred: [],
      skipped: [],
    });

    expect(entries).toHaveLength(1);
    expect(entries[0]?.questionLabel).toBe("latency");
  });

  it("formats plain text with disclaimer and Q&A blocks", () => {
    const text = formatReviewMeetingCapturePlainText([
      {
        questionLabel: "latency",
        answer: "Yes",
        responderLabel: "Room",
        recordedAtLabel: "Aug 1, 2026",
      },
    ]);

    expect(text).toContain(REVIEW_MEETING_CAPTURE_DISCLAIMER);
    expect(text).toContain("Q: latency");
    expect(text).toContain("A: Yes");
    expect(text).toContain("Room");
  });

  it("returns empty plain text when there are no entries", () => {
    expect(formatReviewMeetingCapturePlainText([])).toBe("");
  });
});
