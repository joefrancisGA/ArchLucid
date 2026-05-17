import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { enterpriseNavHintOperatorRank } from "@/lib/enterprise-controls-context-copy";
import { NAV_DISCLOSURE } from "@/lib/nav-disclosure-copy";
import { OPERATOR_SHELL_PRESET_STORAGE_KEY } from "@/lib/operator-nav-preset";

import { SidebarNav } from "./SidebarNav";

vi.mock("next/navigation", () => ({
  usePathname: (): string => "/",
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    title,
    className,
    ...rest
  }: {
    href: string;
    children: import("react").ReactNode;
    title?: string;
    className?: string;
  } & Record<string, unknown>) => (
    <a href={href} title={title} className={className} {...rest}>
      {children}
    </a>
  ),
}));

describe("SidebarNav (primary navigation)", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";

    // Progressive disclosure persists `archlucid_nav_show_extended` in localStorage; clear so tests
    // do not inherit extended disclosure state from a prior case in the same file.
    localStorage.clear();

    // Default shell preset is pilot_operator (narrow route list). These tests assert extended analysis
    // links (Evidence trail, Compare, …) after disclosure toggles — mirror "Full navigator" so those hrefs are not preset-pruned.
    localStorage.setItem(OPERATOR_SHELL_PRESET_STORAGE_KEY, "full");
  });

  it(
    "shows compact Review work group by default; sidebar layout can reveal extended Analysis links",
    () => {
      render(<SidebarNav />);

      const nav = screen.getByRole("navigation", { name: "Review work" });
      expect(nav).toBeInTheDocument();

      // Capture also appears under Quick actions (`/reviews/new`); scope essentials to this group.
      const homeLink = within(nav).getByRole("link", { name: "Home" });
      expect(homeLink).toHaveAttribute("href", "/");
      expect(homeLink).toHaveAttribute("aria-current", "page");
      expect(within(nav).getByRole("link", { name: "Capture" })).toHaveAttribute("href", "/reviews/new");
      expect(within(nav).getByRole("link", { name: "Capture" })).toHaveAttribute(
        "title",
        "Capture — start a new architecture review (guided wizard through pipeline tracking) (Alt+N)",
      );
      expect(within(nav).getByRole("link", { name: "Evidence trail" })).toHaveAttribute("href", "/graph");
      expect(within(nav).getByRole("link", { name: "Review package" })).toHaveAttribute("href", "/reviews?projectId=default");
      expect(within(nav).getByRole("link", { name: "Executive report" })).toHaveAttribute("href", "/dashboard");

      expect(within(nav).queryByRole("link", { name: "Compare two reviews" })).toBeNull();
      expect(within(nav).queryByRole("link", { name: "Replay a review" })).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: "Sidebar layout" }));
      fireEvent.click(screen.getByRole("checkbox", { name: NAV_DISCLOSURE.extended.show }));
      fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

      fireEvent.click(screen.getByRole("button", { name: /Show all features/ }));

      expect(screen.getByRole("link", { name: "Evidence trail" })).toHaveAttribute("href", "/graph");
      expect(screen.getByRole("link", { name: "Evidence trail" })).toHaveAttribute(
        "title",
        "Evidence trail — decision traceability graph for one review (Alt+Y)",
      );
      expect(screen.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");
      expect(screen.getByRole("link", { name: "Replay a review" })).toHaveAttribute("href", "/replay");
      expect(screen.getByRole("link", { name: "Findings" })).toHaveAttribute("href", "/governance/findings");
      expect(screen.getByRole("link", { name: "Scorecard" })).toHaveAttribute("href", "/scorecard");

      const linksWithKeyShortcuts = screen
        .getAllByRole("link")
        .filter((link) => {
          const value = link.getAttribute("aria-keyshortcuts");

          return value !== null && value !== "";
        });
      expect(linksWithKeyShortcuts.length).toBeGreaterThanOrEqual(2);
    },
    30_000,
  );

  it(
    "exposes Analysis and Governance group navigations when sections are expanded",
    () => {
      render(<SidebarNav />);

      fireEvent.click(screen.getByRole("button", { name: "Sidebar layout" }));
      fireEvent.click(screen.getByRole("checkbox", { name: NAV_DISCLOSURE.extended.show }));
      fireEvent.click(screen.getByRole("button", { name: "Close dialog" }));

      fireEvent.click(screen.getByRole("button", { name: /Show all features/ }));

      expect(screen.getByRole("navigation", { name: "Analysis" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Ask this review" })).toHaveAttribute("href", "/ask");

      fireEvent.click(screen.getByRole("button", { name: "Governance" }));

      const governanceNavCollapsedAdvanced = screen.getByRole("navigation", { name: "Governance" });

      expect(governanceNavCollapsedAdvanced).toBeInTheDocument();
      expect(within(governanceNavCollapsedAdvanced).queryByRole("link", { name: "Alerts" })).toBeNull();
      expect(within(governanceNavCollapsedAdvanced).queryByRole("link", { name: "Audit log" })).toBeNull();
      expect(within(governanceNavCollapsedAdvanced).queryByRole("link", { name: "Governance workflow" })).toBeNull();

      fireEvent.click(screen.getByTestId("sidebar-show-advanced-operations-toggle"));

      const governanceNav = screen.getByRole("navigation", { name: "Governance" });
      expect(governanceNav).toBeInTheDocument();
      expect(within(governanceNav).getByRole("link", { name: "Alerts" })).toHaveAttribute("href", "/alerts");
      expect(screen.getByRole("button", { name: "Governance" })).toHaveAttribute(
        "title",
        "Policy, audit, alerts, and trust controls.",
      );
      expect(screen.getByText(enterpriseNavHintOperatorRank)).toBeInTheDocument();

      expect(screen.getByRole("link", { name: "Governance workflow" })).toHaveAttribute("href", "/governance");
    },
    30_000,
  );

  it("does not show a footer keyboard-shortcut hint in the sidebar", () => {
    render(<SidebarNav />);

    expect(screen.queryByText("Press Shift+? for help and keyboard shortcuts")).toBeNull();
  });
});
