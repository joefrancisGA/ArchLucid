import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FinalizeReadinessStrip } from "@/components/reviews/FinalizeReadinessStrip";

describe("FinalizeReadinessStrip", () => {
  it("surfaces execution-failure finalize block copy without cross-referencing Do this next", () => {
    render(
      <FinalizeReadinessStrip commitBlockedReason="Execution failed — re-run the review before finalizing." />,
    );

    expect(screen.getByText(/Finalize is blocked until you resolve the following/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        (_, element) =>
          element?.textContent === "Execution failed — re-run the review before finalizing.",
      ),
    ).toBeInTheDocument();
  });
});
