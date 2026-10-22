import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImpactPreviewContinueLastBaselinePairRow } from "./ImpactPreviewContinueLastBaselinePairRow";

describe("ImpactPreviewContinueLastBaselinePairRow", () => {
  it("renders continue last baseline pair row", () => {
    render(
      <ImpactPreviewContinueLastBaselinePairRow
        pair={{ baselineRunId: "run-1", candidateRunId: "candidate-1" }}
        onResume={() => undefined}
      />,
    );

    expect(screen.getByTestId("impact-preview-continue-last-baseline-pair-row")).toBeInTheDocument();
    expect(screen.getByTestId("impact-preview-continue-last-baseline-pair-open")).toBeInTheDocument();
  });
});
