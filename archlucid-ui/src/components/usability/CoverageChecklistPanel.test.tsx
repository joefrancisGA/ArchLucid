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
            severityValue: 2,
          },
        ]}
      />,
    );

    expect(screen.getByTestId("coverage-checklist-panel")).toBeInTheDocument();
    expect(screen.getByTestId("coverage-checklist-item-chk-1")).toHaveTextContent("Add health probes");
    expect(screen.getByTestId("coverage-checklist-item-chk-1")).toHaveTextContent("High");
  });

  it("labels missing severity, category, and recommendation on checklist rows", () => {
    render(
      <CoverageChecklistPanel
        items={[
          {
            findingId: "chk-2",
            title: "Checklist title was not stored.",
            category: null,
            recommendation: null,
            severityValue: null,
          },
        ]}
      />,
    );

    const row = screen.getByTestId("coverage-checklist-item-chk-2");

    expect(row).toHaveTextContent("Severity label was not stored.");
    expect(row).toHaveTextContent("Category was not stored.");
    expect(row).toHaveTextContent("Recommendation was not stored.");
  });

  it("renders nothing when empty", () => {
    const { container } = render(<CoverageChecklistPanel items={[]} />);

    expect(container).toBeEmptyDOMElement();
  });
});
