import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MutationReversibilityNotice } from "@/components/operator/MutationReversibilityNotice";

describe("MutationReversibilityNotice (TB-2148)", () => {
  it("renders reversible governance copy with classification marker", () => {
    render(<MutationReversibilityNotice mutationId="governance_quick_approve" />);

    expect(screen.getByTestId("mutation-reversibility-notice-governance_quick_approve")).toHaveAttribute(
      "data-reversibility-class",
      "reversible_with_audit",
    );
    expect(screen.getByText(/audit trail/i)).toBeInTheDocument();
  });
});
