import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ManifestFeasibilityVerdict } from "@/types/feasibility-verdict";

import { RunDetailFeasibilityVerdictSection } from "./RunDetailFeasibilityVerdictSection";

describe("RunDetailFeasibilityVerdictSection", () => {
  it("renders verdict kind, summary, and transparency trail counts", () => {
    const verdict: ManifestFeasibilityVerdict = {
      kind: "SoftInfeasible",
      summary: "Policy controls are not satisfied for the proposed architecture.",
      softEnvelope: {
        confidenceLow: 50,
        confidenceHigh: 80,
        envelopeDescription: "Holds for this manifest snapshot.",
        softAssumption: "Operator intent matches asserted inputs.",
        costOfBeingWrong: "Shipping policy gaps to production.",
      },
      transparencyTrail: {
        asserted: [{ key: "businessOutcome", value: "Reduce triage time" }],
        inferred: [
          {
            key: "finding.blocking.finding-99",
            value: "Accepted finding finding-99 is Error or Critical.",
            confidence: 90,
          },
          { key: "policy.violation.CIS-1.1", value: "Encrypt data at rest", confidence: 85 },
        ],
        skipped: [{ questionKey: "l0.pillar.security", tier: "Must" }],
      },
    };

    render(<RunDetailFeasibilityVerdictSection verdict={verdict} runId="run-1" />);

    expect(screen.getByTestId("run-detail-feasibility-verdict")).toBeInTheDocument();
    expect(screen.getByTestId("feasibility-verdict-drivers")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /finding-99 is error or critical/i })).toHaveAttribute(
      "href",
      "/architecture/reviews/run-1/findings/finding-99",
    );
    expect(screen.getByText(/remediate/i)).toBeInTheDocument();
    expect(screen.getByText(verdict.summary)).toBeInTheDocument();
    expect(screen.getByText(/asserted \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/skipped must intake question/i)).toBeInTheDocument();
    expect(screen.getByText("l0.pillar.security")).toBeInTheDocument();
    expect(screen.queryByText(/skipped \(1\)/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("decision-receipt-export")).toBeInTheDocument();
  });
});
