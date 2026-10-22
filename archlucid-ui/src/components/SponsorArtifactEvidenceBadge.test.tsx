import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SponsorArtifactEvidenceBadge } from "@/components/SponsorArtifactEvidenceBadge";

describe("SponsorArtifactEvidenceBadge", () => {
  it("renders source and freshness badges", () => {
    render(
      <SponsorArtifactEvidenceBadge
        savingsPricingBasis="Uploaded actual/amortized"
        costEvidenceFreshnessStatus="Fresh"
      />,
    );

    expect(screen.getByTestId("sponsor-evidence-source-badge")).toHaveTextContent("Uploaded actual/amortized");
    expect(screen.getByTestId("sponsor-evidence-freshness-badge")).toHaveTextContent("Fresh");
    expect(screen.queryByTestId("sponsor-evidence-send-warning")).toBeNull();
  });

  it("shows a sponsor-send warning for demo-derived evidence", () => {
    render(<SponsorArtifactEvidenceBadge isDemoTenant costEvidenceFreshnessStatus="Fresh" />);

    expect(screen.getByTestId("sponsor-evidence-source-badge")).toHaveTextContent("Demo-derived");
    expect(screen.getByTestId("sponsor-evidence-send-warning")).toBeTruthy();
  });
});
