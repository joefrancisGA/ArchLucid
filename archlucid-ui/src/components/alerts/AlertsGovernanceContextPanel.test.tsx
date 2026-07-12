import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsGovernanceContextPanel } from "@/components/alerts/AlertsGovernanceContextPanel";
import {
  ALERTS_CONTEXT_NOTE,
  ALERTS_HOW_ALERTS_WORK_LABEL,
  ALERTS_PAGE_SUBTITLE,
  ALERTS_QUICK_GUIDANCE_BULLETS,
} from "@/lib/alerts-page-copy";

describe("AlertsGovernanceContextPanel", () => {
  it("renders contextual note and collapsible help", () => {
    render(<AlertsGovernanceContextPanel canMutateAlertInbox />);

    expect(screen.getByTestId("alerts-governance-context-panel")).toBeInTheDocument();
    expect(screen.getByText(ALERTS_CONTEXT_NOTE)).toBeInTheDocument();
    expect(screen.getByText(ALERTS_HOW_ALERTS_WORK_LABEL)).toBeInTheDocument();
    expect(screen.queryByTestId("inline-guidance-approval-queue")).not.toBeInTheDocument();

    for (const bullet of ALERTS_QUICK_GUIDANCE_BULLETS) {
      expect(screen.getByText(bullet)).toBeInTheDocument();
    }

    expect(screen.getByText(/create at least one enabled rule/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open alerts help" })).toHaveAttribute("href", "/help/alerts");
  });

  it("uses reader-oriented help steps when triage writes are unavailable", () => {
    render(<AlertsGovernanceContextPanel canMutateAlertInbox={false} />);

    expect(screen.getByText(/Operators configure rules and routing/i)).toBeInTheDocument();
    expect(screen.queryByText(/create at least one enabled rule/i)).not.toBeInTheDocument();
  });
});

describe("alerts page copy", () => {
  it("keeps the inbox subtitle action-oriented", () => {
    expect(ALERTS_PAGE_SUBTITLE).toContain("Triage governance");
  });
});
