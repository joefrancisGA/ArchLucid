import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailGovernanceAlerts } from "@/components/reviews/RunDetailGovernanceAlerts";

describe("RunDetailGovernanceAlerts", () => {
  it("renders governance warning and last failure reason when present", () => {
    render(
      <RunDetailGovernanceAlerts
        run={{
          runId: "run-1",
          projectId: "project-1",
          createdUtc: "2026-01-01T00:00:00Z",
          hasGovernanceWarnings: true,
          lastFailureReason: "Compliance agent timed out after 120s.",
        }}
      />,
    );

    expect(screen.getByTestId("run-detail-governance-warning-banner")).toBeInTheDocument();
    expect(screen.getByTestId("run-detail-last-failure-reason")).toHaveTextContent(
      "Compliance agent timed out after 120s.",
    );
  });

  it("returns null when no governance signals are present", () => {
    const { container } = render(
      <RunDetailGovernanceAlerts
        run={{
          runId: "run-1",
          projectId: "project-1",
          createdUtc: "2026-01-01T00:00:00Z",
          hasGovernanceWarnings: false,
          lastFailureReason: null,
        }}
      />,
    );

    expect(container.firstChild).toBeNull();
  });
});
