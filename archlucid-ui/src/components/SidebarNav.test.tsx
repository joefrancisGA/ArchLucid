import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as corePilotCommitContext from "@/lib/core-pilot-commit-context";

import { enterpriseNavHintOperatorRank } from "@/lib/enterprise-controls-context-copy";
import { NAV_DISCLOSURE } from "@/lib/nav-disclosure-copy";
import { OPERATOR_SHELL_PRESET_STORAGE_KEY } from "@/lib/operator-nav-preset";

import { SidebarNav } from "./SidebarNav";

const { mockPathname } = vi.hoisted(() => ({
  mockPathname: vi.fn((): string => "/"),
}));

vi.mock("next/navigation", () => ({
  usePathname: (): string => mockPathname(),
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
    mockPathname.mockReturnValue("/");

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
      expect(within(nav).getByRole("link", { name: "Evidence intake" })).toHaveAttribute("href", "/reviews/new");
      expect(within(nav).getByRole("link", { name: "Evidence intake" })).toHaveAttribute(
        "title",
        "Evidence intake — start a new architecture review (guided wizard through review progress tracking) (Alt+N)",
      );
      expect(within(nav).getByRole("link", { name: "Evidence trail" })).toHaveAttribute("href", "/graph");
      expect(within(nav).getByRole("link", { name: "Review packages" })).toHaveAttribute("href", "/reviews?projectId=default");
      expect(within(nav).getByRole("link", { name: "Executive summary" })).toHaveAttribute("href", "/dashboard");

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
      expect(screen.getByRole("link", { name: "Risk register" })).toHaveAttribute("href", "/governance/findings");
      expect(screen.getByRole("link", { name: "Risk register" })).toHaveAttribute(
        "title",
        "Findings — open risks from completed reviews, severity and recommended actions (Alt+F)",
      );
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
    "exposes Analysis and Governance group navigations when Show all features is clicked",
    async () => {
      render(<SidebarNav />);

      fireEvent.click(screen.getByRole("button", { name: /Show all features/ }));

      expect(screen.queryByTestId("sidebar-nav-preset-hint")).toBeNull();
      expect(screen.queryByTestId("sidebar-show-advanced-operations-toggle")).toBeNull();

      await waitFor(() => {
        expect(screen.getByRole("navigation", { name: "Analysis" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");
      });
      expect(screen.getByRole("link", { name: "Ask this review" })).toHaveAttribute("href", "/ask");
      expect(localStorage.getItem("archlucid_nav_show_extended")).toBe("1");
      expect(localStorage.getItem("archlucid_nav_show_advanced")).toBe("1");

      fireEvent.click(screen.getByRole("button", { name: "Governance" }));

      const governanceNav = screen.getByRole("navigation", { name: "Governance" });

      expect(governanceNav).toBeInTheDocument();
      expect(within(governanceNav).getByRole("link", { name: "Alerts" })).toHaveAttribute("href", "/alerts");
      expect(within(governanceNav).getByRole("link", { name: "Audit trail" })).toHaveAttribute("href", "/audit");
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
    expect(screen.queryByText(/Search pages/i)).toBeNull();
  });

  it('reveals extended Review work links when "Show all features" is clicked without opening Sidebar layout', async () => {
    render(<SidebarNav />);

    const nav = screen.getByRole("navigation", { name: "Review work" });

    expect(within(nav).queryByRole("link", { name: "Risk register" })).toBeNull();
    expect(within(nav).queryByRole("link", { name: "Scorecard" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Show all features/ }));

    expect(screen.queryByTestId("sidebar-nav-preset-hint")).toBeNull();

    await waitFor(() => {
      expect(within(nav).getByRole("link", { name: "Risk register" })).toHaveAttribute(
        "href",
        "/governance/findings",
      );
    });
    expect(within(nav).getByRole("link", { name: "Scorecard" })).toHaveAttribute("href", "/scorecard");
    expect(localStorage.getItem("archlucid_nav_show_extended")).toBe("1");
    expect(localStorage.getItem("archlucid_nav_show_advanced")).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: "Fewer sidebar links" }));

    expect(within(nav).queryByRole("link", { name: "Risk register" })).toBeNull();
    expect(localStorage.getItem("archlucid_nav_show_extended")).toBe("0");
    expect(localStorage.getItem("archlucid_nav_show_advanced")).toBe("0");
  });

  it('reveals extended Review work links when "N more" is clicked instead of opening Sidebar layout', () => {
    mockPathname.mockReturnValue("/reviews/new");

    render(<SidebarNav />);

    const nav = screen.getByRole("navigation", { name: "Review work" });

    expect(within(nav).queryByRole("link", { name: "Risk register" })).toBeNull();
    expect(within(nav).queryByRole("link", { name: "Scorecard" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Show 2 more destinations in Review work" }));

    expect(screen.queryByRole("dialog", { name: "Sidebar layout" })).toBeNull();
    expect(within(nav).getByRole("link", { name: "Risk register" })).toHaveAttribute(
      "href",
      "/governance/findings",
    );
    expect(within(nav).getByRole("link", { name: "Scorecard" })).toHaveAttribute("href", "/scorecard");
  });
});

describe("SidebarNav pilot_operator default preset", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    mockPathname.mockReturnValue("/");
    localStorage.clear();
    vi.spyOn(corePilotCommitContext, "fetchCorePilotCommitContext").mockResolvedValue({
      hasCommittedManifest: true,
      committedReviewCount: 1,
      latestRunId: "run-1",
      firstCommittedRunId: "run-1",
      secondCommittedRunId: null,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("switches to full navigator and reveals analysis essentials when Show all features is clicked", async () => {
    render(<SidebarNav />);

    const nav = screen.getByRole("navigation", { name: "Review work" });

    expect(within(nav).queryByRole("link", { name: "Compare two reviews" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Governance workflow" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Risk register" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Show all features/ }));

    expect(localStorage.getItem(OPERATOR_SHELL_PRESET_STORAGE_KEY)).toBe("full");
    expect(localStorage.getItem("archlucid_nav_show_extended")).toBe("1");
    expect(localStorage.getItem("archlucid_nav_show_advanced")).toBe("1");
    expect(screen.queryByTestId("sidebar-nav-preset-hint")).toBeNull();
    expect(screen.queryByTestId("sidebar-show-advanced-operations-toggle")).toBeNull();
    expect(screen.getByRole("navigation", { name: "Analysis" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ask this review" })).toHaveAttribute("href", "/ask");

    await waitFor(() => {
      const analysisNav = screen.getByRole("navigation", { name: "Analysis" });

      expect(within(analysisNav).getByRole("link", { name: "Compare two reviews" })).toHaveAttribute(
        "href",
        "/compare",
      );
    });
    expect(screen.getByRole("link", { name: "Risk register" })).toHaveAttribute("href", "/governance/findings");

    fireEvent.click(screen.getByRole("button", { name: "Governance" }));

    const governanceNav = screen.getByRole("navigation", { name: "Governance" });

    expect(within(governanceNav).getByRole("link", { name: "Audit trail" })).toHaveAttribute("href", "/audit");

    fireEvent.click(screen.getByRole("button", { name: "Fewer sidebar links" }));

    expect(localStorage.getItem("archlucid_nav_show_extended")).toBe("0");
    expect(localStorage.getItem("archlucid_nav_show_advanced")).toBe("0");
    expect(screen.queryByRole("link", { name: "Risk register" })).toBeNull();
  });
});
