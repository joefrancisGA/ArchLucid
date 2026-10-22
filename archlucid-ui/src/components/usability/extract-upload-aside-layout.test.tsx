import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ExtractUploadConstraintsPanel } from "@/components/usability/ExtractUploadConstraintsPanel";
import { InventoryDemoScenarioPicker } from "@/components/wizard/InventoryDemoScenarioPicker";

describe("extract-upload aside layout", () => {
  it("stacks constraint rows in a single column for the narrow setup rail", () => {
    render(
      <div style={{ width: "17.5rem" }}>
        <ExtractUploadConstraintsPanel />
      </div>,
    );

    const grid = screen.getByTestId("extract-upload-constraints").querySelector("dl");
    expect(grid).toHaveClass("grid-cols-1");
    expect(grid).not.toHaveClass("sm:grid-cols-2");
  });

  it("stacks demo scenario tiles in a single column inside the setup rail", () => {
    render(
      <div style={{ width: "17.5rem" }}>
        <InventoryDemoScenarioPicker
          platform="azure"
          layout="stack"
          selectedScenarioId="customer-intake-modernization"
          onSelectScenario={() => undefined}
          testIdPrefix="extract-upload-demo"
        />
      </div>,
    );

    expect(screen.getByTestId("extract-upload-demo-scenario-picker")).toHaveClass("grid-cols-1");
    expect(screen.getByTestId("extract-upload-demo-scenario-picker")).not.toHaveClass("sm:grid-cols-3");
  });
});
