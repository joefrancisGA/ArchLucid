import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CoverageChecklistPanel } from "./CoverageChecklistPanel";

describe("CoverageChecklistPanel", () => {
  it("lists checklist coverage items", () => {
    render(
      <CoverageChecklistPanel
        items={[
          {
            findingId: "chk-1",
            title: "Add health probes",
            category: "Reliability",
            recommendation: "Configure liveness checks.",
          },
        ]}
      />,
    );

    expect(screen.getByTestId("coverage-checklist-panel")).toBeInTheDocument();
    expect(screen.getByTestId("coverage-checklist-item-chk-1")).toHaveTextContent("Add health probes");
  });

  it("renders nothing when empty", () => {
    const { container } = render(<CoverageChecklistPanel items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
