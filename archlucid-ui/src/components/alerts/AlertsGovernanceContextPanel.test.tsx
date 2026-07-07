import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AlertsGovernanceContextPanel } from "@/components/alerts/AlertsGovernanceContextPanel";
import {
  ALERTS_APPROVAL_QUEUE_GUIDANCE,
  ALERTS_HOW_ALERTS_WORK_LABEL,
  ALERTS_PAGE_SUBTITLE,
  ALERTS_QUICK_GUIDANCE_BULLETS,
} from "@/lib/alerts-page-copy";

describe("AlertsGovernanceContextPanel", () => {
  it("renders approval queue guidance, scan bullets, and collapsible help", () => {
    render(<AlertsGovernanceContextPanel canMutateAlertInbox />);

    expect(screen.getByTestId("alerts-governance-context-panel")).toBeInTheDocument();
    expect(screen.getByTestId("inline-guidance-approval-queue")).toHaveTextContent("Approval queue:");
    expect(screen.getByText(new RegExp(ALERTS_APPROVAL_QUEUE_GUIDANCE, "i"))).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open governance" })).toHaveAttribute("href", "/governance");

    for (const bullet of ALERTS_QUICK_GUIDANCE_BULLETS) {
      expect(screen.getByText(bullet)).toBeInTheDocument();
    }

    expect(screen.getByText(ALERTS_HOW_ALERTS_WORK_LABEL)).toBeInTheDocument();
    expect(screen.getByText(/create at least one enabled rule/i)).toBeInTheDocument();
  });

  it("uses reader-oriented help steps when triage writes are unavailable", () => {
    render(<AlertsGovernanceContextPanel canMutateAlertInbox={false} />);

    expect(screen.getByText(/Operators configure rules and routing/i)).toBeInTheDocument();
    expect(screen.queryByText(/create at least one enabled rule/i)).not.toBeInTheDocument();
  });
});

describe("alerts page copy", () => {
  it("keeps the inbox subtitle action-oriented", () => {
    expect(ALERTS_PAGE_SUBTITLE).toContain("Triage");
  });
});
