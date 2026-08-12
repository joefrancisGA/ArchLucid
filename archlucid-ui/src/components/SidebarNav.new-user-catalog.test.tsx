import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ARCHITECTURES_LIST_PATH } from "@/lib/architecture/architecture-routes";
import { EXECUTIVE_DASHBOARD_HREF } from "@/lib/executive-dashboard-route";

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

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/components/operator/OperatorNavAuthorityProvider", async () => {
  const { createOperatorNavAuthorityVitestMock } = await import(
    "@/testing/operator-nav-authority-vitest-mock"
  );

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

type RequestedGroup = {
  toggleTestId: string;
  hrefs: ReadonlyArray<string>;
};

const REVIEW_WORK_HREFS: ReadonlyArray<string> = [
  ARCHITECTURES_LIST_PATH,
  "/architecture/reviews",
  EXECUTIVE_DASHBOARD_HREF,
  "/architecture/first-review-guide",
];

const COLLAPSED_GROUPS: ReadonlyArray<RequestedGroup> = [
  {
    toggleTestId: "sidebar-group-toggle-operate-analysis",
    hrefs: ["/insights/evidence-graph", "/insights/ask-review-questions", "/insights/compare-two-reviews", "/insights/architecture-scorecard"],
  },
  {
    toggleTestId: "sidebar-group-toggle-operate-governance",
    hrefs: ["/governance/findings", "/governance/exceptions", "/governance/setup"],
  },
  {
    toggleTestId: "sidebar-group-toggle-operate-integrations",
    hrefs: ["/integrations/teams"],
  },
  {
    toggleTestId: "sidebar-group-toggle-operator-admin",
    hrefs: ["/administration/tenant", "/administration/billing", "/administration/support"],
  },
];

const OPERATE_COLLAPSED_GROUPS: ReadonlyArray<RequestedGroup> = COLLAPSED_GROUPS.filter((group) =>
  group.toggleTestId.startsWith("sidebar-group-toggle-operate-"),
);

const ADMIN_GROUP = COLLAPSED_GROUPS.find((group) => group.toggleTestId === "sidebar-group-toggle-operator-admin");

function hrefRendered(href: string): boolean {
  return document.querySelector(`a[href="${href}"]`) !== null;
}

describe("SidebarNav — new-user buyer-polished catalog (no committed review)", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("keeps Architecture destinations visible without expansion", () => {
    render(<SidebarNav />);

    for (const href of REVIEW_WORK_HREFS) {
      expect(hrefRendered(href)).toBe(true);
    }
  });

  it("shows Operate groups without unlock panel while keeping Administration visible", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("operate-features-unlock-panel")).toBeNull();

    for (const group of OPERATE_COLLAPSED_GROUPS) {
      expect(screen.getByTestId(group.toggleTestId)).toBeInTheDocument();
    }

    expect(screen.getByTestId("sidebar-group-toggle-operator-admin")).toBeInTheDocument();
  });

  it("exposes every requested destination once groups are expanded", async () => {
    render(<SidebarNav />);

    for (const group of OPERATE_COLLAPSED_GROUPS) {
      const toggle = screen.getByTestId(group.toggleTestId);

      if (toggle.getAttribute("aria-expanded") !== "true") {
        fireEvent.click(toggle);
      }

      await waitFor(() => {
        expect(toggle).toHaveAttribute("aria-expanded", "true");
      });

      const moreId = group.toggleTestId.replace("sidebar-group-toggle-", "sidebar-group-more-");
      const moreButton = document.querySelector(`[data-testid="${moreId}"]`);

      if (moreButton !== null) {
        fireEvent.click(moreButton);
      }

      for (const href of group.hrefs) {
        expect(hrefRendered(href)).toBe(true);
      }
    }

    expect(ADMIN_GROUP).toBeDefined();
    fireEvent.click(screen.getByTestId(ADMIN_GROUP!.toggleTestId));

    await waitFor(() => {
      expect(screen.getByTestId(ADMIN_GROUP!.toggleTestId)).toHaveAttribute("aria-expanded", "true");
    });

    const adminMore = document.querySelector('[data-testid="sidebar-group-more-operator-admin"]');

    if (adminMore !== null) {
      fireEvent.click(adminMore);
    }

    for (const href of ADMIN_GROUP!.hrefs) {
      expect(hrefRendered(href)).toBe(true);
    }
  });
});
