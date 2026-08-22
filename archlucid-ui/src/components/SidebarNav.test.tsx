/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarNav } from "@/components/SidebarNav";
import { ARCHITECTURE_DRAFTS_LIST_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import {
  SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION,
  SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
} from "@/lib/sidebar-nav-group-expansion-storage";
import { writeOperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

const mockPathname = vi.hoisted(() => vi.fn(() => "/"));
const buyerPolishedMock = vi.hoisted(() => ({ value: false }));
const committedReviewMock = vi.hoisted(() => ({ value: false }));
const governanceModeMock = vi.hoisted(() => ({ enabled: true }));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname(),
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedMock.value,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async () => {
  const { createOperatorNavAuthorityVitestMock } = await import(
    "@/testing/operator-nav-authority-vitest-mock"
  );

  return createOperatorNavAuthorityVitestMock({
    callerAuthorityRank: 1,
    hasCommittedArchitectureReview: committedReviewMock.value,
  });
});

vi.mock("@/hooks/use-governance-mode", () => ({
  useGovernanceMode: () => ({
    isGovernanceModeEnabled: governanceModeMock.enabled,
    setGovernanceModeEnabled: vi.fn(),
  }),
}));

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => null,
}));

vi.mock("@/hooks/use-pattern-library-nav-visible", () => ({
  usePatternLibraryNavVisible: () => true,
}));

/** TB-2139: Admin density hides Operate groups unless “show all destinations” is on. */
vi.mock("@/hooks/use-role-nav-density-expanded", () => ({
  useRoleNavDensityExpanded: () => ({
    showFullNav: true,
    setShowFullNav: vi.fn(),
    toggleShowFullNav: vi.fn(),
  }),
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
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    // These are disclosure/authority tests, so they need the full destination catalog rather than the
    // pre-commit spine. Buyer-polished satisfies the pre-commit gate and is what the real
    // `isBuyerPolishedOperatorShellEnv()` always returns, so `false` is not a reachable configuration.
    // Engineering chrome (the "full operator shell" this suite covers) is `NEXT_PUBLIC_OPERATOR_EXPERIENCE`.
    buyerPolishedMock.value = true;
    committedReviewMock.value = false;
    governanceModeMock.enabled = true;
    process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE = "operator";
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("shows Architecture and Operate groups for role-eligible destinations without unlock panel", () => {
    render(<SidebarNav />);

    const reviewNav = screen.getByRole("group", { name: "Architecture" });
    expect(reviewNav).toBeInTheDocument();
    expect(within(reviewNav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(reviewNav).getByRole("link", { name: ARCHITECTURE_DRAFTS_LIST_LABEL })).toHaveAttribute(
      "href",
      ARCHITECTURES_LIST_PATH,
    );
    expect(within(reviewNav).getByRole("link", { name: "Reviews" })).toHaveAttribute(
      "href",
      "/architecture/reviews",
    );

    expect(screen.queryByTestId("operate-features-unlock-panel")).toBeNull();
    expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-group-toggle-operate-governance")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-group-toggle-operator-admin")).toHaveAttribute("aria-expanded", "false");
  });

  it("expands Analysis with a chevron disclosure", async () => {
    render(<SidebarNav />);

    fireEvent.click(screen.getByTestId("sidebar-group-toggle-operate-analysis"));

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toHaveAttribute("aria-expanded", "true");
    });

    const analysisNav = screen.getByRole("group", { name: "Insights" });
    expect(within(analysisNav).getByRole("link", { name: "Compare two reviews" })).toHaveAttribute(
      "href",
      "/insights/compare-two-reviews",
    );
    expect(within(analysisNav).getByRole("link", { name: "Ask review questions" })).toHaveAttribute(
      "href",
      "/insights/ask-review-questions",
    );
  });

  it("persists saved group expansion without overwriting on reload", async () => {
    committedReviewMock.value = true;
    writeOperateNavUnlockPhase(2);
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

    expect(screen.getByRole("group", { name: "Approval" })).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toHaveAttribute("aria-expanded", "false");
  });

  it("does not show progressive-disclosure unlock or more-destinations chrome", () => {
    render(<SidebarNav />);

    expect(screen.queryByText("Enable advanced features")).toBeNull();
    expect(screen.queryByTestId("nav-advanced-unlock")).toBeNull();
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

    const adminNav = screen.getByRole("group", { name: "Administration" });
    // Reader mock rank: Settings (Execute) is hidden; Billing (Read) remains.
    expect(within(adminNav).getByRole("link", { name: "Billing & plans" })).toHaveAttribute(
      "href",
      "/administration/billing",
    );
  });

  it("does not duplicate the numbered first-hour journey strip in the sidebar (TB-345)", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("sidebar-quick-actions")).not.toBeInTheDocument();
    expect(screen.queryByText("First-hour path")).not.toBeInTheDocument();
  });

  it("does not show operate unlock auto-hint chrome after first committed review", () => {
    committedReviewMock.value = true;
    render(<SidebarNav />);

    expect(screen.queryByTestId("operate-unlock-auto-hint")).toBeNull();
  });
});

describe("SidebarNav buyer-polished desktop shell", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    buyerPolishedMock.value = true;
    committedReviewMock.value = false;
    governanceModeMock.enabled = false;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("shows Architecture and Operate groups without unlock panel", () => {
    render(<SidebarNav />);

    expect(screen.getByTestId("sidebar-group-toggle-pilot")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Architecture")).toBeInTheDocument();

    const nav = screen.getByRole("group", { name: "Architecture" });
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: ARCHITECTURE_DRAFTS_LIST_LABEL })).toHaveAttribute(
      "href",
      ARCHITECTURES_LIST_PATH,
    );

    expect(screen.queryByTestId("operate-features-unlock-panel")).toBeNull();
    expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toBeInTheDocument();
    expect(screen.getByTestId("sidebar-group-toggle-operate-governance")).toBeInTheDocument();
  });
});
