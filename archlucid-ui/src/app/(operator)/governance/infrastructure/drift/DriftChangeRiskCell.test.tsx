import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { InfraEvidenceDiffChange } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { DriftChangeRiskCell } from "./DriftChangeRiskCell";

function buildChange(
  overrides: Partial<InfraEvidenceDiffChange> = {},
): InfraEvidenceDiffChange {
  return {
    changeId: "change-1",
    diffId: "diff-1",
    cloudResourceId: null,
    azureResourceId: "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Compute/virtualMachines/vm-1",
    changeType: 1,
    property: "sku",
    oldValue: null,
    newValue: null,
    riskClassification: null,
    securitySignificance: null,
    architectureSignificance: null,
    evidenceReference: null,
    ...overrides,
  };
}

describe("DriftChangeRiskCell", () => {
  it("renders plain text for none and unknown risk", () => {
    const { rerender } = render(<DriftChangeRiskCell change={buildChange({ riskClassification: null })} />);

    expect(screen.getByTestId("infra-drift-risk-label")).toHaveTextContent("None");
    expect(screen.getByTestId("infra-drift-risk-label").tagName).toBe("SPAN");

    rerender(<DriftChangeRiskCell change={buildChange({ riskClassification: "unknown" })} />);

    expect(screen.getByTestId("infra-drift-risk-label")).toHaveTextContent("Unknown");
    expect(screen.getByTestId("infra-drift-risk-label").tagName).toBe("SPAN");
  });

  it("renders a tooltip trigger for classified risk", () => {
    render(
      <DriftChangeRiskCell
        change={buildChange({
          riskClassification: "elevated",
          securitySignificance: "network-exposure",
          changeType: "NetworkExposureChanged",
          property: "publicNetworkAccess",
        })}
      />,
    );

    expect(screen.getByTestId("infra-drift-risk-label")).toHaveTextContent("Elevated");
    expect(screen.getByRole("button", { name: "Elevated risk details" })).toBeInTheDocument();
  });
});
