import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarNav } from "./SidebarNav";

const { mockPathname } = vi.hoisted(() => ({
  mockPathname: vi.fn((): string => "/"),
}));

vi.mock("next/navigation", () => ({
  usePathname: (): string => mockPathname(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

// Reproduce a brand-new buyer tenant: Admin rank, but no committed architecture review yet.
// This is the case the running app hits for first-use buyers, and the first-commit gate used
// to strip Analysis / Governance / Operations entirely.
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
  "/",
  "/reviews/new",
  "/graph",
  "/reviews?projectId=default",
  "/dashboard",
  "/onboarding",
];

const COLLAPSED_GROUPS: ReadonlyArray<RequestedGroup> = [
  {
    toggleTestId: "sidebar-group-toggle-operate-analysis",
    hrefs: ["/compare", "/ask", "/search", "/advisory"],
  },
  {
    toggleTestId: "sidebar-group-toggle-operate-governance",
    hrefs: [
      "/governance/findings",
      "/governance/risk-exceptions",
      "/policy-packs",
      "/governance-resolution",
      "/audit",
      "/governance/decision-register",
      "/alerts",
      "/governance/first-30-days",
      "/workspace/security-trust",
      "/integrations/teams",
    ],
  },
  {
    toggleTestId: "sidebar-group-toggle-operate-operations",
    hrefs: [
      "/scorecard",
      "/governance/recurrence-schedules",
      "/recommendation-learning",
      "/product-learning",
      "/portfolio",
      "/integrations/operations",
      "/health",
    ],
  },
  {
    toggleTestId: "sidebar-group-toggle-operator-admin",
    hrefs: ["/settings/tenant", "/settings/tenant-cost", "/settings/billing", "/settings/tenant/recycle-bin"],
  },
];

function hrefRendered(href: string): boolean {
  return document.querySelector(`a[href="${href}"]`) !== null;
}

describe("SidebarNav — new-user buyer-polished catalog (no committed review)", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("keeps Review work destinations visible without expansion", () => {
    render(<SidebarNav />);

    for (const href of REVIEW_WORK_HREFS) {
      expect(hrefRendered(href)).toBe(true);
    }
  });

  it("renders all four advanced groups collapsed by default", () => {
    render(<SidebarNav />);

    for (const group of COLLAPSED_GROUPS) {
      expect(screen.getByTestId(group.toggleTestId)).toHaveAttribute("aria-expanded", "false");
    }
  });

  it("exposes every requested destination once its group is expanded", async () => {
    render(<SidebarNav />);

    for (const group of COLLAPSED_GROUPS) {
      fireEvent.click(screen.getByTestId(group.toggleTestId));

      await waitFor(() => {
        expect(screen.getByTestId(group.toggleTestId)).toHaveAttribute("aria-expanded", "true");
      });

      for (const href of group.hrefs) {
        expect(hrefRendered(href)).toBe(true);
      }
    }
  });
});
