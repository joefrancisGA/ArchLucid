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
        href: "/administration/workspace-settings",
        label: "Settings",
        title: "Workspace settings",
        tier: "extended",
      },
      {
        href: "/administration/workspace-settings/recycle-bin",
        label: "Projects recycle bin",
        title: "Projects recycle bin",
        tier: "extended",
      },
    ],
  },
];

describe("SidebarAdministrationSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows a chevron disclosure row with Administration only when collapsed", () => {
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
    expect(toggle.textContent?.trim()).toBe("Administration");
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-label", SIDEBAR_ADMINISTRATION.ariaCollapsed);
    expect(screen.queryByText("Show administration")).toBeNull();
    expect(screen.queryByText("Hide administration")).toBeNull();
    expect(screen.getByTestId("sidebar-administration-collapsed")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Settings" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Projects recycle bin" })).toBeNull();
    expect(screen.queryByText("Admin tools")).toBeNull();
  });

  it("shows child links and keeps the disclosure label compact when expanded", () => {
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

    expect(toggle).toHaveTextContent("Administration");
    expect(toggle.textContent?.trim()).toBe("Administration");
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(toggle).toHaveAttribute("aria-label", SIDEBAR_ADMINISTRATION.ariaExpanded);
    expect(screen.queryByText("Show administration")).toBeNull();
    expect(screen.queryByText("Hide administration")).toBeNull();
    expect(screen.getByTestId("sidebar-administration-section")).toBeInTheDocument();
    expect(toggle.textContent).not.toMatch(/\b2\b/);
    expect(screen.getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/administration/workspace-settings");
    expect(screen.getByRole("link", { name: "Projects recycle bin" })).toHaveAttribute(
      "href",
      "/administration/workspace-settings/recycle-bin",
    );
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
