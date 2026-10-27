import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FeasibilityVerdictDriversPanel } from "@/components/feasibility/FeasibilityVerdictDriversPanel";

describe("FeasibilityVerdictDriversPanel", () => {
  it("labels a missing transparency trail without hiding the section", () => {
    render(<FeasibilityVerdictDriversPanel drivers={[]} transparencyTrail={null} />);

    expect(screen.getByText(/transparency trail was not returned/i)).toBeInTheDocument();
  });

  it("labels an empty driver list when the trail exists", () => {
    render(
      <FeasibilityVerdictDriversPanel
        drivers={[]}
        transparencyTrail={{ asserted: [], inferred: [], skipped: [] }}
      />,
    );

    expect(screen.getByText(/Structured verdict drivers were stored empty/i)).toBeInTheDocument();
  });
});
