import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RemediationPriorityReasonCell } from "./RemediationPriorityReasonCell";

describe("RemediationPriorityReasonCell", () => {
  it("shows the reader sentence in the closed cell and the stored rule line in the disclosure", () => {
    const findingId = "finding-1";
    const breakdownJson = JSON.stringify([
      { Factor: "InternetExposure", NormalizedValue: 1, WeightedContribution: 0.1, Source: "public" },
      { Factor: "DataSensitivity", NormalizedValue: 0.8, WeightedContribution: 0.08, Source: "customer" },
    ]);
    const explanationSummary = "Rule=IE15-priority-v1; Total=0.4200; Factors=11";

    render(
      <RemediationPriorityReasonCell
        findingId={findingId}
        breakdownJson={breakdownJson}
        explanationSummary={explanationSummary}
      />,
    );

    const reason = screen.getByTestId(`remediation-priority-reason-${findingId}`);
    expect(reason).toHaveTextContent("Reachable from the internet. Sensitive data.");
    expect(reason).not.toHaveTextContent("Rule=IE15-priority-v1");
    expect(screen.queryByText(explanationSummary)).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId(`remediation-priority-rule-${findingId}`));
    expect(screen.getByText(explanationSummary)).toBeInTheDocument();
  });
});
