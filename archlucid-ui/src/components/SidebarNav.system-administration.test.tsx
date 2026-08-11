import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  SIDEBAR_NAV_GROUP_DEFAULT_EXPANSION,
  SIDEBAR_NAV_GROUP_EXPANSION_STORAGE_KEY,
} from "@/lib/sidebar-nav-group-expansion-storage";
import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { writeOperateNavUnlockPhase } from "@/lib/usability/operate-nav-progressive-unlock";

import { SidebarNav } from "./SidebarNav";

const { mockPathname, buyerPolishedShellMock, fullOperatorShellMock } = vi.hoisted(() => ({
  mockPathname: vi.fn((): string => "/"),
  buyerPolishedShellMock: { value: false },
  fullOperatorShellMock: { value: true },
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

vi.mock("@/hooks/useNavProgressiveDisclosure", () => ({
  useNavProgressiveDisclosure: () => ({
    showExtended: true,
    showAdvanced: true,
    setShowExtended: vi.fn(),
    setShowAdvanced: vi.fn(),
  }),
}));

/** TB-2139: Admin density hides Internal / Operate groups unless expanded. */
vi.mock("@/hooks/use-role-nav-density-expanded", () => ({
  useRoleNavDensityExpanded: () => ({
    showFullNav: true,
    setShowFullNav: vi.fn(),
    toggleShowFullNav: vi.fn(),
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
    isBuyerPolishedOperatorShellEnv: () => buyerPolishedShellMock.value,
    isOperatorExperienceFullShellEnv: () => fullOperatorShellMock.value,
  };
});

vi.mock("@/components/OperatorNavAuthorityProvider", async () => {
  const { createOperatorNavAuthorityVitestMock } = await import(
    "@/testing/operator-nav-authority-vitest-mock"
  );

  return createOperatorNavAuthorityVitestMock({
    callerAuthorityRank: 3,
    hasCommittedArchitectureReview: true,
  });
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

describe("SidebarNav — Internal section", () => {
  beforeEach(() => {
    mockPathname.mockReturnValue("/");
    buyerPolishedShellMock.value = false;
    fullOperatorShellMock.value = true;
    localStorage.clear();
    writeOperateNavUnlockPhase(2);
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "true");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders Internal when the feature flag is enabled", async () => {
    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operator-system-admin")).toBeInTheDocument();
    });

    expect(screen.getByTestId("sidebar-group-toggle-operator-system-admin")).toHaveTextContent(
      "Internal",
    );
  });

  it("does not render Internal when the feature flag is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "false");

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.queryByTestId("sidebar-group-toggle-operator-system-admin")).toBeNull();
    });
  });

  it("renders Internal in buyer-polished shell when full-operator experience is enabled", async () => {
    buyerPolishedShellMock.value = true;
    fullOperatorShellMock.value = true;

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operator-system-admin")).toBeInTheDocument();
    });
  });

  it("hides Internal in buyer-polished shell without full-operator experience", async () => {
    buyerPolishedShellMock.value = true;
    fullOperatorShellMock.value = false;

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.queryByTestId("sidebar-group-toggle-operator-system-admin")).toBeNull();
    });
  });

  it("does not show Internal for public sample users (buyer-polished, not full shell)", async () => {
    buyerPolishedShellMock.value = true;
    fullOperatorShellMock.value = false;
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "true");

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.queryByTestId("sidebar-group-toggle-operator-system-admin")).toBeNull();
    });

    expect(screen.queryByRole("group", { name: "Internal" })).toBeNull();
    expect(screen.queryByRole("link", { name: OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth })).toBeNull();
  });

  it("does not show Internal for ordinary tenant users when the admin nav flag is off", async () => {
    buyerPolishedShellMock.value = false;
    fullOperatorShellMock.value = false;
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "false");

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.queryByTestId("sidebar-group-toggle-operator-system-admin")).toBeNull();
    });

    expect(screen.queryByText("Internal")).toBeNull();
  });

  it("shows Internal only for authorized internal operator shells", async () => {
    buyerPolishedShellMock.value = false;
    fullOperatorShellMock.value = true;
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "true");

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operator-system-admin")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("sidebar-group-toggle-operator-system-admin"));

    await waitFor(() => {
      expect(screen.getByRole("group", { name: "Internal" })).toBeInTheDocument();
    });
  });

  it("does not expose internal destinations in customer nav groups when the flag is disabled", async () => {
    vi.stubEnv("NEXT_PUBLIC_FEATURES_SHOW_SYSTEM_ADMINISTRATION_NAV", "false");

    render(<SidebarNav />);

    fireEvent.click(screen.getByTestId("sidebar-group-toggle-operate-analysis"));

    await waitFor(() => {
      expect(screen.getByRole("group", { name: "Insights" })).toBeInTheDocument();
    });

    expect(screen.queryByRole("link", { name: "Architecture advisory" })).toBeNull();
    expect(screen.queryByRole("link", { name: OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth })).toBeNull();
  });

  it("expands Internal and highlights an active internal route", async () => {
    mockPathname.mockReturnValue("/internal/rag-health");

    render(<SidebarNav />);

    await waitFor(() => {
      expect(screen.getByTestId("sidebar-group-toggle-operator-system-admin")).toHaveAttribute("aria-expanded", "true");
    });

    const internalOpsNav = screen.getByRole("group", { name: "Internal" });
    const ragLink = within(internalOpsNav).getByRole("link", {
      name: OPERATOR_NAV_LINK_LABELS.knowledgeIndexHealth,
    });

    expect(ragLink).toHaveAttribute("href", "/internal/rag-health");
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

    expect(screen.getByRole("group", { name: "Governance" })).toBeInTheDocument();
  });
});
