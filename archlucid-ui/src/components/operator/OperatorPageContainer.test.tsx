import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { OperatorPageContainer } from "@/components/operator/OperatorPageContainer";

describe("OperatorPageContainer", () => {
  it("renders workflow variant left-aligned without mx-auto", () => {
    render(
      <OperatorPageContainer variant="workflow" data-testid="workflow-page">
        Page body
      </OperatorPageContainer>,
    );

    const surface = screen.getByTestId("workflow-page");
    expect(surface).toHaveClass("w-full", "max-w-[1200px]");
    expect(surface.className).not.toMatch(/mx-auto/);
  });

  it("renders dashboard variant for wide operator surfaces", () => {
    render(
      <OperatorPageContainer variant="dashboard" data-testid="dashboard-page">
        Dashboard
      </OperatorPageContainer>,
    );

    const surface = screen.getByTestId("dashboard-page");
    expect(surface).toHaveClass("w-full", "max-w-[1440px]");
    expect(surface.className).not.toMatch(/mx-auto/);
  });

  it("renders reading variant for narrow left-aligned copy", () => {
    render(
      <OperatorPageContainer variant="reading" data-testid="reading-page">
        Help
      </OperatorPageContainer>,
    );

    const surface = screen.getByTestId("reading-page");
    expect(surface).toHaveClass("w-full", "max-w-3xl");
    expect(surface.className).not.toMatch(/mx-auto/);
  });

  it("renders settings variant for administration surfaces", () => {
    render(
      <OperatorPageContainer variant="settings" data-testid="settings-page">
        Administration
      </OperatorPageContainer>,
    );

    const surface = screen.getByTestId("settings-page");
    expect(surface).toHaveClass("w-full", "max-w-[62rem]");
    expect(surface.className).not.toMatch(/mx-auto/);
  });
});
