import { describe, expect, it } from "vitest";

import { effectiveNavDisclosureForPathname } from "./nav-disclosure-for-path";
import {
  NAV_DISCLOSURE,
  OPERATOR_ADVANCED_MODE,
  SIDEBAR_ADMINISTRATION,
  SIDEBAR_SHOW_ALL_FEATURES,
} from "./nav-disclosure-copy";

function collectNavDisclosureCopyStrings(value: unknown): string[] {
  if (typeof value === "string") {
    return [value];
  }

  if (value === null || typeof value !== "object") {
    return [];
  }

  return Object.values(value).flatMap((entry) => collectNavDisclosureCopyStrings(entry));
}

describe("nav disclosure copy", () => {
  it("does not use operator persona in sidebar disclosure labels", () => {
    const corpus = [
      ...collectNavDisclosureCopyStrings(SIDEBAR_SHOW_ALL_FEATURES),
      ...collectNavDisclosureCopyStrings(SIDEBAR_ADMINISTRATION),
      ...collectNavDisclosureCopyStrings(OPERATOR_ADVANCED_MODE),
      ...collectNavDisclosureCopyStrings(NAV_DISCLOSURE),
    ]
      .join(" ")
      .toLowerCase();

    expect(corpus).not.toMatch(/\boperator\b/);
  });
});

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
    "/help/first-architecture-review",
    "/help/troubleshooting",
    "/settings",
    "/settings/tenant",
    "/settings/extract-upload",
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
