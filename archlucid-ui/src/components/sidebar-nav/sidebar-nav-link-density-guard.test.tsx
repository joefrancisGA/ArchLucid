import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SidebarNavLink } from "@/components/sidebar-nav/SidebarNavLink";
import type { NavLinkItem } from "@/lib/nav-config.types";

const sidebarNavLinkSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), "SidebarNavLink.tsx"),
  "utf8",
);

const disabledLink: NavLinkItem = {
  href: "/insights/evidence-graph",
  label: "Evidence graph",
  title: "Evidence graph",
  tier: "extended",
  navLinkDisabled: true,
  navLinkDisabledTitle: "Open an architecture identity desk first.",
};

describe("sidebar nav link density guard (ADR 0081)", () => {
  it("SidebarNavLink source does not render visible disabled-reason sub-labels", () => {
    expect(sidebarNavLinkSource).not.toMatch(/navLinkDisabledReason/);
    expect(sidebarNavLinkSource).not.toMatch(/sidebar-nav-link-disabled-reason/);
    expect(sidebarNavLinkSource).not.toMatch(/navLinkDisabledVisibleHint/);
  });

  it("disabled nav rows expose gate copy only in sr-only supplemental hints", () => {
    render(
      <SidebarNavLink
        presented={disabledLink}
        active={false}
        advancedDemo={false}
        buyerPolishedShell
      />,
    );

    expect(screen.getByText("Evidence graph")).toBeInTheDocument();
    expect(screen.getByText("Open an architecture identity desk first.")).toHaveClass("sr-only");
    expect(document.getElementById("sidebar-nav-link-hint--insights-evidence-graph")).toHaveClass("sr-only");
  });
});
