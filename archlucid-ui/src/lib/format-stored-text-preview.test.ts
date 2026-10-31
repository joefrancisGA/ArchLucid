import { describe, expect, it } from "vitest";

import { formatStoredTextPreview } from "./format-stored-text-preview";

describe("formatStoredTextPreview", () => {
  it("returns trimmed text when under the cap", () => {
    expect(formatStoredTextPreview("hello", 10, "note")).toBe("hello");
  });

  it("appends continuation honesty when text exceeds the cap", () => {
    expect(formatStoredTextPreview("abcdefghij", 5, "Full text was stored.")).toBe(
      "abcd… (Full text was stored.)",
    );
  });
});
