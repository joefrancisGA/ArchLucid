import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsGovernanceContextPanel } from "@/components/alerts/AlertsGovernanceContextPanel";
import { ALERTS_CONTEXT_NOTE, ALERTS_PAGE_SUBTITLE } from "@/lib/alerts-page-copy";

describe("AlertsGovernanceContextPanel", () => {
  it("renders contextual note without duplicating header help link", () => {
    render(<AlertsGovernanceContextPanel canMutateAlertInbox />);

    expect(screen.getByTestId("alerts-governance-context-panel")).toBeInTheDocument();
    expect(screen.getByText(ALERTS_CONTEXT_NOTE)).toBeInTheDocument();
    expect(screen.queryByTestId("alerts-how-alerts-work-link")).toBeNull();
    expect(screen.queryByTestId("inline-guidance-approval-queue")).not.toBeInTheDocument();
  });

  it("renders the same orientation copy regardless of triage write access", () => {
    const { rerender } = render(<AlertsGovernanceContextPanel canMutateAlertInbox={false} />);

    expect(screen.getByText(ALERTS_CONTEXT_NOTE)).toBeInTheDocument();

    rerender(<AlertsGovernanceContextPanel canMutateAlertInbox />);

    expect(screen.getByText(ALERTS_CONTEXT_NOTE)).toBeInTheDocument();
  });
});

describe("alerts page copy", () => {
  it("keeps the inbox subtitle action-oriented", () => {
    expect(ALERTS_PAGE_SUBTITLE).toContain("Triage approval");
  });
});
