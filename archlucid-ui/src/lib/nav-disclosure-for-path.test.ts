import { describe, expect, it } from "vitest";

import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive/executive-dashboard-route";
import { effectiveNavDisclosureForPathname } from "./nav-disclosure-for-path";
import {
  NAV_DISCLOSURE,
  OPERATOR_ADVANCED_MODE,
  SHOW_ALL_DESTINATIONS,
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

  it("does not use bare destination in sidebar expand-all chrome", () => {
    const corpus = [
      SHOW_ALL_DESTINATIONS.show,
      SHOW_ALL_DESTINATIONS.hide,
      SHOW_ALL_DESTINATIONS.title,
      SIDEBAR_SHOW_ALL_FEATURES.show,
      SIDEBAR_SHOW_ALL_FEATURES.hide,
      SIDEBAR_SHOW_ALL_FEATURES.title,
    ]
      .join(" ")
      .toLowerCase();

    expect(corpus).not.toMatch(/\bdestination\b/);
  });
});

describe("effectiveNavDisclosureForPathname", () => {
  it.each([
    "/",
    EXECUTIVE_DASHBOARD_HREF,
    "/architecture/first-review-guide",
    "/architecture/reviews/new",
    "/architecture/reviews",
    "/administration/extract-upload",
    "/insights/evidence-graph",
    "/help",
    "/help/first-architecture-review",
    "/help/troubleshooting",
    "/administration",
    "/administration/tenant",
    "/administration/extract-upload",
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
    expect(effectiveNavDisclosureForPathname("/architecture/reviews/abc-123", true, true)).toEqual({
      showExtended: true,
      showAdvanced: true,
    });
    expect(effectiveNavDisclosureForPathname("/insights/compare-two-reviews", false, false)).toEqual({
      showExtended: false,
      showAdvanced: false,
    });
  });
});
