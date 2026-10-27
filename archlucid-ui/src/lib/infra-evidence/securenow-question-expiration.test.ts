import { describe, expect, it } from "vitest";

import {
  secureNowQuestionDispositionPostExpirationContradicts,
  secureNowQuestionDispositionPostExpirationFailsClosedStatusGate,
  secureNowQuestionDispositionPostExpirationTimestampUnparsable,
  secureNowQuestionDispositionPostExpirationUnderReports,
  secureNowQuestionReviewerExpirationDisplayLine,
  secureNowQuestionReviewerExpirationUtcStamp,
  secureNowQuestionShowsExpired,
} from "./securenow-question-expiration";

describe("secureNowQuestionReviewerExpirationUtcStamp", () => {
  it("returns the trimmed expiration timestamp for display", () => {
    expect(secureNowQuestionReviewerExpirationUtcStamp("  2026-10-25T12:00:00.000Z  ")).toBe(
      "2026-10-25T12:00:00.000Z",
    );
  });

  it("returns null for unparsable expiration timestamps", () => {
    expect(secureNowQuestionReviewerExpirationUtcStamp("not-a-date")).toBeNull();
  });
});

describe("secureNowQuestionReviewerExpirationDisplayLine", () => {
  it("labels unparsable expiration without echoing raw input", () => {
    expect(secureNowQuestionReviewerExpirationDisplayLine("not-a-date")).toBe(
      "Expiration was not a readable time.",
    );
  });
});

describe("secureNowQuestionDispositionPostExpirationContradicts", () => {
  const now = Date.parse("2026-10-25T12:00:00.000Z");

  it("returns false when isExpired is false", () => {
    expect(
      secureNowQuestionDispositionPostExpirationContradicts(
        "2099-01-01T00:00:00.000Z",
        false,
        now,
      ),
    ).toBe(false);
  });

  it("returns true when isExpired is true and expiration is in the future", () => {
    expect(
      secureNowQuestionDispositionPostExpirationContradicts(
        "2099-01-01T00:00:00.000Z",
        true,
        now,
      ),
    ).toBe(true);
  });

  it("returns false when isExpired is true and expiration is in the past", () => {
    expect(
      secureNowQuestionDispositionPostExpirationContradicts(
        "2026-10-25T11:00:00.000Z",
        true,
        now,
      ),
    ).toBe(false);
  });

  it("returns true when isExpired is true but expiration is blank after trim", () => {
    expect(secureNowQuestionDispositionPostExpirationContradicts("   ", true, now)).toBe(true);
  });
});

describe("secureNowQuestionDispositionPostExpirationTimestampUnparsable", () => {
  it("returns false for blank expiration after trim", () => {
    expect(secureNowQuestionDispositionPostExpirationTimestampUnparsable("   ")).toBe(false);
  });

  it("returns true when expiration does not parse", () => {
    expect(secureNowQuestionDispositionPostExpirationTimestampUnparsable("not-a-date")).toBe(true);
  });

  it("returns false for a valid ISO timestamp", () => {
    expect(
      secureNowQuestionDispositionPostExpirationTimestampUnparsable("2026-12-01T00:00:00.000Z"),
    ).toBe(false);
  });
});

describe("secureNowQuestionDispositionPostExpirationFailsClosedStatusGate", () => {
  const now = Date.parse("2026-10-25T12:00:00.000Z");

  it("returns true when expiration is unparsable", () => {
    expect(
      secureNowQuestionDispositionPostExpirationFailsClosedStatusGate("not-a-date", false, now),
    ).toBe(true);
  });
});

describe("secureNowQuestionDispositionPostExpirationUnderReports", () => {
  const now = Date.parse("2026-10-25T12:00:00.000Z");

  it("returns true when isExpired is false and expiration is in the past", () => {
    expect(
      secureNowQuestionDispositionPostExpirationUnderReports(
        "2026-10-25T11:00:00.000Z",
        false,
        now,
      ),
    ).toBe(true);
  });

  it("returns false when isExpired is false and expiration is in the future", () => {
    expect(
      secureNowQuestionDispositionPostExpirationUnderReports(
        "2099-01-01T00:00:00.000Z",
        false,
        now,
      ),
    ).toBe(false);
  });

  it("returns false when isExpired is true", () => {
    expect(
      secureNowQuestionDispositionPostExpirationUnderReports(
        "2026-10-25T11:00:00.000Z",
        true,
        now,
      ),
    ).toBe(false);
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
