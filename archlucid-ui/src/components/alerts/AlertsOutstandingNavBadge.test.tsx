import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertsOutstandingNavBadge } from "@/components/alerts/AlertsOutstandingNavBadge";
import { fetchAlertsInboxSummary } from "@/components/alerts/alerts-inbox-query-fetch";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

import { useDeferredOperatorShellStatusQueriesEnabled } from "@/hooks/use-deferred-operator-shell-status-queries-enabled";

vi.mock("@/hooks/use-deferred-operator-shell-status-queries-enabled", () => ({
  useDeferredOperatorShellStatusQueriesEnabled: vi.fn(() => true),
}));

const deferredShellStatusQueriesEnabledMock = vi.mocked(useDeferredOperatorShellStatusQueriesEnabled);

vi.mock("@/components/alerts/alerts-inbox-query-fetch", () => ({
  fetchAlertsInboxSummary: vi.fn(),
}));

vi.mock("@/lib/operator/operator-scope-storage", () => ({
  ARCHLUCID_OPERATOR_SCOPE_CHANGED_EVENT: "archlucid:operator-scope-changed",
  getEffectiveBrowserProxyScopeHeaders: () => ({
    "x-tenant-id": "tenant-1",
    "x-workspace-id": "workspace-1",
    "x-project-id": "project-1",
  }),
}));

const fetchAlertsInboxSummaryMock = vi.mocked(fetchAlertsInboxSummary);

describe("AlertsOutstandingNavBadge (TB-2144)", () => {
  beforeEach(() => {
    resetOperatorQueryClientForTests();
    deferredShellStatusQueriesEnabledMock.mockReturnValue(true);
    fetchAlertsInboxSummaryMock.mockReset();
    fetchAlertsInboxSummaryMock.mockResolvedValue({
      open: 0,
      acknowledged: 0,
      resolved: 0,
      blocking: 0,
      lastEvaluatedUtc: null,
    });
  });

  it("renders nothing when open count is zero", async () => {
    const { container, unmount } = renderWithOperatorQuery(<AlertsOutstandingNavBadge />);

    await waitFor(() => {
      expect(fetchAlertsInboxSummaryMock).toHaveBeenCalledTimes(1);
    });

    expect(container).toBeEmptyDOMElement();
    unmount();
  });

  it("renders the open-alert count when outstanding alerts exist", async () => {
    fetchAlertsInboxSummaryMock.mockResolvedValue({
      open: 3,
      acknowledged: 0,
      resolved: 0,
      blocking: 1,
      lastEvaluatedUtc: null,
    });

    renderWithOperatorQuery(<AlertsOutstandingNavBadge />);

    const badge = await screen.findByTestId("alerts-outstanding-nav-badge");

    expect(badge).toHaveTextContent("3");
    expect(badge).toHaveAttribute("aria-label", "3 open alerts");
  });

  it("uses singular aria-label for one open alert", async () => {
    fetchAlertsInboxSummaryMock.mockResolvedValue({
      open: 1,
      acknowledged: 0,
      resolved: 0,
      blocking: 0,
      lastEvaluatedUtc: null,
    });

    renderWithOperatorQuery(<AlertsOutstandingNavBadge />);

    expect(await screen.findByTestId("alerts-outstanding-nav-badge")).toHaveAttribute(
      "aria-label",
      "1 open alert",
    );
  });

  it("does not refetch inbox summary on remount while query data is still fresh", async () => {
    fetchAlertsInboxSummaryMock.mockResolvedValue({
      open: 2,
      acknowledged: 0,
      resolved: 0,
      blocking: 0,
      lastEvaluatedUtc: null,
    });

    const first = renderWithOperatorQuery(<AlertsOutstandingNavBadge />);

    await screen.findByTestId("alerts-outstanding-nav-badge");
    first.unmount();

    renderWithOperatorQuery(<AlertsOutstandingNavBadge />);

    await screen.findByTestId("alerts-outstanding-nav-badge");
    expect(fetchAlertsInboxSummaryMock).toHaveBeenCalledTimes(1);
  });

  it("does not fetch inbox summary until deferred shell status queries are enabled", async () => {
    deferredShellStatusQueriesEnabledMock.mockReturnValue(false);

    renderWithOperatorQuery(<AlertsOutstandingNavBadge />);

    await waitFor(() => {
      expect(deferredShellStatusQueriesEnabledMock).toHaveBeenCalled();
    });

    expect(fetchAlertsInboxSummaryMock).not.toHaveBeenCalled();
  });
});
