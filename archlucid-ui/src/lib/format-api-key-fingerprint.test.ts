import { describe, expect, it } from "vitest";

import { formatApiKeyFingerprint, formatApiKeyFingerprints } from "./format-api-key-fingerprint";

describe("formatApiKeyFingerprint", () => {
  it("formats masked suffix segments", () => {
    expect(formatApiKeyFingerprint("****cdef")).toBe("Ends in cdef");
  });

  it("falls back for unknown shapes", () => {
    expect(formatApiKeyFingerprint("***")).toBe("Configured");
  });
});

describe("formatApiKeyFingerprints", () => {
  it("returns dash when empty", () => {
    expect(formatApiKeyFingerprints([])).toBe("—");
  });

  it("joins multiple fingerprints", () => {
    expect(formatApiKeyFingerprints(["****ab12", "****cd34"])).toBe("Ends in ab12, Ends in cd34");
  });
});
