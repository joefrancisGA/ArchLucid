import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FinalizeReadinessChecklistParityBanner } from "@/components/reviews/FinalizeReadinessChecklistParityBanner";

describe("FinalizeReadinessChecklistParityBanner", () => {
  it("renders nothing when checklist and readiness agree", () => {
    const { container } = render(
      <FinalizeReadinessChecklistParityBanner checklistReadyToFinalize={false} readinessReadyToFinalize={false} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("surfaces guidance when checklist and readiness disagree", () => {
    render(
      <FinalizeReadinessChecklistParityBanner checklistReadyToFinalize={false} readinessReadyToFinalize={true} />,
    );

    expect(screen.getByTestId("finalize-readiness-checklist-parity-banner")).toHaveTextContent(
      "Checklist and finalize readiness differ",
    );
    expect(screen.getByText(/finalize button follows the server readiness contract/i)).toBeInTheDocument();
  });
});
