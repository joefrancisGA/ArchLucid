import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PatternLibraryContinueLastViewedRow } from "./PatternLibraryContinueLastViewedRow";

describe("PatternLibraryContinueLastViewedRow", () => {
  it("renders continue row with open link", () => {
    render(
      <PatternLibraryContinueLastViewedRow
        record={{
          patternKey: "private-endpoints-paas",
          name: "Private endpoints for PaaS",
          description: "desc",
          domains: ["Security"],
          platforms: ["Azure"],
          patternType: "Reference architecture",
          adoption: "Emerging",
          risk: "Medium",
          governance: "Policy-backed",
          relatedControls: [],
          relatedPolicyPacks: [],
          reviewCountLabel: "3 reviews",
          tenantCountLabel: "1 tenant",
          overview: "overview",
          whereAppears: "where",
          typicalRisks: [],
          requiredEvidence: [],
          governanceConsiderations: [],
          relatedPolicyRules: [],
          peerPatternKeys: [],
          detailHref: "/insights/patterns/private-endpoints-paas",
        }}
      />,
    );

    expect(screen.getByTestId("pattern-library-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("pattern-library-continue-last-viewed-open")).toHaveAttribute(
      "href",
      "/insights/patterns/private-endpoints-paas",
    );
  });
});
