import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsGovernanceContextPanel } from "@/components/alerts/AlertsGovernanceContextPanel";
import {
  ALERTS_CONTEXT_NOTE,
  ALERTS_HOW_ALERTS_WORK_LABEL,
  ALERTS_PAGE_SUBTITLE,
} from "@/lib/alerts-page-copy";
import { inAppHelpHref } from "@/lib/product-documentation-registry";

describe("AlertsGovernanceContextPanel", () => {
  it("renders contextual note with a link to alerts help", () => {
    render(<AlertsGovernanceContextPanel canMutateAlertInbox />);

    expect(screen.getByTestId("alerts-governance-context-panel")).toBeInTheDocument();
    expect(screen.getByText(ALERTS_CONTEXT_NOTE)).toBeInTheDocument();

    const helpLink = screen.getByTestId("alerts-how-alerts-work-link");

    expect(helpLink).toHaveTextContent(ALERTS_HOW_ALERTS_WORK_LABEL);
    expect(helpLink).toHaveAttribute("href", inAppHelpHref("alerts"));
    expect(screen.queryByTestId("inline-guidance-approval-queue")).not.toBeInTheDocument();
  });

  it("renders the same orientation copy regardless of triage write access", () => {
    const { rerender } = render(<AlertsGovernanceContextPanel canMutateAlertInbox={false} />);

    expect(screen.getByText(ALERTS_CONTEXT_NOTE)).toBeInTheDocument();
    expect(screen.getByTestId("alerts-how-alerts-work-link")).toBeInTheDocument();

    rerender(<AlertsGovernanceContextPanel canMutateAlertInbox />);

    expect(screen.getByText(ALERTS_CONTEXT_NOTE)).toBeInTheDocument();
    expect(screen.getByTestId("alerts-how-alerts-work-link")).toBeInTheDocument();
  });
});

describe("alerts page copy", () => {
  it("keeps the inbox subtitle action-oriented", () => {
    expect(ALERTS_PAGE_SUBTITLE).toContain("Triage governance");
  });
});
