import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import { listNavGroupsVisibleInOperatorShell } from "@/lib/nav-shell-visibility";
import { NAV_GROUPS } from "@/lib/nav-config";
import { createOperatorNavAuthorityVitestMock } from "@/testing/operator-nav-authority-vitest-mock";

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({
    productLine: "security",
    assignmentOverrides: {},
    setProductLine: () => {},
    setHrefAssignment: () => {},
    resetHrefAssignment: () => {},
    resetAllAssignments: () => {},
  }),
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () =>
  createOperatorNavAuthorityVitestMock({ callerAuthorityRank: AUTHORITY_RANK.AdminAuthority }),
);

import { SecurityProductHome } from "@/components/product-line/SecurityProductHome";

describe("SecurityProductHome", () => {
  it("renders destination labels without helper title text", () => {
    render(<SecurityProductHome />);

    const destinations = listNavGroupsVisibleInOperatorShell(
      NAV_GROUPS,
      AUTHORITY_RANK.AdminAuthority,
      "all",
      false,
      false,
      { productLine: "security", showVendorInternalNav: false },
    )
      .flatMap((row) => row.visibleLinks)
      .filter((link) => link.href !== "/");

    expect(destinations.length).toBeGreaterThan(0);

    for (const link of destinations) {
      expect(screen.getByRole("link", { name: link.label })).toBeInTheDocument();

      if (link.title !== undefined && link.title !== link.label) {
        expect(screen.queryByText(link.title)).not.toBeInTheDocument();
      }
    }
  });
});
