import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AlertsOutstandingNavBadge } from "@/components/alerts/AlertsOutstandingNavBadge";
import { getAlertsInboxSummary } from "@/lib/api/alerts-api";

vi.mock("@/lib/api/alerts-api", () => ({
  getAlertsInboxSummary: vi.fn(),
}));

const getAlertsInboxSummaryMock = vi.mocked(getAlertsInboxSummary);

describe("AlertsOutstandingNavBadge", () => {
  beforeEach(() => {
    getAlertsInboxSummaryMock.mockReset();
  });

  it("renders nothing when open count is zero", async () => {
    getAlertsInboxSummaryMock.mockResolvedValue({
      openCount: 0,
      acknowledgedCount: 1,
      resolvedCount: 2,
      blockingCount: 0,
    });

    const { container } = render(<AlertsOutstandingNavBadge />);

    await waitFor(() => {
      expect(getAlertsInboxSummaryMock).toHaveBeenCalledTimes(1);
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("renders the open-alert count when outstanding alerts exist", async () => {
    getAlertsInboxSummaryMock.mockResolvedValue({
      openCount: 3,
      acknowledgedCount: 0,
      resolvedCount: 0,
      blockingCount: 1,
    });

    render(<AlertsOutstandingNavBadge />);

    const badge = await screen.findByTestId("alerts-outstanding-nav-badge");

    expect(badge).toHaveTextContent("3");
    expect(badge).toHaveAttribute("aria-label", "3 open alerts");
  });

  it("uses singular aria-label for one open alert", async () => {
    getAlertsInboxSummaryMock.mockResolvedValue({
      openCount: 1,
      acknowledgedCount: 0,
      resolvedCount: 0,
      blockingCount: 0,
    });

    render(<AlertsOutstandingNavBadge />);

    expect(await screen.findByTestId("alerts-outstanding-nav-badge")).toHaveAttribute(
      "aria-label",
      "1 open alert",
    );
  });

  it("renders nothing when the inbox summary request fails", async () => {
    getAlertsInboxSummaryMock.mockRejectedValue(new Error("network"));

    const { container } = render(<AlertsOutstandingNavBadge />);

    await waitFor(() => {
      expect(getAlertsInboxSummaryMock).toHaveBeenCalledTimes(1);
    });

    expect(container).toBeEmptyDOMElement();
  });
});
