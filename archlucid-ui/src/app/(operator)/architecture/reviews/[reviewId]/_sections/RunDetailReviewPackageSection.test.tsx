import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailReviewPackageSection } from "./RunDetailReviewPackageSection";

describe("RunDetailReviewPackageSection", () => {
  it("omits artifact and decision lines when counts were not stored (P-15)", () => {
    render(
      <RunDetailReviewPackageSection
        manifestId="manifest-1"
        runId="run-1"
        artifactCount={null}
        findingCount={3}
        storedDecisionCount={null}
        showExportActions={false}
      />,
    );

    expect(screen.queryByText(/0 artifacts/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Decisions$/i)).not.toBeInTheDocument();
    expect(screen.getByText(/3 findings/)).toBeInTheDocument();
  });
});
