import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { enterpriseNavHintOperatorRank } from "@/lib/enterprise-controls-context-copy";

import { SidebarNav } from "./SidebarNav";

const { mockPathname } = vi.hoisted(() => ({
  mockPathname: vi.fn((): string => "/"),
}));

const buyerPolishedMock = vi.hoisted(() => ({ value: false }));

vi.mock("next/navigation", () => ({
  usePathname: (): string => mockPathname(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
  };
});

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
    buyerPolishedMock.value = false;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    mockPathname.mockReturnValue("/");

    // Progressive disclosure persists `archlucid_nav_show_extended` in localStorage; clear so tests
    // do not inherit extended disclosure state from a prior case in the same file.
    localStorage.clear();
  });

  it(
    "shows compact Review work group by default; per-group disclosure can reveal extended Analysis links",
    async () => {
      render(<SidebarNav />);

      const nav = screen.getByRole("navigation", { name: "Review work" });
      expect(nav).toBeInTheDocument();

      // Scope essentials to Review work — Start review lives in that group only (TB-345: no sidebar journey duplicate).
      const homeLink = within(nav).getByRole("link", { name: "Home" });
      expect(homeLink).toHaveAttribute("href", "/");
      expect(homeLink).toHaveAttribute("aria-current", "page");
      expect(within(nav).getByRole("link", { name: "Start review" })).toHaveAttribute("href", "/reviews/new");
      expect(within(nav).getByRole("link", { name: "Start review" })).toHaveAttribute(
        "title",
        "Start review — Quick review, Guided intake, or full wizard (Alt+N)",
      );
      expect(within(nav).getByRole("link", { name: "Evidence trail" })).toHaveAttribute("href", "/graph");
      expect(within(nav).getByRole("link", { name: "Review packages" })).toHaveAttribute("href", "/reviews?projectId=default");
      expect(within(nav).getByRole("link", { name: "Portfolio overview" })).toHaveAttribute("href", "/dashboard");
      expect(within(nav).getByRole("link", { name: "Onboarding" })).toHaveAttribute("href", "/onboarding");
      expect(within(nav).queryByRole("link", { name: "ROI baselines" })).toBeNull();

      expect(within(nav).queryByRole("link", { name: "Compare two reviews" })).toBeNull();
      expect(within(nav).queryByRole("link", { name: "Replay a review" })).toBeNull();

      fireEvent.click(screen.getByRole("button", { name: /Show \d+ more destinations in Review work/ }));

      await waitFor(() => {
        expect(screen.getByRole("navigation", { name: "Analysis" })).toBeInTheDocument();
      });

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
    "exposes Analysis when Review work disclosure expands and Governance only after governance disclosure",
    async () => {
      render(<SidebarNav />);

      fireEvent.click(screen.getByRole("button", { name: /Show \d+ more destinations in Review work/ }));

      await waitFor(() => {
        expect(screen.getByRole("navigation", { name: "Analysis" })).toBeInTheDocument();
        expect(screen.getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");
      });
      expect(screen.getByRole("link", { name: "Ask this review" })).toHaveAttribute("href", "/ask");
      expect(localStorage.getItem("archlucid_nav_show_extended")).toBe("1");
      expect(screen.queryByRole("navigation", { name: "Governance" })).toBeNull();
      expect(screen.queryByRole("link", { name: "Alerts" })).toBeNull();

      fireEvent.click(screen.getByTestId("sidebar-governance-disclosure-toggle"));

      await waitFor(() => {
        const governanceNav = screen.getByRole("navigation", { name: "Governance" });

        expect(governanceNav).toBeInTheDocument();
        expect(within(governanceNav).getByRole("link", { name: "Alerts" })).toHaveAttribute("href", "/alerts");
        expect(within(governanceNav).getByRole("link", { name: "Audit trail" })).toHaveAttribute("href", "/audit");
      });
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

  it("does not show sidebar pin customization in V1", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("nav-pinned-links-panel")).toBeNull();
    expect(screen.queryByText("Pinned")).toBeNull();
    expect(screen.queryByRole("button", { name: "Pin page" })).toBeNull();
    expect(screen.queryByText("Pin frequently used pages for quick access.")).toBeNull();
    expect(screen.queryByRole("button", { name: /Pin / })).toBeNull();
  });

  it("does not show V1 sidebar customization controls on the home sidebar", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("nav-advanced-unlock")).toBeNull();
    expect(screen.queryByRole("button", { name: "Sidebar layout" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Fewer sidebar links" })).toBeNull();
    expect(screen.queryByRole("button", { name: /Show governance & analysis tools/ })).toBeNull();
    expect(screen.queryByTestId("sidebar-layout-settings-dialog")).toBeNull();
    expect(screen.queryByTestId("sidebar-operator-advanced-mode-toggle")).toBeNull();
    expect(screen.queryByText("Enable advanced features")).toBeNull();
    const adminToggle = screen.getByTestId("sidebar-administration-toggle");
    expect(adminToggle).toHaveTextContent("Administration");
    expect(adminToggle.textContent?.trim()).toBe("Administration");
    expect(adminToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText("Show administration")).toBeNull();
    expect(screen.queryByTestId("sidebar-administration-section")).toBeNull();
  });

  it("uses chevron Administration disclosure and omits child-count badges on the section heading", async () => {
    render(<SidebarNav />);

    fireEvent.click(screen.getByTestId("sidebar-administration-toggle"));

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-administration-section")).toBeInTheDocument();
    });

    const heading = screen.getByTestId("sidebar-administration-toggle");

    expect(heading).toHaveTextContent("Administration");
    expect(heading.textContent?.trim()).toBe("Administration");
    expect(heading).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText("Show administration")).toBeNull();
    expect(screen.queryByText("Hide administration")).toBeNull();
    expect(screen.queryByText("Admin tools")).toBeNull();

    expect(heading.textContent).not.toMatch(/\b2\b/);
    expect(screen.queryByRole("button", { name: /Show \d+ more destinations in Admin tools/ })).toBeNull();
  });

  it("reveals Analysis and Governance destinations when governance disclosure is enabled", async () => {
    render(<SidebarNav />);

    fireEvent.click(screen.getByTestId("sidebar-governance-disclosure-toggle"));

    await waitFor(() => {
      expect(screen.getByRole("link", { name: "Compare two reviews" })).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: "Governance" })).toBeInTheDocument();
    });

    expect(localStorage.getItem("archlucid_nav_show_extended")).toBe("1");
    expect(localStorage.getItem("archlucid_nav_show_advanced")).toBe("1");
    expect(localStorage.getItem("archlucid-nav-expanded")).toBe("true");
    expect(localStorage.getItem("archlucid.operateNavUnlockPhase.v1")).toBe("2");
  });

  it("does not render collapsible triggers for review-workflow nav groups", () => {
    render(<SidebarNav />);

    expect(screen.queryByRole("button", { name: /^Review work$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Analysis$/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Governance$/i })).toBeNull();
    expect(screen.getByText("Review work")).toBeInTheDocument();
  });

  it("does not duplicate the numbered first-hour journey strip in the sidebar (TB-345)", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("sidebar-quick-actions")).not.toBeInTheDocument();
    expect(screen.queryByText("First-hour path")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "First-hour path" })).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Review journey" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /1\.\s*New architecture request/i })).not.toBeInTheDocument();
  });

  it('reveals extended Review work links when "N more" is clicked in Review work', async () => {
    render(<SidebarNav />);

    const nav = screen.getByRole("navigation", { name: "Review work" });

    expect(within(nav).queryByRole("link", { name: "Risk register" })).toBeNull();
    expect(within(nav).queryByRole("link", { name: "Scorecard" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Show \d+ more destinations in Review work/ }));

    await waitFor(() => {
      expect(within(nav).getByRole("link", { name: "Risk register" })).toHaveAttribute(
        "href",
        "/governance/findings",
      );
    });
    expect(within(nav).getByRole("link", { name: "Scorecard" })).toHaveAttribute("href", "/scorecard");
    expect(localStorage.getItem("archlucid_nav_show_extended")).toBe("1");
  });

  it('reveals extended Review work links when "N more" is clicked instead of opening Sidebar layout', () => {
    mockPathname.mockReturnValue("/reviews/new");

    render(<SidebarNav />);

    const nav = screen.getByRole("navigation", { name: "Review work" });

    expect(within(nav).queryByRole("link", { name: "Risk register" })).toBeNull();
    expect(within(nav).queryByRole("link", { name: "Scorecard" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Show \d+ more destinations in Review work/ }));

    expect(screen.queryByRole("dialog", { name: "Sidebar layout" })).toBeNull();
    expect(within(nav).getByRole("link", { name: "Risk register" })).toHaveAttribute(
      "href",
      "/governance/findings",
    );
    expect(within(nav).getByRole("link", { name: "Risk exceptions" })).toHaveAttribute(
      "href",
      "/governance/risk-exceptions",
    );
    expect(within(nav).getByRole("link", { name: "Scorecard" })).toHaveAttribute("href", "/scorecard");
  });
});

