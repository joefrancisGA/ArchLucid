import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FinalizeReadinessStrip } from "@/components/reviews/FinalizeReadinessStrip";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";

describe("FinalizeReadinessStrip", () => {
  it("shows loading copy while readiness is fetched", () => {
    render(<FinalizeReadinessStrip commitBlockedReason={null} readinessLoading />);

    expect(screen.getByTestId("finalize-readiness-strip-loading")).toHaveTextContent(
      "Checking finalize readiness",
    );
  });

  it("surfaces structured blocks when provided", () => {
    const blocks: FinalizeReadinessBlock[] = [
      {
        layer: "integrity",
        code: "lifecycle_phase_incomplete",
        message: "Commit blocked: authority lifecycle phase is Running.",
      },
    ];

    render(<FinalizeReadinessStrip commitBlockedReason="Commit blocked." commitBlockedBlocks={blocks} />);

    expect(screen.getByTestId("finalize-readiness-block-lifecycle_phase_incomplete")).toBeInTheDocument();
  });

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
