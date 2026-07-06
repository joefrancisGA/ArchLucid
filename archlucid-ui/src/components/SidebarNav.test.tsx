import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION,
  SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
} from "@/lib/sidebar-nav-group-expansion-storage";
import { writeOperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

import { SidebarNav } from "./SidebarNav";

const { mockPathname, committedReviewMock, governanceModeMock } = vi.hoisted(() => ({
  mockPathname: vi.fn((): string => "/"),
  committedReviewMock: { value: false },
  governanceModeMock: { enabled: true },
}));

const buyerPolishedMock = vi.hoisted(() => ({ value: false }));

vi.mock("@/hooks/use-governance-mode", async () => {
  const { governanceModeVocabulary } = await import("@/lib/governance-mode-vocabulary");

  return {
    useGovernanceMode: () => ({
      mounted: true,
      isGovernanceModeEnabled: governanceModeMock.enabled,
      setGovernanceModeEnabled: vi.fn(),
      vocabulary: governanceModeVocabulary(governanceModeMock.enabled),
    }),
    GovernanceModeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
  usePathname: (): string => mockPathname(),
  redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
  };
});

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: (): number => 3,
  useNavCommittedArchitectureReview: (): boolean => committedReviewMock.value,
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

function unlockOperateFeatures(): void {
  fireEvent.click(screen.getByTestId("nav-advanced-unlock"));
}

describe("SidebarNav (primary navigation)", () => {
  beforeEach(() => {
    buyerPolishedMock.value = false;
    committedReviewMock.value = false;
    governanceModeMock.enabled = true;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("shows a calm first-run nav: Architecture expanded, Operate hidden until unlock", () => {
    render(<SidebarNav />);

    const reviewNav = screen.getByRole("navigation", { name: "Architecture" });
    expect(reviewNav).toBeInTheDocument();
    expect(screen.queryByText("Review work")).toBeNull();
    expect(within(reviewNav).getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/");
    expect(within(reviewNav).getByRole("link", { name: "New review" })).toHaveAttribute("href", "/reviews/new");
    expect(within(reviewNav).getByRole("link", { name: "Getting started" })).toHaveAttribute("href", "/onboarding");
    expect(within(reviewNav).queryByRole("link", { name: "Risk register" })).toBeNull();
    expect(within(reviewNav).queryByRole("link", { name: "Scorecard" })).toBeNull();

    expect(screen.getByTestId("operate-features-unlock-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-group-toggle-operate-analysis")).toBeNull();
    expect(screen.queryByTestId("sidebar-group-toggle-operate-governance")).toBeNull();
    expect(screen.queryByTestId("sidebar-group-toggle-operate-reports")).toBeNull();
    expect(screen.queryByTestId("sidebar-group-toggle-operate-integrations")).toBeNull();
    expect(screen.getByTestId("sidebar-group-toggle-operator-admin")).toHaveAttribute("aria-expanded", "false");

    expect(screen.queryByRole("navigation", { name: "Insights" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Governance" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Reports" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Integrations" })).toBeNull();
  });

  it("expands Analysis with a chevron disclosure after Operate features are unlocked", async () => {
    render(<SidebarNav />);
    unlockOperateFeatures();

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("sidebar-group-toggle-operate-analysis"));

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toHaveAttribute("aria-expanded", "true");
    });

    const analysisNav = screen.getByRole("navigation", { name: "Insights" });
    expect(within(analysisNav).getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");
    expect(within(analysisNav).getByRole("link", { name: "Ask review questions" })).toHaveAttribute("href", "/ask");
  });

  it("persists saved group expansion without overwriting on reload", async () => {
    committedReviewMock.value = true;
    writeOperateNavUnlockPhase(2);
    localStorage.setItem("archlucid_nav_show_extended", "1");
    localStorage.setItem("archlucid_nav_show_advanced", "1");
    localStorage.setItem(
      SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
      JSON.stringify({
        ...SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION,
        "operate-governance": true,
      }),
    );

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operate-governance")).toHaveAttribute("aria-expanded", "true");
    });

    expect(screen.getByRole("navigation", { name: "Governance" })).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toHaveAttribute("aria-expanded", "false");
  });

  it("shows the Operate unlock affordance instead of legacy advanced-feature copy", () => {
    render(<SidebarNav />);

    expect(screen.queryByText("Enable advanced features")).toBeNull();
    expect(screen.getByTestId("nav-advanced-unlock")).toHaveTextContent("Show analysis tools");
    expect(screen.queryByTestId("sidebar-governance-disclosure")).toBeNull();
    expect(screen.queryByRole("button", { name: /Show \d+ more destinations/ })).toBeNull();
  });

  it("uses chevron Administration disclosure separate from Architecture", async () => {
    render(<SidebarNav />);

    const adminToggle = screen.getByTestId("sidebar-group-toggle-operator-admin");
    expect(adminToggle).toHaveTextContent("Administration");
    expect(adminToggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(adminToggle);

    await waitFor(() => {
      expect(adminToggle).toHaveAttribute("aria-expanded", "true");
    });

    const adminNav = screen.getByRole("navigation", { name: "Administration" });
    expect(within(adminNav).getByRole("link", { name: "Settings" })).toHaveAttribute("href", "/settings/tenant");
  });

  it("does not duplicate the numbered first-hour journey strip in the sidebar (TB-345)", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("sidebar-quick-actions")).not.toBeInTheDocument();
    expect(screen.queryByText("First-hour path")).not.toBeInTheDocument();
  });

  it("shows dismissible auto-unlock hint after first committed review", async () => {
    committedReviewMock.value = true;
    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByTestId("operate-unlock-auto-hint")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("operate-unlock-auto-hint-dismiss"));

    await waitFor(() => {
      expect(screen.queryByTestId("operate-unlock-auto-hint")).toBeNull();
    });
  });
});

describe("SidebarNav buyer-polished desktop shell", () => {
  beforeEach(() => {
    buyerPolishedMock.value = true;
    committedReviewMock.value = false;
    governanceModeMock.enabled = false;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("keeps Architecture expanded with Operate hidden until unlock", async () => {
    render(<SidebarNav />);

    expect(screen.getByTestId("sidebar-group-toggle-pilot")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Architecture")).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Architecture" });
    expect(within(nav).getByRole("link", { name: "Overview" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "New review" })).toHaveAttribute("href", "/reviews/new");
    expect(within(nav).getByRole("link", { name: "Review packages" })).toHaveAttribute(
      "href",
      "/reviews?projectId=default",
    );
    expect(within(nav).queryByRole("link", { name: "Reviews" })).toBeNull();
    expect(within(nav).queryByRole("link", { name: "Evidence graph" })).toBeNull();

    expect(screen.getByTestId("operate-features-unlock-panel")).toBeInTheDocument();
    expect(screen.queryByTestId("sidebar-group-toggle-operate-analysis")).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Insights" })).toBeNull();

    unlockOperateFeatures();

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toBeInTheDocument();
      expect(screen.getByTestId("sidebar-group-toggle-operate-governance")).toBeInTheDocument();
    });

    expect(screen.queryByRole("navigation", { name: "Governance" })).toBeNull();
  });
});
