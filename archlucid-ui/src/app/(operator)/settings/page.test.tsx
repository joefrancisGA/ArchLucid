import { render, screen } from "@testing-library/react";
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

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

vi.mock("@/components/ColorModeSegmentedControl", () => ({
  ColorModeSegmentedControl: () => <div data-testid="color-mode-segmented-stub" />,
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

  it("shows appearance and help for read-tier users without developer or support cards", () => {
    render(<SettingsPageView />);

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.getByTestId("color-mode-segmented-stub")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Help" })).toHaveAttribute("href", "/help");
    expect(screen.queryByText("Visual theme (developer preview)")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-developer-tools-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("settings-support-bundle-card")).not.toBeInTheDocument();
    expect(screen.getByTestId("settings-security-trust-card")).toBeInTheDocument();
  });

  it("shows workspace and support cards for execute-tier users", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;

    render(<SettingsPageView />);

    expect(screen.getByTestId("settings-workspace-card")).toBeInTheDocument();
    expect(screen.getByTestId("settings-support-bundle-card")).toBeInTheDocument();
    expect(screen.getByTestId("support-bundle-stub")).toHaveAttribute("data-diagnostics", "true");
    expect(screen.queryByTestId("settings-security-trust-card")).not.toBeInTheDocument();
  });

  it("shows developer tools card only in the internal operator shell", () => {
    internalShell.enabled = true;

    render(<SettingsPageView />);

    expect(screen.getByTestId("settings-developer-tools-card")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open developer tools" })).toHaveAttribute("href", "/settings/developer");
  });
});
