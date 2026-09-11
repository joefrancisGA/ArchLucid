import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { FinalizeReadinessBlockList } from "@/components/reviews/FinalizeReadinessBlockList";
import type { FinalizeReadinessBlock } from "@/types/finalize-readiness";

describe("FinalizeReadinessBlockList", () => {
  it("groups blocks by layer with human-readable labels", () => {
    const blocks: FinalizeReadinessBlock[] = [
      {
        layer: "scorecard",
        code: "scorecard",
        message: "3 open verify-hypothesis findings remain.",
      },
      {
        layer: "governance",
        code: "pre_commit_gate",
        message: "Critical findings exceed policy pack threshold.",
      },
    ];

    render(<FinalizeReadinessBlockList blocks={blocks} />);

    expect(screen.getByTestId("finalize-readiness-layer-scorecard")).toHaveTextContent("Quality scorecard");
    expect(screen.getByTestId("finalize-readiness-layer-governance")).toHaveTextContent("Governance");
    expect(screen.getByTestId("finalize-readiness-block-pre_commit_gate")).toHaveTextContent(
      "Critical findings exceed policy pack threshold.",
    );
  });
});
