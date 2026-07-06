import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION,
  SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
} from "@/lib/sidebar-nav-group-expansion-storage";
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

vi.mock("@/hooks/useNavProgressiveDisclosure", () => ({
  useNavProgressiveDisclosure: () => ({
    showExtended: true,
    showAdvanced: true,
    setShowExtended: vi.fn(),
    setShowAdvanced: vi.fn(),
  }),
}));

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
    isBuyerPolishedOperatorShellEnv: () => false,
  };
});

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useNavCallerAuthorityRank: (): number => 3,
  useNavCommittedArchitectureReview: (): boolean => true,
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

describe("SidebarNav — Internal Operations section", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    localStorage.clear();
    writeOperateNavUnlockPhase(2);
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders Internal Operations when the feature flag is enabled", async () => {
    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operator-system-admin")).toBeInTheDocument();
    });

    expect(screen.getByTestId("sidebar-group-toggle-operator-system-admin")).toHaveTextContent(
      "Internal Operations",
    );
  });

  it("does not render Internal Operations when the feature flag is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "false");

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.queryByTestId("sidebar-group-toggle-operator-system-admin")).toBeNull();
    });
  });

  it("does not expose internal destinations in customer nav groups when the flag is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "false");

    render(<SidebarNav />);

    fireEvent.click(screen.getByTestId("sidebar-group-toggle-operate-analysis"));

    await waitFor(() => {
      expect(screen.getByRole("navigation", { name: "Insights" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("link", { name: "Architecture advisory" })).toBeNull();
    expect(screen.queryByRole("link", { name: "RAG health" })).toBeNull();
  });

  it("expands Internal Operations and highlights an active internal route", async () => {
    mockPathname.mockReturnValue("/admin/rag-health");

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operator-system-admin")).toHaveAttribute("aria-expanded", "true");
    });

    const internalOpsNav = screen.getByRole("navigation", { name: "Internal Operations" });
    const ragLink = within(internalOpsNav).getByRole("link", { name: "RAG health" });

    expect(ragLink).toHaveAttribute("href", "/admin/rag-health");
    expect(ragLink).toHaveAttribute("aria-current", "page");
    expect(ragLink).not.toHaveTextContent("per-corpus");
  });

  it("does not render the legacy governance view checkbox", () => {
    render(<SidebarNav />);

    expect(screen.queryByTestId("governance-mode-toggle")).toBeNull();
    expect(screen.queryByText("Enable governance view")).toBeNull();
  });

  it("shows Governance as a collapsible section with a caret", async () => {
    localStorage.clear();
    writeOperateNavUnlockPhase(2);
    localStorage.setItem(
      SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
      JSON.stringify({
        ...SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION,
        "operate-governance": false,
      }),
    );

    render(<SidebarNav />);

    const governanceToggle = screen.getByTestId("sidebar-group-toggle-operate-governance");

    expect(governanceToggle).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(governanceToggle);

    await waitFor(() => {
      expect(governanceToggle).toHaveAttribute("aria-expanded", "true");
    });

    expect(screen.getByRole("navigation", { name: "Governance" })).toBeInTheDocument();
  });
});
