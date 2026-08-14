import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SPONSOR_DASHBOARD_HREF } from "@/lib/sponsor-dashboard-route";
import { PERSONA_SHELL_WORKSPACE_LABEL } from "@/lib/vocabulary/persona-shell-vocabulary";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();
  return {
    ...actual,
    usePathname: () => SPONSOR_DASHBOARD_HREF,
    useSearchParams: () => new URLSearchParams(),
    redirect: vi.fn(),
    permanentRedirect: vi.fn(),
    notFound: vi.fn(),
  };
});

vi.mock("@/components/AuthPanel", () => ({
  AuthPanel: () => <div data-testid="auth-panel-stub" />,
}));

vi.mock("@/components/sponsor/SponsorShellDeferredChrome", () => ({
  SponsorShellDeferredChrome: () => null,
}));

vi.mock("@/components/ScopeSwitcher", () => ({
  ScopeSwitcher: () => <div data-testid="sponsor-shell-scope-switcher-stub" />,
}));

import { SponsorShellFrame } from "./SponsorShellFrame";

describe("SponsorShellFrame", () => {
  it("renders dashboard nav link with correct href", () => {
    render(
      <SponsorShellFrame>
        <p>child</p>
      </SponsorShellFrame>,
    );

    expect(screen.getByTestId("sponsor-shell-nav-dashboard")).toHaveAttribute("href", SPONSOR_DASHBOARD_HREF);
    expect(screen.queryByTestId("sponsor-shell-nav-scorecard")).not.toBeInTheDocument();
  });

  it("renders an architect workspace handoff link instead of a persona switcher", () => {
    render(
      <SponsorShellFrame>
        <p>child</p>
      </SponsorShellFrame>,
    );

    expect(screen.queryByTestId("sponsor-operator-shell-switcher")).not.toBeInTheDocument();
    expect(screen.getByTestId("sponsor-shell-architect-workspace-link")).toHaveAttribute("href", "/");
    expect(screen.getByRole("link", { name: PERSONA_SHELL_WORKSPACE_LABEL })).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-shell-topbar").textContent?.toLowerCase() ?? "").not.toContain("operator");
  });

  it("highlights the active route link", () => {
    render(
      <SponsorShellFrame>
        <p>child</p>
      </SponsorShellFrame>,
    );

    expect(screen.getByTestId("sponsor-shell-nav-dashboard").className).toContain("font-semibold");
  });

  it("renders scope switcher in the session rail without toolbar help or color-mode toggles", () => {
    render(
      <SponsorShellFrame>
        <p>child</p>
      </SponsorShellFrame>,
    );

    expect(screen.getByTestId("sponsor-shell-scope-switcher-stub")).toBeInTheDocument();
    expect(screen.getByTestId("sponsor-shell-topbar-session")).toBeInTheDocument();
    expect(document.querySelector("[data-help-tooltip-trigger]")).toBeNull();
    expect(screen.getByRole("main")).toHaveClass("max-w-[1600px]");
    expect(screen.getByTestId("sponsor-shell-topbar")).toHaveClass("overflow-x-hidden");
  });
});
