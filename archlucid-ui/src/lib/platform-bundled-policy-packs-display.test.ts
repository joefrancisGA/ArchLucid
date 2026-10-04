import { describe, expect, it } from "vitest";

import { formatPlatformBundledPolicyPackUtc } from "@/lib/platform-bundled-policy-packs-display";

describe("formatPlatformBundledPolicyPackUtc", () => {
  it("labels missing and unreadable timestamps", () => {
    expect(formatPlatformBundledPolicyPackUtc(null)).toBe("Not published");
    expect(formatPlatformBundledPolicyPackUtc("not-a-date")).toBe("Date not readable");
  });
});
