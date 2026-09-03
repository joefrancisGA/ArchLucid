import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  AlertsInboxControls,
  shouldShowAlertsInboxControls,
} from "@/components/alerts/AlertsInboxControls";
import { OPERATOR_NOT_REFRESHED_LABEL } from "@/lib/operator/operator-last-refreshed-label";

const baseProps = {
  status: "Open",
  page: 1,
  loading: false,
  buyerPolishedShell: true,
  canMutateAlertInbox: true,
  visibleAlertCount: 0,
  selectedAlertCount: 0,
  batchAckBusy: false,
  allVisibleSelected: false,
  pageMixSummary: null as string | null,
  hasLoadFailure: false,
  lastRefreshedUtc: null as string | null,
  onStatusChange: vi.fn(),
  onRefresh: vi.fn(),
  onAcknowledgeSelected: vi.fn(),
  onToggleSelectAllVisible: vi.fn(),
};

describe("shouldShowAlertsInboxControls", () => {
  it("hides controls only when rules are absent and workspace context has settled", () => {
    expect(shouldShowAlertsInboxControls(false, false)).toBe(false);
    expect(shouldShowAlertsInboxControls(false, true)).toBe(true);
    expect(shouldShowAlertsInboxControls(true, false)).toBe(true);
  });
});

describe("AlertsInboxControls", () => {
  it("omits Status, Refresh, last-refreshed, and batch chrome in settled no_rules", () => {
    const { container } = render(
      <AlertsInboxControls {...baseProps} hasAlertRules={false} workspaceContextLoading={false} />,
    );

    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByTestId("alerts-inbox-controls")).toBeNull();
    expect(screen.queryByLabelText("Status")).toBeNull();
    expect(screen.queryByRole("button", { name: "Refresh" })).toBeNull();
    expect(screen.queryByTestId("alerts-inbox-last-updated")).toBeNull();
    expect(screen.queryByTestId("alerts-inbox-bulk-select")).toBeNull();
  });

  it("keeps controls when rules exist (no_reviews / filtered / populated)", () => {
    render(<AlertsInboxControls {...baseProps} hasAlertRules={true} workspaceContextLoading={false} />);

    expect(screen.getByTestId("alerts-inbox-controls")).toBeInTheDocument();
    expect(screen.getByLabelText("Status")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
    expect(screen.getByTestId("alerts-inbox-last-updated")).toHaveTextContent(OPERATOR_NOT_REFRESHED_LABEL);
  });
});
