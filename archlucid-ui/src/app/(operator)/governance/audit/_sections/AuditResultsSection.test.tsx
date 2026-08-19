import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuditResultsSection } from "./AuditResultsSection";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isNextPublicDemoMode: () => false,
  };
});

vi.mock("./AuditTimelineEventCard", () => ({
  AuditTimelineEventCard: () => <div data-testid="audit-timeline-event-card" />,
}));

vi.mock("./AuditEventsOperatorTable", () => ({
  AuditEventsOperatorTable: () => <div data-testid="audit-events-operator-table" />,
}));

describe("AuditResultsSection buyer completion download", () => {
  it("shows WhyDisabled when completion CSV download is blocked by date range", () => {
    render(
      <AuditResultsSection
        buyerPolishedShell
        viewMode="story"
        onViewModeChange={vi.fn()}
        callerAuthorityRank={100}
        events={[
          {
            eventId: "e1",
            occurredUtc: "2026-01-01T00:00:00Z",
            eventType: "x",
            summary: "s",
            actorUserName: "system",
          } as never,
        ]}
        displayEvents={[
          {
            eventId: "e1",
            occurredUtc: "2026-01-01T00:00:00Z",
            eventType: "x",
            summary: "s",
            actorUserName: "system",
          } as never,
        ]}
        displayEventGroups={null}
        hasMoreResults={false}
        loadingMore={false}
        searching={false}
        uniformRunIdForDisplay={null}
        auditSearchEmptyLine=""
        reviewPackageHref="/architecture/reviews/r1"
        onClearFilters={vi.fn()}
        onChooseAnotherReview={vi.fn()}
        loadMore={vi.fn()}
        csvExportUiAllowed={false}
        exporting={false}
        exportDateRangeReady={false}
        exportRoleOk={true}
        onExportCsv={vi.fn()}
      />,
    );

    expect(screen.getByTestId("audit-buyer-completion-download")).toBeDisabled();
    expect(screen.getByTestId("audit-buyer-completion-download-disabled-hint")).toHaveTextContent(
      /Start date and End date/i,
    );
  });
});
