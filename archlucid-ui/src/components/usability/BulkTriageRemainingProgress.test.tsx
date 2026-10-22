import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { BulkTriageRemainingProgress } from "@/components/usability/BulkTriageRemainingProgress";

describe("BulkTriageRemainingProgress (TB-2213)", () => {
  it("renders the remaining progress chip label", () => {
    render(<BulkTriageRemainingProgress openCount={3} totalInView={12} />);

    const chip = screen.getByTestId("bulk-triage-remaining-progress");

    expect(chip).toHaveTextContent("3 of 12 left");
    expect(chip).toHaveAttribute("aria-label", "3 of 12 left");
    expect(chip).toHaveAttribute("data-complete", "false");
  });

  it("marks complete when open count is zero", () => {
    render(<BulkTriageRemainingProgress openCount={0} totalInView={4} />);

    expect(screen.getByTestId("bulk-triage-remaining-progress")).toHaveAttribute(
      "data-complete",
      "true",
    );
  });

  it("renders nothing when the view is empty", () => {
    const { container } = render(<BulkTriageRemainingProgress openCount={0} totalInView={0} />);

    expect(screen.queryByTestId("bulk-triage-remaining-progress")).not.toBeInTheDocument();
    expect(container).toBeEmptyDOMElement();
  });
});