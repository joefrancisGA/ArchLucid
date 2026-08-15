import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { FindingJobViewLaneCallout } from "@/components/findings/FindingJobViewLaneCallout";

describe("FindingJobViewLaneCallout", () => {
  it("renders nothing for the default triage lane", () => {
    const { container } = render(<FindingJobViewLaneCallout jobView="needs-my-decision" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders lane label and lead for verify-hypotheses", () => {
    render(<FindingJobViewLaneCallout jobView="verify-hypotheses" />);

    expect(screen.getByTestId("finding-job-view-lane-callout")).toBeInTheDocument();
    expect(screen.getByText("Verify hypotheses")).toBeInTheDocument();
    expect(screen.getByText(/adversarial signal/i)).toBeInTheDocument();
  });
});
