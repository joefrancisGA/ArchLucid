import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { InventoryDemoScenarioPicker } from "@/components/wizard/InventoryDemoScenarioPicker";

describe("InventoryDemoScenarioPicker", () => {
  it("uses a single-column stack layout for narrow setup asides", () => {
    render(
      <InventoryDemoScenarioPicker
        platform="azure"
        layout="stack"
        selectedScenarioId="customer-intake-modernization"
        onSelectScenario={() => undefined}
        testIdPrefix="test-demo"
      />,
    );

    expect(screen.getByTestId("test-demo-scenario-picker")).toHaveClass("grid-cols-1");
    expect(screen.getByTestId("test-demo-scenario-picker")).not.toHaveClass("sm:grid-cols-3");
  });

  it("uses a responsive grid layout for full-width surfaces by default", () => {
    render(
      <InventoryDemoScenarioPicker
        platform="azure"
        selectedScenarioId="customer-intake-modernization"
        onSelectScenario={() => undefined}
        testIdPrefix="test-demo"
      />,
    );

    expect(screen.getByTestId("test-demo-scenario-picker")).toHaveClass("sm:grid-cols-3");
  });
});
