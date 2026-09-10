import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  ALERTS_INBOX_BUYER_START_HERE_HELPER,
  ALERTS_INBOX_PAGE_LEAD,
} from "@/lib/alerts-inbox-page-copy";
import { ALERTS_INBOX_ALL_STATUSES_VALUE } from "@/app/(operator)/governance/alerts/_sections/load-alerts-inbox-page-model";

vi.mock("@/components/alerts/use-alerts-inbox-controller", () => ({
  useAlertsInboxController: () => ({
    actionBusy: false,
    actionComment: "",
    actionLoopAlertId: null,
    actionLoopData: null,
    actionLoopError: null,
    actionLoopFindingHref: null,
    actionLoopLoading: false,
    alerts: [],
    allVisibleSelected: false,
    archiveBusyAlertId: null,
    batchAckBusy: false,
    buyerPolishedShell: true,
    canGoNext: false,
    canGoPrevious: false,
    canMutateAlertInbox: false,
    changeStatusFilter: vi.fn(),
    clearPendingAction: vi.fn(),
    closeActionLoopDialog: vi.fn(),
    emptyFilteredProps: null,
    workspaceScopeEmptyTeaching: null,
    failure: null,
    goNextPage: vi.fn(),
    goPreviousPage: vi.fn(),
    hasMore: false,
    lastRefreshedUtc: null,
    loading: false,
    onAcknowledgeSelected: vi.fn(),
    onArchiveAlert: vi.fn(),
    onConfirmActionDialog: vi.fn(),
    openRoutingDelivery: vi.fn(),
    page: 1,
    pageMixSummary: null,
    pendingAction: null,
    queuePendingAction: vi.fn(),
    selectedAlertIds: [],
    setActionComment: vi.fn(),
    severity: "",
    status: ALERTS_INBOX_ALL_STATUSES_VALUE,
    summaryCounts: null,
    summaryLoading: false,
    toggleAlertSelected: vi.fn(),
    toggleSelectAllVisible: vi.fn(),
    visibleAlerts: [],
    scopedRunId: "",
    scopedRunFilterActive: false,
    onPickReviewForTriage: vi.fn(),
    workspaceContext: { hasAlertRules: true, loading: false },
    load: vi.fn(),
  }),
}));

vi.mock("@/components/alerts/AlertsInboxSummaryRow", () => ({
  AlertsInboxSummaryRow: () => <div data-testid="stub-summary-row" />,
}));

vi.mock("@/components/alerts/AlertsInboxPickReviewBeforeTriageStrip", () => ({
  AlertsInboxPickReviewBeforeTriageStrip: () => <div data-testid="stub-pick-review" />,
}));

vi.mock("@/components/alerts/AlertsInboxAlertListSection", () => ({
  AlertsInboxAlertListSection: () => <div data-testid="stub-alert-list" />,
}));

vi.mock("@/components/alerts/AlertsInboxControls", () => ({
  AlertsInboxControls: () => <div data-testid="stub-controls" />,
}));

vi.mock("@/components/alerts/alerts-inbox-deferred-chunks", () => ({
  AlertsInboxDialogsDeferred: () => null,
}));

import { AlertsInboxInteractiveClient } from "@/components/alerts/AlertsInboxInteractiveClient";

describe("AlertsInboxInteractiveClient buyer-polished shell (AL)", () => {
  it("renders first-viewport intro and hides rank cue in buyer shell", () => {
    render(<AlertsInboxInteractiveClient />);

    expect(screen.getByTestId("alerts-inbox-first-viewport")).toBeInTheDocument();
    expect(screen.getByTestId("alerts-inbox-intro")).toHaveTextContent(ALERTS_INBOX_PAGE_LEAD);
    expect(screen.getByTestId("alerts-inbox-buyer-start-here-helper")).toHaveTextContent(
      ALERTS_INBOX_BUYER_START_HERE_HELPER,
    );
    expect(screen.queryByText("Writes below: API-enforced.")).not.toBeInTheDocument();
  });
});
