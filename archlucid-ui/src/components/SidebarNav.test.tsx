import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION,
  SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
} from "@/lib/sidebar-nav-group-expansion-storage";

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
    localStorage.clear();
  });

  it("shows a calm first-run nav: Review work expanded and deeper groups collapsed", () => {
    render(<SidebarNav />);

    const reviewNav = screen.getByRole("navigation", { name: "Review work" });
    expect(reviewNav).toBeInTheDocument();
    expect(within(reviewNav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(reviewNav).getByRole("link", { name: "Start review" })).toHaveAttribute("href", "/reviews/new");
    expect(within(reviewNav).getByRole("link", { name: "Onboarding" })).toHaveAttribute("href", "/onboarding");
    expect(within(reviewNav).queryByRole("link", { name: "Risk register" })).toBeNull();
    expect(within(reviewNav).queryByRole("link", { name: "Scorecard" })).toBeNull();

    expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("sidebar-group-toggle-operate-governance")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("sidebar-group-toggle-operate-operations")).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("sidebar-group-toggle-operator-admin")).toHaveAttribute("aria-expanded", "false");

    expect(screen.queryByRole("navigation", { name: "Analysis" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Governance" })).toBeNull();
    expect(screen.queryByRole("navigation", { name: "Operations" })).toBeNull();
  });

  it("expands Analysis with a chevron disclosure and reveals analysis destinations", async () => {
    render(<SidebarNav />);

    fireEvent.click(screen.getByTestId("sidebar-group-toggle-operate-analysis"));

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operate-analysis")).toHaveAttribute("aria-expanded", "true");
    });

    const analysisNav = screen.getByRole("navigation", { name: "Analysis" });
    expect(within(analysisNav).getByRole("link", { name: "Compare two reviews" })).toHaveAttribute("href", "/compare");
    expect(within(analysisNav).getByRole("link", { name: "Ask this review" })).toHaveAttribute("href", "/ask");
  });

  it("persists saved group expansion without overwriting on reload", async () => {
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

  it("does not show Enable advanced features or meaningless child-count badges on group headings", () => {
    render(<SidebarNav />);

    expect(screen.queryByText("Enable advanced features")).toBeNull();
    expect(screen.queryByTestId("nav-advanced-unlock")).toBeNull();
    expect(screen.queryByTestId("sidebar-governance-disclosure")).toBeNull();
    expect(screen.queryByRole("button", { name: /Show \d+ more destinations/ })).toBeNull();

    for (const groupId of ["operate-analysis", "operate-governance", "operate-operations", "operator-admin"]) {
      const toggle = screen.getByTestId(`sidebar-group-toggle-${groupId}`);
      expect(toggle.textContent?.trim()).not.toMatch(/\d+/);
    }
  });

  it("uses chevron Administration disclosure separate from Review work", async () => {
    render(<SidebarNav />);

    const adminToggle = screen.getByTestId("sidebar-group-toggle-operator-admin");
    expect(adminToggle).toHaveTextContent("Administration");
    expect(adminToggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(adminToggle);

    await waitFor(() => {
      expect(adminToggle).toHaveAttribute("aria-expanded", "true");
    });

    const adminNav = screen.getByRole("navigation", { name: "Administration" });
    expect(within(adminNav).getByRole("link", { name: "Tenant settings" })).toHaveAttribute("href", "/settings/tenant");
  });

  it("does not duplicate the numbered first-hour journey strip in the sidebar (TB-345)", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("sidebar-quick-actions")).not.toBeInTheDocument();
    expect(screen.queryByText("First-hour path")).not.toBeInTheDocument();
  });
});

describe("SidebarNav buyer-polished desktop shell", () => {
  beforeEach(() => {
    buyerPolishedMock.value = true;
    delete process.env.NEXT_PUBLIC_OPERATOR_EXPERIENCE;
    mockPathname.mockReturnValue("/");
    localStorage.clear();
  });

  it("keeps label-based review nav visible without collapsing Review work", () => {
    render(<SidebarNav />);

    expect(screen.queryByRole("button", { name: /Review work/i })).toBeNull();
    expect(screen.getByText("Reviews")).toBeInTheDocument();

    const nav = screen.getByRole("navigation", { name: "Reviews" });
    expect(within(nav).getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(within(nav).getByRole("link", { name: "New review" })).toHaveAttribute("href", "/reviews/new");
  });
});
