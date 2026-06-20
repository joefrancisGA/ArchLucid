import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarAdministrationSection } from "./SidebarAdministrationSection";
import { SIDEBAR_ADMINISTRATION } from "@/lib/nav-disclosure-copy";
import type { NavGroupWithVisibleLinks } from "@/lib/nav-shell-visibility";

vi.mock("@/components/sidebar-nav/SidebarNavLink", () => ({
  SidebarNavLink: ({ presented }: { presented: { href: string; label: string } }) => (
    <a href={presented.href}>{presented.label}</a>
  ),
}));

const adminRows: NavGroupWithVisibleLinks[] = [
  {
    group: {
      id: "operator-admin",
      label: "Admin tools",
      surface: "platform-admin",
      caption: "Tenant admin",
      links: [],
    },
    visibleLinks: [
      {
        href: "/settings/tenant",
        label: "Tenant settings",
        title: "Tenant settings",
        tier: "extended",
      },
    ],
  },
];

describe("SidebarAdministrationSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows Administration with Show administration on the same row when collapsed", () => {
    render(
      <SidebarAdministrationSection
        showAdministration={false}
        onShowAdministrationChange={vi.fn()}
        adminNavRows={adminRows}
        pathname="/"
        demoUi={false}
        buyerPolishedShell={false}
        hasCommittedArchitectureReview={false}
        effectiveOperateUnlockPhase={1}
      />,
    );

    const toggle = screen.getByTestId("sidebar-administration-toggle");

    expect(toggle).toHaveTextContent("Administration");
    expect(toggle).toHaveTextContent(SIDEBAR_ADMINISTRATION.show);
    expect(screen.getByTestId("sidebar-administration-collapsed")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Tenant settings" })).toBeNull();
    expect(screen.queryByText("Admin tools")).toBeNull();
  });

  it("shows Administration with Hide administration and flat links when expanded", () => {
    render(
      <SidebarAdministrationSection
        showAdministration
        onShowAdministrationChange={vi.fn()}
        adminNavRows={adminRows}
        pathname="/"
        demoUi={false}
        buyerPolishedShell={false}
        hasCommittedArchitectureReview={false}
        effectiveOperateUnlockPhase={1}
      />,
    );

    const toggle = screen.getByTestId("sidebar-administration-toggle");

    expect(toggle).toHaveTextContent(SIDEBAR_ADMINISTRATION.hide);
    expect(screen.getByTestId("sidebar-administration-section")).toBeInTheDocument();
    expect(toggle.textContent).not.toMatch(/\b2\b/);
    expect(screen.getByRole("link", { name: "Tenant settings" })).toHaveAttribute("href", "/settings/tenant");
    expect(screen.queryByText("Admin tools")).toBeNull();
  });

  it("calls onShowAdministrationChange when toggled", () => {
    const onShowAdministrationChange = vi.fn();

    render(
      <SidebarAdministrationSection
        showAdministration={false}
        onShowAdministrationChange={onShowAdministrationChange}
        adminNavRows={adminRows}
        pathname="/"
        demoUi={false}
        buyerPolishedShell={false}
        hasCommittedArchitectureReview={false}
        effectiveOperateUnlockPhase={1}
      />,
    );

    fireEvent.click(screen.getByTestId("sidebar-administration-toggle"));

    expect(onShowAdministrationChange).toHaveBeenCalledWith(true);
  });
});
