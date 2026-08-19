import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { CompareFindingCorrelationPanel } from "@/app/(operator)/insights/compare-two-reviews/_sections/CompareFindingCorrelationPanel";
import type { CompareFindingLifecycleSummary } from "@/lib/compare-finding-lifecycle";

const METADATA = {
  primaryCorrelationMethod: "PolicyRuleAndFingerprint",
  honestyNote: "Finding pairs matched on policy rule id and normalized fingerprint.",
  policyRuleMatchCount: 3,
  fuzzyMatchCount: 0,
  unmatchedLeftCount: 1,
  unmatchedRightCount: 0,
} as const;

const LIFECYCLE: CompareFindingLifecycleSummary = {
  newlyIdentifiedCount: 2,
  previouslyIdentifiedStillPresentCount: 3,
  confirmedResolvedCount: 1,
  unverifiedResolvedCount: 4,
  absenceNotInformativeCount: 5,
  honestyNote: "Unverified items are simply no longer raised.",
};

const LIFECYCLE_RECORD = {
  state: "CandidateResolved",
  resolutionBasis: "Unverified",
  priorFindingId: "prior-1",
  currentFindingId: null,
  correlationMethod: "PolicyRuleAndFingerprint",
  severity: "High",
  category: "Network",
  message: "Open port",
  sourceAgent: "Critic",
  latestDisposition: null,
} as const;

describe("CompareFindingCorrelationPanel", () => {
  it("renders export-parity metadata when present", () => {
    render(
      <CompareFindingCorrelationPanel
        loading={false}
        softFailureMessage={null}
        metadata={METADATA}
        lifecycle={null}
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
        lifecycle={null}
      />,
    );

    expect(screen.getByText(/Could not load finding correlation metadata/i)).toBeInTheDocument();
  });

  it("omits the lifecycle block when the comparison produced no lifecycle counts", () => {
    render(
      <CompareFindingCorrelationPanel
        loading={false}
        softFailureMessage={null}
        metadata={METADATA}
        lifecycle={null}
      />,
    );

    expect(screen.queryByTestId("compare-finding-lifecycle")).not.toBeInTheDocument();
  });

  it("separates confirmed remediation from unexplained drop-outs", () => {
    render(
      <CompareFindingCorrelationPanel
        loading={false}
        softFailureMessage={null}
        metadata={METADATA}
        lifecycle={LIFECYCLE}
      />,
    );

    expect(screen.getByTestId("compare-finding-lifecycle-confirmed")).toHaveTextContent(
      "Confirmed remediated by a recorded decision",
    );
    expect(screen.getByTestId("compare-finding-lifecycle-unverified")).toHaveTextContent(
      "No longer raised, no decision recorded",
    );
    expect(screen.getByTestId("compare-finding-lifecycle-not-informative")).toHaveTextContent(
      "No longer raised, analysis did not run again",
    );
    expect(screen.getByTestId("compare-finding-lifecycle-honesty")).toHaveTextContent(
      "Unverified items are simply no longer raised.",
    );
  });

  it("renders per-finding lifecycle rows when records are present", () => {
    render(
      <CompareFindingCorrelationPanel
        loading={false}
        softFailureMessage={null}
        metadata={METADATA}
        lifecycle={LIFECYCLE}
        lifecycleRecords={[LIFECYCLE_RECORD]}
        priorRunId="prior-run"
        laterRunId="later-run"
      />,
    );

    expect(screen.getByTestId("compare-finding-lifecycle-records")).toBeInTheDocument();
    expect(screen.getByTestId("compare-finding-lifecycle-record-status")).toHaveTextContent(
      "No longer raised",
    );
    expect(screen.getByRole("link", { name: "Open finding inspect" })).toHaveAttribute(
      "href",
      expect.stringContaining("laterRunId=later-run"),
    );
  });
});
