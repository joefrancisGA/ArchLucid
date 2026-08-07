import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompareFindingCorrelationPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel";

describe("CompareFindingCorrelationPanel", () => {
  it("renders export-parity metadata when present", () => {
    render(
      <CompareFindingCorrelationPanel
        loading={false}
        softFailureMessage={null}
        metadata={{
          primaryCorrelationMethod: "PolicyRuleAndFingerprint",
          honestyNote: "Finding pairs matched on policy rule id and normalized fingerprint.",
          policyRuleMatchCount: 3,
          fuzzyMatchCount: 0,
          unmatchedLeftCount: 1,
          unmatchedRightCount: 0,
        }}
      />,
    );

    expect(screen.getByTestId("compare-finding-correlation-section")).toBeInTheDocument();
    expect(screen.getByTestId("compare-finding-correlation-method")).toHaveTextContent(
      "Policy rule + fingerprint",
    );
    expect(screen.getByTestId("compare-finding-correlation-dedupe-key")).toHaveTextContent(
      "{policyRuleId}:{normalizedFindingFingerprint}",
    );
    expect(screen.getByTestId("compare-finding-correlation-honesty")).toHaveTextContent(
      "Finding pairs matched on policy rule id and normalized fingerprint.",
    );
    expect(screen.getByTestId("compare-finding-correlation-counts")).toHaveTextContent("Policy-rule matches");
    expect(screen.getByTestId("compare-finding-correlation-counts")).toHaveTextContent("3");
  });

  it("renders soft failure without blocking message", () => {
    render(
      <CompareFindingCorrelationPanel
        loading={false}
        softFailureMessage="finding correlation metadata"
        metadata={null}
      />,
    );

    expect(screen.getByText(/Could not load finding correlation metadata/i)).toBeInTheDocument();
  });
});
