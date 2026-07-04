import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PERSONA_SHELL_WORKSPACE_LABEL } from "@/lib/persona-shell-vocabulary";

vi.mock("next/navigation", () => ({
  usePathname: () => "/executive/dashboard",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/AuthPanel", () => ({
  AuthPanel: () => <div data-testid="auth-panel-stub" />,
}));

vi.mock("@/components/executive/ExecutiveShellDeferredChrome", () => ({
  ExecutiveShellDeferredChrome: () => null,
}));

vi.mock("@/components/ScopeSwitcher", () => ({
  ScopeSwitcher: () => <div data-testid="executive-shell-scope-switcher-stub" />,
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

  it("renders an architect workspace handoff link instead of a persona switcher", () => {
    render(
      <ExecutiveShellFrame>
        <p>child</p>
      </ExecutiveShellFrame>,
    );

    expect(screen.queryByTestId("executive-operator-shell-switcher")).not.toBeInTheDocument();
    expect(screen.getByTestId("executive-shell-architect-workspace-link")).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: PERSONA_SHELL_WORKSPACE_LABEL })).toBeInTheDocument();
    expect(screen.getByTestId("executive-shell-topbar").textContent?.toLowerCase() ?? "").not.toContain("operator");
  });

  it("highlights the active route link", () => {
    render(
      <ExecutiveShellFrame>
        <p>child</p>
      </ExecutiveShellFrame>,
    );

    expect(screen.getByTestId("executive-shell-nav-dashboard").className).toContain("font-semibold");
  });

  it("renders scope switcher in the session rail without toolbar help or color-mode toggles", () => {
    render(
      <ExecutiveShellFrame>
        <p>child</p>
      </ExecutiveShellFrame>,
    );

    expect(screen.getByTestId("executive-shell-scope-switcher-stub")).toBeInTheDocument();
    expect(screen.getByTestId("executive-shell-topbar-session")).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
    expect(screen.getByRole("main")).toHaveClass("max-w-[1600px]");
    expect(screen.getByTestId("executive-shell-topbar")).toHaveClass("overflow-x-hidden");
  });
});
