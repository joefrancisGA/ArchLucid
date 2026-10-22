import { describe, expect, it } from "vitest";

import { NAV_GROUPS } from "@/lib/nav-config";
import { filterNavGroupsForProductLine } from "@/lib/product-line/filter-nav-groups-for-product-line";
import type { ProductLineNavGroupRow } from "@/lib/product-line/filter-nav-groups-for-product-line";
import type { NavLinkItem } from "@/lib/nav-config.types";
import { applySecureNowEditionNavOverlay } from "@/lib/editions/securenow-edition-nav-overlay";

const testLink = (href: string, label: string): NavLinkItem => ({
  href,
  label,
  title: label,
  tier: "extended",
});

describe("SecureNow edition navigation overlay", () => {
  it("inserts edition groups before Administration and filters non-SecureNow links", () => {
    const overlay = () => {
      const link = testLink("/security/uhg/kubernetes", "Kubernetes");

      return [
        {
          group: {
            id: "uhg-kubernetes",
            label: "Kubernetes",
            surface: "review-workflow",
            links: [link],
          },
          visibleLinks: [link],
        },
      ] satisfies readonly ProductLineNavGroupRow[];
    };

    const rows = filterNavGroupsForProductLine(
      NAV_GROUPS.map((group) => ({ group, visibleLinks: group.links })),
      "security",
      {
        assignmentOverrides: { "/security/uhg/kubernetes": "security" },
        editionNavOverlay: overlay,
      },
    );
    const overlayIndex = rows.findIndex((row) => row.group.id === "uhg-kubernetes");
    const administrationIndex = rows.findIndex((row) => row.group.id === "operator-admin");

    expect(overlayIndex).toBeGreaterThan(-1);
    expect(overlayIndex).toBeLessThan(administrationIndex);
  });

  it("keeps the Architecture shell unchanged when no SecureNow edition is active", () => {
    const rows = filterNavGroupsForProductLine(
      NAV_GROUPS.map((group) => ({ group, visibleLinks: group.links })),
      "architecture",
      { editionNavOverlay: () => [] },
    );

    expect(rows.some((row) => row.group.id === "uhg-kubernetes")).toBe(false);
  });
});
