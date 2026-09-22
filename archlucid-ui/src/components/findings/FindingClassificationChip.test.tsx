import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingClassificationChip } from "@/components/findings/FindingClassificationChip";

describe("FindingClassificationChip (SD-12)", () => {
  it("renders decision-grade with a neutral tag, not Ready", () => {
    render(
      <FindingClassificationChip classification="DecisionGradeFinding" findingId="f-1" />,
    );

    const chip = screen.getByTestId("finding-classification-chip-f-1");

    expect(chip).toHaveTextContent("Decision-grade");
    expect(chip.className).not.toMatch(/ready/i);
  });

  it("renders checklist coverage with needs-attention styling", () => {
    render(<FindingClassificationChip classification="ChecklistCoverage" findingId="f-2" />);

    expect(screen.getByTestId("finding-classification-chip-f-2")).toHaveTextContent("Checklist coverage");
  });

  it("renders checklist-demoted when treatment demotes a finding", () => {
    render(
      <FindingClassificationChip
        classification="ChecklistCoverage"
        treatment={1}
        findingId="f-demoted"
      />,
    );

    expect(screen.getByTestId("finding-classification-chip-f-demoted")).toHaveTextContent("Checklist-demoted");
  });

  it("renders nothing when classification is absent", () => {
    const { container } = render(<FindingClassificationChip classification={null} findingId="f-3" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("shows showReason honesty under the classification chip", () => {
    render(<FindingClassificationChip classification="DecisionGradeFinding" findingId="f-4" showReason />);

    expect(screen.getByTestId("finding-classification-chip-wrap-f-4")).toBeInTheDocument();
    expect(screen.getByText(/Policy-mapped or insight-density-promoted/i)).toBeInTheDocument();
  });
});
