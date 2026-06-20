import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/executive/dashboard",
}));

vi.mock("@/components/AuthPanel", () => ({
  AuthPanel: () => <div data-testid="auth-panel-stub" />,
}));

vi.mock("@/components/ColorModeToggle", () => ({
  ColorModeToggle: () => null,
}));

vi.mock("@/components/executive/ExecutiveShellDeferredChrome", () => ({
  ExecutiveShellDeferredChrome: () => null,
}));

vi.mock("@/components/shell/TenantWorkspaceBoundaryBadge", () => ({
  TenantWorkspaceBoundaryBadge: () => <div data-testid="tenant-workspace-boundary-badge-compact" />,
}));

import { ExecutiveShellFrame } from "./ExecutiveShellFrame";

describe("ExecutiveShellFrame", () => {
  it("renders dashboard and scorecard nav links with correct hrefs", () => {
    render(
      <ExecutiveShellFrame>
        <p>child</p>
      </ExecutiveShellFrame>,
    );

    expect(screen.getByTestId("executive-shell-nav-dashboard")).toHaveAttribute("href", "/executive/dashboard");
    expect(screen.getByTestId("executive-shell-nav-scorecard")).toHaveAttribute("href", "/executive/scorecard");
  });

  it("renders the operator / executive switcher in the executive top bar", () => {
    render(
      <ExecutiveShellFrame>
        <p>child</p>
      </ExecutiveShellFrame>,
    );

    expect(screen.getByTestId("executive-operator-shell-switcher")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Operator" })).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: "Executive" })).toHaveAttribute("href", "/executive/dashboard");
  });

  it("highlights the active route link", () => {
    render(
      <ExecutiveShellFrame>
        <p>child</p>
      </ExecutiveShellFrame>,
    );

    expect(screen.getByTestId("executive-shell-nav-dashboard").className).toContain("font-semibold");
  });

  it("renders tenant boundary badge and widened main content shell", () => {
    render(
      <ExecutiveShellFrame>
        <p>child</p>
      </ExecutiveShellFrame>,
    );

    expect(screen.getByTestId("tenant-workspace-boundary-badge-compact")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveClass("max-w-[1600px]");
    expect(screen.getByTestId("executive-shell-topbar")).toHaveClass("overflow-x-hidden");
  });
});
