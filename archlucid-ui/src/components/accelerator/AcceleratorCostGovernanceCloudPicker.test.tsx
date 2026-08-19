import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AcceleratorCostGovernanceCloudPicker } from "@/components/accelerator/AcceleratorCostGovernanceCloudPicker";

describe("AcceleratorCostGovernanceCloudPicker", () => {
  it("applies visible focus ring classes to cloud option labels", () => {
    render(
      <AcceleratorCostGovernanceCloudPicker
        selectedPackId="azure-cost-governance"
        onSelectedPackIdChange={() => undefined}
        optionTestIdPrefix="test-cloud"
      />,
    );

    const azureOption = screen.getByTestId("test-cloud-azure-cost-governance");

    expect(azureOption.className).toContain("has-[:focus-visible]:outline");
    expect(azureOption.className).toContain("has-[:focus-visible]:outline-[var(--al-accent-border-focus)]");
  });
});
