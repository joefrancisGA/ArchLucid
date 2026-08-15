import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navAuth = vi.hoisted(() => ({
  callerAuthorityRank: 1,
  isAuthorityLoading: false,
}));

const internalShell = vi.hoisted(() => ({
  enabled: false,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: navAuth.callerAuthorityRank,
    isAuthorityLoading: navAuth.isAuthorityLoading,
    currentPrincipal: {
      provenance: "auth-me",
      name: "operator@test",
      roleClaimValues: [],
      primaryAppRole: null,
      maxAuthority: "ReadAuthority",
      authorityRank: navAuth.callerAuthorityRank,
      hasEnterpriseOperatorSurfaces: false,
      hasCommittedArchitectureReview: false,
      hasRecognizedArchLucidRole: true,
      permissionClaimValues: [],
    },
  }),
}));

vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: () => internalShell.enabled,
}));

vi.mock("@/lib/finish-setup-deployment", () => ({
  isSelfHostedDeploymentEnv: () => false,
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    workspaceLabel: "Contoso",
    projectLabel: "Pilot",
  }),
  getEffectiveBrowserProxyScopeHeaders: () => ({}),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/SupportBundleDownloadButton", () => ({
  SupportBundleDownloadButton: ({ showDiagnosticsLink }: { showDiagnosticsLink?: boolean }) => (
    <div data-testid="support-bundle-stub" data-diagnostics={showDiagnosticsLink ? "true" : "false"} />
  ),
}));

vi.mock("@/components/usability/PageContextualHelpButton", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/usability/PageContextualHelpButton")>();

  return {
    ...actual,
    PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
  };
});

vi.mock("next/navigation", () => ({
  usePathname: () => "/administration",
}));

import { OPERATOR_NAV_LINK_LABELS } from "@/lib/i18n";
import { AUTHORITY_RANK } from "@/lib/nav-authority";

import { SettingsPageView } from "./_sections/SettingsPageView";

describe("SettingsPageView", () => {
  beforeEach(() => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.ReadAuthority;
    navAuth.isAuthorityLoading = false;
    internalShell.enabled = false;
  });

  it("renders master overview, search, and section navigation for read-tier users", () => {
    render(<SettingsPageView />);

    expect(
      screen.getByRole("heading", { level: 1, name: OPERATOR_NAV_LINK_LABELS.settings }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("settings-master-overview-header")).toBeInTheDocument();
    expect(screen.getByTestId("page-heading-icon")).toBeInTheDocument();
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search settings…")).toBeInTheDocument();
    expect(screen.getByTestId("settings-master-section-nav")).toBeInTheDocument();
    expect(screen.getByTestId("settings-section-security-trust")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-section-advanced")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-developer-tools-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-recent-changes-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-help-card")).not.toBeInTheDocument();
  });

  it("exposes section nav as hash links (TB-1202)", () => {
    render(<SettingsPageView />);

    const securityLink = screen.getByRole("link", { name: "Security & Trust" });

    expect(securityLink).toHaveAttribute("href", "#settings-section-security-trust");
  });

  it("shows the support section for execute-tier users but withholds workspace settings", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    render(<SettingsPageView />);

    expect(screen.getByTestId("settings-section-support")).toBeInTheDocument();
    expect(screen.getByTestId("support-bundle-stub")).toHaveAttribute("data-diagnostics", "true");
    expect(screen.queryByText(/No support bundle generated yet in this session/i)).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-section-workspace")).not.toBeInTheDocument();
  });

  it("shows workspace settings only at admin rank", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    render(<SettingsPageView />);

    expect(screen.getByTestId("settings-section-workspace")).toBeInTheDocument();
  });

  it("filters visible sections when searching", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    render(<SettingsPageView />);

    fireEvent.change(screen.getByPlaceholderText("Search settings…"), { target: { value: "billing" } });

    expect(screen.getByTestId("settings-section-billing")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-section-help")).not.toBeInTheDocument();
  });

  it("omits personal settings — those are published from the top-bar account menu", () => {
    render(<SettingsPageView />);

    expect(screen.queryByTestId("settings-destination-user-preferences")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-destination-account-security")).not.toBeInTheDocument();
  });

  it("shows advanced section when advanced toggle is expanded", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    render(<SettingsPageView />);

    fireEvent.click(screen.getByTestId("settings-advanced-toggle"));

    expect(screen.getByTestId("settings-section-advanced")).toBeInTheDocument();
  });

  it("shows internal developer section only in internal operator shell", () => {
    internalShell.enabled = true;

    render(<SettingsPageView />);

    expect(screen.getByTestId("settings-section-developer-internal")).toBeInTheDocument();
  });
});
