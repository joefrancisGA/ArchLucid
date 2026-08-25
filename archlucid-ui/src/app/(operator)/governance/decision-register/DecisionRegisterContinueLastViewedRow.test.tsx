import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DecisionRegisterContinueLastViewedRow } from "./DecisionRegisterContinueLastViewedRow";

describe("DecisionRegisterContinueLastViewedRow", () => {
  it("renders continue row with open link", () => {
    render(
      <DecisionRegisterContinueLastViewedRow
        decision={{
          decisionId: "decision-1",
          manifestId: "manifest-1",
          runId: "run-1",
          category: "Security",
          title: "Approve private endpoints",
          selectedOption: "Accept",
          rationale: "rationale",
          recordedAtUtc: "2026-01-01T00:00:00Z",
          supportingFindingIds: [],
        }}
      />,
    );

    expect(screen.getByTestId("decision-register-continue-last-viewed-row")).toBeInTheDocument();
    expect(screen.getByTestId("decision-register-continue-last-viewed-open")).toHaveAttribute(
      "href",
      "/governance/sealed-records/manifest-1",
    );
  });
});
