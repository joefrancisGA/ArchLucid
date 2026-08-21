import { describe, expect, it } from "vitest";

import { formatWhyPageInstant } from "@/app/(operator)/why-archlucid/_sections/why-archlucid-page-helpers";

describe("formatWhyPageInstant", () => {
  it("formats ISO instants for sponsor-readable display", () => {
    const formatted = formatWhyPageInstant("2026-04-20T12:00:00.000Z");

    expect(formatted).toContain("2026");
    expect(formatted).toContain("UTC");
    expect(formatted).not.toContain("T12:00:00");
  });

  it("returns em dash for empty input", () => {
    expect(formatWhyPageInstant(null)).toBe(" — ");
    expect(formatWhyPageInstant("")).toBe(" — ");
  });
});
