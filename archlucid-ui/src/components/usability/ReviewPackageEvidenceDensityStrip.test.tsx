import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewPackageEvidenceDensityStrip } from "@/components/usability/ReviewPackageEvidenceDensityStrip";

describe("ReviewPackageEvidenceDensityStrip (P-13)", () => {
  it("labels a missing finding count as not stored", () => {
    render(
      <ReviewPackageEvidenceDensityStrip
        findingCount={null}
        evidenceArtifactCount={2}
        policiesCheckedLabel={null}
        governanceApprovalLabel={null}
        auditTrailHref={null}
      />,
    );

    expect(screen.getByText("Finding count was not stored.")).toBeInTheDocument();
  });
});
