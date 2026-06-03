import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
}));

vi.mock("@/components/AuthPanel", () => ({
  AuthPanel: () => <div data-testid="auth-panel-stub" />,
}));

vi.mock("@/components/ColorModeToggle", () => ({
  ColorModeToggle: () => null,
}));

vi.mock("@/components/LayerContextFromRoute", () => ({
  LayerContextFromRoute: () => null,
}));

import { ExecutiveShellFrame } from "./ExecutiveShellFrame";

describe("ExecutiveShellFrame", () => {
  it("renders dashboard and scorecard nav links with correct hrefs", () => {
    render(
      <ExecutiveShellFrame>
        <p>child</p>
      </ExecutiveShellFrame>,
    );

    expect(screen.getByTestId("executive-shell-nav-dashboard")).toHaveAttribute("href", "/dashboard");
    expect(screen.getByTestId("executive-shell-nav-scorecard")).toHaveAttribute("href", "/executive/scorecard");
  });

  it("highlights the active route link", () => {
    render(
      <ExecutiveShellFrame>
        <p>child</p>
      </ExecutiveShellFrame>,
    );

    expect(screen.getByTestId("executive-shell-nav-dashboard").className).toContain("font-semibold");
  });
});
