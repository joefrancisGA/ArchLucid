import { describe, expect, it } from "vitest";

import {
  secureNowQuestionReviewerExpirationUtcStamp,
  secureNowQuestionShowsExpired,
} from "./securenow-question-expiration";

describe("secureNowQuestionReviewerExpirationUtcStamp", () => {
  it("returns the trimmed expiration timestamp for display", () => {
    expect(secureNowQuestionReviewerExpirationUtcStamp("  2026-10-25T12:00:00.000Z  ")).toBe(
      "2026-10-25T12:00:00.000Z",
    );
  });
});

describe("secureNowQuestionShowsExpired", () => {
  const now = Date.parse("2026-10-25T12:00:00.000Z");

  it("returns true when isExpired is true", () => {
    expect(secureNowQuestionShowsExpired("2099-01-01T00:00:00.000Z", true, now)).toBe(true);
  });

  it("returns true when expirationUtc is in the past even if isExpired is false", () => {
    expect(secureNowQuestionShowsExpired("2026-10-25T11:00:00.000Z", false, now)).toBe(true);
  });

  it("returns false when expirationUtc is in the future and isExpired is false", () => {
    expect(secureNowQuestionShowsExpired("2026-10-25T13:00:00.000Z", false, now)).toBe(false);
  });

  it("returns false when expiration is missing and isExpired is null", () => {
    expect(secureNowQuestionShowsExpired(null, null, now)).toBe(false);
  });
});
