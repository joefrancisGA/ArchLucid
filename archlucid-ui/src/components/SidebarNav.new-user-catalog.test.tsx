import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { writeOperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

import { SidebarNav } from "./SidebarNav";

const { mockPathname } = vi.hoisted(() => ({
  mockPathname: vi.fn((): string => "/"),
}));

vi.mock("@/hooks/use-governance-mode", async () => {
  const { governanceModeVocabulary } = await import("@/lib/governance-mode-vocabulary");

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

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: (): number => 3,
  useNavCommittedArchitectureReview: (): boolean => false,
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
  "/reviews/new",
  "/reviews?projectId=default",
  "/dashboard",
  "/onboarding",
];

const COLLAPSED_GROUPS: ReadonlyArray<RequestedGroup> = [
  {
    toggleTestId: "sidebar-group-toggle-operate-analysis",
    hrefs: ["/graph", "/ask", "/compare", "/scorecard"],
  },
  {
    toggleTestId: "sidebar-group-toggle-operate-governance",
    hrefs: ["/governance/findings", "/governance/risk-exceptions", "/governance/first-30-days"],
  },
  {
    toggleTestId: "sidebar-group-toggle-operate-integrations",
    hrefs: ["/integrations/teams"],
  },
  {
    toggleTestId: "sidebar-group-toggle-operator-admin",
    hrefs: ["/settings/tenant", "/settings/billing", "/settings/support"],
  },
];

const OPERATE_COLLAPSED_GROUPS: ReadonlyArray<RequestedGroup> = COLLAPSED_GROUPS.filter((group) =>
  group.toggleTestId.startsWith("sidebar-group-toggle-operate-"),
);

const ADMIN_GROUP = COLLAPSED_GROUPS.find((group) => group.toggleTestId === "sidebar-group-toggle-operator-admin");

function hrefRendered(href: string): boolean {
  return document.querySelector(`a[href="${href}"]`) !== null;
}

function unlockAllOperateFeatures(): void {
  act(() => {
    writeOperateNavUnlockPhase(2);
  });
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

  it("hides Operate groups until the user unlocks them while keeping Administration visible", () => {
    render(<SidebarNav />);

    expect(screen.getByTestId("operate-features-unlock-panel")).toBeInTheDocument();

    for (const group of OPERATE_COLLAPSED_GROUPS) {
      expect(screen.queryByTestId(group.toggleTestId)).toBeNull();
    }

    expect(screen.getByTestId("sidebar-group-toggle-operator-admin")).toBeInTheDocument();
  });

  it("exposes every requested destination once Operate features are unlocked and groups expanded", async () => {
    render(<SidebarNav />);
    unlockAllOperateFeatures();

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toBeInTheDocument();
    });

    for (const group of OPERATE_COLLAPSED_GROUPS) {
      const toggle = screen.getByTestId(group.toggleTestId);

      if (toggle.getAttribute("aria-expanded") !== "true") {
        fireEvent.click(toggle);
      }

      await waitFor(() => {
        expect(toggle).toHaveAttribute("aria-expanded", "true");
      });

      for (const href of group.hrefs) {
        expect(hrefRendered(href)).toBe(true);
      }
    }

    expect(ADMIN_GROUP).toBeDefined();
    fireEvent.click(screen.getByTestId(ADMIN_GROUP!.toggleTestId));

    await waitFor(() => {
      expect(screen.getByTestId(ADMIN_GROUP!.toggleTestId)).toHaveAttribute("aria-expanded", "true");
    });

    for (const href of ADMIN_GROUP!.hrefs) {
      expect(hrefRendered(href)).toBe(true);
    }
  });

  it("restores previously unlocked Operate groups without showing the unlock panel again", async () => {
    writeOperateNavUnlockPhase(1);
    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.queryByTestId("operate-features-unlock-panel")).toBeNull();
      expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toBeInTheDocument();
    });
  });
});
