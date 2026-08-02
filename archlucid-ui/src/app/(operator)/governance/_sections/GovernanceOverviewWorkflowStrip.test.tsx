import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GOVERNANCE_OVERVIEW_APPROVAL_LIFECYCLE_STEPS } from "@/lib/governance-overview-copy";

import { GovernanceOverviewWorkflowStrip } from "./GovernanceOverviewWorkflowStrip";

describe("GovernanceOverviewWorkflowStrip", () => {
  it("renders the approval lifecycle steps", () => {
    render(<GovernanceOverviewWorkflowStrip />);

    expect(screen.getByTestId("governance-overview-workflow-strip")).toBeInTheDocument();

    for (const step of GOVERNANCE_OVERVIEW_APPROVAL_LIFECYCLE_STEPS) {
      expect(screen.getByText(step)).toBeInTheDocument();
    }
  });
});
