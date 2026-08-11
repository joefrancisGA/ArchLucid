import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecurrenceScheduleExamplesSection } from "@/components/governance/RecurrenceScheduleExamplesSection";
import { RECURRENCE_SCHEDULE_EXAMPLES } from "@/lib/recurrence-schedules-copy";

vi.mock("@/lib/recurrence-local-time", async () => {
  const actual = await vi.importActual<typeof import("@/lib/recurrence-local-time")>(
    "@/lib/recurrence-local-time",
  );

  return {
    ...actual,
    resolveRecurrenceDisplayTimeZoneId: () => "America/New_York",
  };
});

describe("RecurrenceScheduleExamplesSection (TB-1132 / TB-2210)", () => {
  it("shows local cadence as the primary subtitle and demotes UTC + cron", () => {
    render(<RecurrenceScheduleExamplesSection />);

    const first = RECURRENCE_SCHEDULE_EXAMPLES[0];

    expect(first).toBeDefined();
    expect(screen.getByText(/Quarterly on the 1st at \d{1,2}:\d{2} [AP]M \(America\/New_York\)/)).toBeInTheDocument();
    expect(screen.getAllByText(/Server schedule \(UTC\):/).length).toBe(RECURRENCE_SCHEDULE_EXAMPLES.length);
    expect(screen.getByText(`Cron (UTC): ${first!.cronExpression}`)).toBeInTheDocument();

    const humanLines = screen.getAllByTestId("recurrence-schedule-example-human-cadence");
    const cronLines = screen.getAllByTestId("recurrence-schedule-example-cron");

    expect(humanLines).toHaveLength(RECURRENCE_SCHEDULE_EXAMPLES.length);
    expect(cronLines).toHaveLength(RECURRENCE_SCHEDULE_EXAMPLES.length);

    for (const line of humanLines) {
      expect(line.textContent).not.toMatch(/^\d+\s+\d+\s+/);
      expect(line.textContent).toMatch(/America\/New_York/);
      expect(line.textContent).toMatch(/Server schedule \(UTC\):/);
    }

    expect(humanLines[0]?.textContent).toContain(first!.humanCadence);
  });

  it("renders compact chooser without when-to-use card body (TB-1133)", () => {
    render(<RecurrenceScheduleExamplesSection variant="compact" />);

    expect(screen.getByTestId("recurrence-schedule-examples")).toHaveAttribute("data-variant", "compact");
    expect(screen.getByText("Start from a common cadence")).toBeInTheDocument();
    expect(screen.queryByText(RECURRENCE_SCHEDULE_EXAMPLES[0]!.whenToUse)).not.toBeInTheDocument();
    expect(screen.getByText(/Quarterly on the 1st at \d{1,2}:\d{2} [AP]M \(America\/New_York\)/)).toBeInTheDocument();

    const humanLines = screen.getAllByTestId("recurrence-schedule-example-human-cadence");

    expect(humanLines[0]?.textContent).toContain(RECURRENCE_SCHEDULE_EXAMPLES[0]!.humanCadence);
  });

  it("invokes onApplyExample with cron when an example is clicked", () => {
    const onApplyExample = vi.fn();
    const first = RECURRENCE_SCHEDULE_EXAMPLES[0]!;

    render(<RecurrenceScheduleExamplesSection onApplyExample={onApplyExample} />);

    fireEvent.click(screen.getByTestId(`recurrence-schedule-example-${first.cronExpression}`));

    expect(onApplyExample).toHaveBeenCalledTimes(1);
    expect(onApplyExample).toHaveBeenCalledWith(first);
  });
});
