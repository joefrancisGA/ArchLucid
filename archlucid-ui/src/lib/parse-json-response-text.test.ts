import { describe, expect, it } from "vitest";

import { tryParseJsonResponseText } from "@/lib/parse-json-response-text";

describe("tryParseJsonResponseText", () => {
  it("returns null for empty or whitespace-only bodies", () => {
    expect(tryParseJsonResponseText("")).toBeNull();
    expect(tryParseJsonResponseText("   ")).toBeNull();
  });

  it("parses valid JSON payloads", () => {
    expect(tryParseJsonResponseText<{ hasBaselineArtifacts: boolean }>('{"hasBaselineArtifacts":false}')).toEqual({
      hasBaselineArtifacts: false,
    });
  });
});
