import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { EVIDENCE_GRAPH_PATH } from "@/lib/evidence-graph-route";
import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";

import { SidebarNav } from "./SidebarNav";

const { mockPathname } = vi.hoisted(() => ({
  mockPathname: vi.fn((): string => "/"),
}));

vi.mock("@/hooks/use-governance-mode", async () => {
  const { governanceModeVocabulary } = await import("@/lib/vocabulary/governance-mode-vocabulary");

  return {
    useGovernanceMode: () => ({
      mounted: true,
      isGovernanceModeEnabled: true,
      setGovernanceModeEnabled: vi.fn(),
      vocabulary: governanceModeVocabulary(true),
    }),
    GovernanceModeProvider: ({ children }: { children: React.ReactNode }) => children,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: (): string => mockPathname(),
  useSearchParams: (): URLSearchParams => new URLSearchParams(),
}));

/** Real tenant, not the curated walkthrough — so the pre-commit gate must actually apply. */
vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async () => {
  const { createOperatorNavAuthorityVitestMock } = await import(
    "@/testing/operator-nav-authority-vitest-mock"
  );

  // Admin rank so authority filtering cannot be the reason a destination is missing.
  return createOperatorNavAuthorityVitestMock({
    callerAuthorityRank: 3,
    hasCommittedArchitectureReview: false,
  });
});

vi.mock("@/components/WorkspaceActiveRunContext", () => ({
  useWorkspaceActiveRun: () => null,
}));

vi.mock("@/hooks/use-pattern-library-nav-visible", () => ({
  usePatternLibraryNavVisible: () => true,
}));

/** Show-all so role density cannot be the reason a group is missing. */
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

function hrefRendered(href: string): boolean {
  return document.querySelector(`a[href="${href}"]`) !== null;
}

async function expandGroup(toggleTestId: string): Promise<void> {
  const toggle = screen.getByTestId(toggleTestId);

  if (toggle.getAttribute("aria-expanded") !== "true") {
    fireEvent.click(toggle);
  }

  await waitFor(() => {
    expect(toggle).toHaveAttribute("aria-expanded", "true");
  });

  const moreButton = document.querySelector(
    `[data-testid="${toggleTestId.replace("sidebar-group-toggle-", "sidebar-group-more-")}"]`,
  );

  if (moreButton !== null) {
    fireEvent.click(moreButton);
  }
}

/**
 * Sidebar and command palette must agree on which destinations exist. The sidebar previously passed a
 * hard-coded `true` for the commit-state gate input while the palette passed the real principal flag,
 * so before the first committed review the sidebar listed Operate destinations that the palette hid.
 */
describe("SidebarNav — pre-commit gate on a real tenant (no committed review)", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("keeps the golden-path Architecture destinations visible", () => {
    render(<SidebarNav />);

    for (const href of [ARCHITECTURES_LIST_PATH, "/architecture/reviews", SPONSOR_DASHBOARD_HREF, "/architecture/first-review-guide"]) {
      expect(hrefRendered(href)).toBe(true);
    }
  });

  it("drops Operate groups whose destinations are all gated until first commit", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("sidebar-group-toggle-operate-governance")).toBeNull();
    expect(screen.queryByTestId("sidebar-group-toggle-operate-integrations")).toBeNull();
  });

  it("keeps the Insights group for the pre-commit-eligible evidence graph", async () => {
    render(<SidebarNav />);

    await expandGroup("sidebar-group-toggle-operate-analysis");

    expect(hrefRendered(EVIDENCE_GRAPH_PATH)).toBe(true);
    expect(hrefRendered("/insights/compare-two-reviews")).toBe(false);
  });

  it("narrows Administration to the pre-commit break-glass destinations", async () => {
    render(<SidebarNav />);

    await expandGroup("sidebar-group-toggle-operator-admin");

    expect(hrefRendered("/administration/workspace-settings")).toBe(true);
    expect(hrefRendered("/administration/billing")).toBe(false);
  });
});
