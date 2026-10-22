import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { QuickDecisionAdditionalFindingsList } from "@/components/QuickDecisionAdditionalFindingsList";

describe("QuickDecisionAdditionalFindingsList", () => {
  it("renders a plain list when below the virtualize threshold", () => {
    render(
      <QuickDecisionAdditionalFindingsList
        findings={["a", "b"]}
        renderFinding={(finding) => <li key={finding}>{finding}</li>}
      />,
    );

    expect(screen.getByText("a")).toBeInTheDocument();
    expect(screen.getByText("b")).toBeInTheDocument();
    expect(screen.queryByTestId("quick-decision-additional-findings-virtual-list")).toBeNull();
  });

  it("virtualizes when there are many findings", () => {
    const findings = Array.from({ length: 12 }, (_, index) => `finding-${index}`);

    render(
      <QuickDecisionAdditionalFindingsList
        findings={findings}
        renderFinding={(finding) => <div key={finding}>{finding}</div>}
      />,
    );

    expect(screen.getByTestId("quick-decision-additional-findings-virtual-list")).toBeInTheDocument();
  });
});
