import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const navAuth = vi.hoisted(() => ({
  callerAuthorityRank: 1,
  isAuthorityLoading: false,
}));

const internalShell = vi.hoisted(() => ({
  enabled: false,
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: navAuth.callerAuthorityRank,
    isAuthorityLoading: navAuth.isAuthorityLoading,
  }),
}));

vi.mock("@/lib/internal-operator-env", () => ({
  isArchLucidInternalOperatorShellEnv: () => internalShell.enabled,
}));

vi.mock("@/lib/finish-setup-deployment", () => ({
  isSelfHostedDeploymentEnv: () => false,
}));

vi.mock("@/lib/operator-scope-storage", () => ({
  readOperatorScopeFromStorage: () => ({
    tenantId: "tenant-1",
    workspaceId: "workspace-1",
    projectId: "project-1",
    workspaceLabel: "Contoso",
    projectLabel: "Pilot",
  }),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/SupportBundleDownloadButton", () => ({
  SupportBundleDownloadButton: ({ showDiagnosticsLink }: { showDiagnosticsLink?: boolean }) => (
    <div data-testid="support-bundle-stub" data-diagnostics={showDiagnosticsLink ? "true" : "false"} />
  ),
}));

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

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.getByTestId("settings-master-overview-header")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search settings…")).toBeInTheDocument();
    expect(screen.getByTestId("settings-master-section-nav")).toBeInTheDocument();
    expect(screen.getByTestId("settings-destination-user-preferences")).toBeInTheDocument();
    expect(screen.getByTestId("settings-section-security-trust")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-section-advanced")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-developer-tools-card")).not.toBeInTheDocument();
  });

  it("shows workspace and support sections for execute-tier users", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    render(<SettingsPageView />);

    expect(screen.getByTestId("settings-section-workspace")).toBeInTheDocument();
    expect(screen.getByTestId("settings-section-support")).toBeInTheDocument();
    expect(screen.getByTestId("support-bundle-stub")).toHaveAttribute("data-diagnostics", "true");
  });

  it("filters visible sections when searching", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    render(<SettingsPageView />);

    fireEvent.change(screen.getByPlaceholderText("Search settings…"), { target: { value: "billing" } });

    expect(screen.getByTestId("settings-section-billing")).toBeInTheDocument();
    expect(screen.queryByTestId("settings-section-general")).not.toBeInTheDocument();
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
