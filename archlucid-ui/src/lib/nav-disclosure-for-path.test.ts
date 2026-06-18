import { describe, expect, it } from "vitest";

import { effectiveNavDisclosureForPathname } from "./nav-disclosure-for-path";

describe("effectiveNavDisclosureForPathname", () => {
  it.each([
    "/",
    "/dashboard",
    "/onboarding",
    "/reviews/new",
    "/reviews",
    "/settings/extract-upload",
    "/graph",
    "/help",
    "/help/core-pilot",
    "/help/troubleshooting",
  ])(
    "forces essential tier on Core Pilot path %s without changing stored preference semantics at call site",
    (path) => {
      expect(effectiveNavDisclosureForPathname(path, true, true)).toEqual({
        showExtended: false,
        showAdvanced: false,
      });
    },
  );

  it("passes through flags on review detail and operate routes", () => {
    expect(effectiveNavDisclosureForPathname("/reviews/abc-123", true, true)).toEqual({
      showExtended: true,
      showAdvanced: true,
    });
    expect(effectiveNavDisclosureForPathname("/compare", false, false)).toEqual({
      showExtended: false,
      showAdvanced: false,
    });
  });
});
