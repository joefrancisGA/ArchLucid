import { describe, expect, it } from "vitest";

import { formatSignedRecordArtifactGeneratedTimestamp } from "./signed-record-artifact-generated-timestamp";

describe("formatSignedRecordArtifactGeneratedTimestamp", () => {
  it("returns ISO dateTime and display label for valid UTC input", () => {
    const formatted = formatSignedRecordArtifactGeneratedTimestamp("2026-07-01T12:00:00.000Z");

    expect(formatted).not.toBeNull();
    expect(formatted?.dateTime).toBe("2026-07-01T12:00:00.000Z");
    expect(formatted?.display.length).toBeGreaterThan(0);
  });

  it("returns null for empty input", () => {
    expect(formatSignedRecordArtifactGeneratedTimestamp("")).toBeNull();
  });
});