describe("SidebarNav progressive disclosure without navigation presets", () => {
  beforeEach(() => {
    buyerPolishedMock.value = false;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("reveals analysis essentials when Review work disclosure expands", async () => {
    render(<SidebarNav />);

    const nav = screen.getByRole("navigation", { name: "Review work" });

    expect(within(nav).queryByRole("link", { name: "Compare two reviews" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Governance workflow" })).toBeNull();
    expect(screen.queryByRole("link", { name: "Risk register" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Governance" })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: /Show \d+ more destinations in Review work/ }));

    expect(localStorage.getItem("archlucid_nav_show_extended")).toBe("1");
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
    expect(screen.queryByRole("navigation", { name: "Governance" })).toBeNull();
  });
});

describe("SidebarNav buyer-polished desktop shell", () => {
  beforeEach(() => {
    buyerPolishedMock.value = true;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("keeps label-based review nav visible without a collapsible group trigger", () => {
    render(<SidebarNav />);

    expect(screen.queryByRole("button", { name: /Review work/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /^Reviews$/i })).toBeNull();
    expect(screen.getByText("Reviews")).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Review work" });
    const homeLink = within(nav).getByRole("link", { name: "Home" });
    expect(homeLink).toHaveAttribute("href", "/");
    expect(homeLink).toHaveAttribute("aria-current", "page");
    expect(within(nav).getByRole("link", { name: "New review" })).toHaveAttribute("href", "/reviews/new");
    expect(within(nav).getByRole("link", { name: "Evidence trail" })).toHaveAttribute("href", "/graph");
    expect(within(nav).getByRole("link", { name: "Review packages" })).toHaveAttribute(
      "href",
      "/reviews?projectId=default",
    );
    expect(within(nav).getByRole("link", { name: "Portfolio overview" })).toHaveAttribute("href", "/dashboard");
    expect(within(nav).getByRole("link", { name: "Onboarding" })).toHaveAttribute("href", "/onboarding");
  });

  it("does not show Help in the sidebar — help is top-bar only", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("sidebar-buyer-help-link")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Help" })).not.toBeInTheDocument();
  });

  it("does not duplicate the numbered review journey strip in the sidebar (TB-345)", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("sidebar-quick-actions")).not.toBeInTheDocument();
    expect(screen.queryByText("Review journey")).not.toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Review journey" })).not.toBeInTheDocument();
  });
});
