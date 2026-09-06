import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

import { AuthorityPipelineTimeline } from "@/components/AuthorityPipelineTimeline";
import type { PipelineTimelineItem } from "@/types/authority";

describe("AuthorityPipelineTimeline", () => {
  it("renders ordered audit rows with UTC timestamps and status tags", () => {
    const items: PipelineTimelineItem[] = [
      {
        eventId: "11111111-1111-1111-1111-111111111111",
        occurredUtc: "2026-04-01T12:00:00.000Z",
        eventType: "RunStarted",
        actorUserName: "system",
        correlationId: "c1",
      },
      {
        eventId: "22222222-2222-2222-2222-222222222222",
        occurredUtc: "2026-04-01T13:00:00.000Z",
        eventType: "RunCompleted",
        actorUserName: "system",
        correlationId: null,
      },
    ];

    render(<AuthorityPipelineTimeline items={items} />);

    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(bodyRows[0]).toHaveTextContent("Review completed");
    expect(bodyRows[1]).toHaveTextContent("Review started");

    expect(screen.getByText("Review started")).toBeInTheDocument();
    expect(screen.getByText("Review completed")).toBeInTheDocument();
    expect(screen.getByText("Milestone")).toBeInTheDocument();
    expect(screen.getByText("Step")).toBeInTheDocument();
    expect(screen.getAllByText(/UTC/).length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText(/RunStarted/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/RunCompleted/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/c1/)).toBeInTheDocument();
    expect(screen.getByText(/11111111-1111-1111-1111-111111111111/)).toBeInTheDocument();
  });

  it("shows empty guidance when there are no events", () => {
    render(<AuthorityPipelineTimeline items={[]} />);

    expect(screen.getByText(/No events recorded/)).toBeInTheDocument();
  });

  it("shows load error message when provided", () => {
    render(
      <AuthorityPipelineTimeline items={null} loadErrorMessage="unauthorized" />,
    );

    expect(screen.getByText(/Audit trail could not be loaded/)).toBeInTheDocument();
    expect(screen.getByText(/unauthorized/)).toBeInTheDocument();
  });

  it("hides per-event technical details when omitEventTechnicalDetails is set", () => {
    const items: PipelineTimelineItem[] = [
      {
        eventId: "11111111-1111-1111-1111-111111111111",
        occurredUtc: "2026-04-01T12:00:00.000Z",
        eventType: "RunStarted",
        actorUserName: "system",
        correlationId: "c1",
      },
    ];

    render(<AuthorityPipelineTimeline items={items} omitEventTechnicalDetails />);

    expect(screen.queryByText(/Technical details/i)).toBeNull();
    expect(screen.queryByText(/11111111-1111-1111-1111-111111111111/)).toBeNull();
    expect(screen.getByText("Review started")).toBeInTheDocument();
  });

  it("maps dotted canonical types into reviewer-facing headlines", () => {
    const items: PipelineTimelineItem[] = [
      {
        eventId: "33333333-3333-3333-3333-333333333333",
        occurredUtc: "2026-04-01T12:00:00.000Z",
        eventType: "com.archlucid.authority.run.completed",
        actorUserName: "Jordan Lee",
        correlationId: null,
      },
    ];

    render(<AuthorityPipelineTimeline items={items} />);

    expect(screen.getByText("Review finalized")).toBeInTheDocument();
  });

  it("gives each technical-details disclosure a distinct accessible name", () => {
    const items: PipelineTimelineItem[] = [
      {
        eventId: "11111111-1111-1111-1111-111111111111",
        occurredUtc: "2026-04-01T12:00:00.000Z",
        eventType: "RunStarted",
        actorUserName: "system",
        correlationId: null,
      },
      {
        eventId: "22222222-2222-2222-2222-222222222222",
        occurredUtc: "2026-04-01T12:00:00.400Z",
        eventType: "RunCompleted",
        actorUserName: "system",
        correlationId: null,
      },
    ];

    render(<AuthorityPipelineTimeline items={items} />);

    expect(screen.getByLabelText("Technical details for Review started")).toBeInTheDocument();
    expect(screen.getByLabelText("Technical details for Review completed")).toBeInTheDocument();
    expect(screen.queryByText(/0s after prior event/)).toBeNull();
    expect(screen.queryByText(/^\+0s$/)).toBeNull();
  });

  it("limits visible rows when maxVisibleItems is set", () => {
    const items: PipelineTimelineItem[] = Array.from({ length: 8 }, (_, index) => ({
      eventId: `00000000-0000-0000-0000-${String(index).padStart(12, "0")}`,
      occurredUtc: `2026-04-01T12:00:${String(index).padStart(2, "0")}.000Z`,
      eventType: "RunStarted",
      actorUserName: "system",
      correlationId: null,
    }));

    render(<AuthorityPipelineTimeline items={items} maxVisibleItems={5} />);

    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(bodyRows).toHaveLength(5);
    expect(bodyRows[0]).toHaveTextContent("12:00:07");
    expect(bodyRows[4]).toHaveTextContent("12:00:03");
  });
});
