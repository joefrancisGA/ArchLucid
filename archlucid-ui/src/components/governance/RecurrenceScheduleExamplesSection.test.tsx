import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RecurrenceScheduleExamplesSection } from "@/components/governance/RecurrenceScheduleExamplesSection";
import { RECURRENCE_SCHEDULE_EXAMPLES } from "@/lib/recurrence-schedules-copy";

describe("RecurrenceScheduleExamplesSection (TB-1132)", () => {
  it("shows human cadence as the primary subtitle and demotes cron", () => {
    render(<RecurrenceScheduleExamplesSection />);

    const first = RECURRENCE_SCHEDULE_EXAMPLES[0];

    expect(first).toBeDefined();
    expect(screen.getByText(first!.humanCadence)).toBeInTheDocument();
    expect(screen.getByText(`Cron (UTC): ${first!.cronExpression}`)).toBeInTheDocument();

    const humanLines = screen.getAllByTestId("recurrence-schedule-example-human-cadence");
    const cronLines = screen.getAllByTestId("recurrence-schedule-example-cron");

    expect(humanLines).toHaveLength(RECURRENCE_SCHEDULE_EXAMPLES.length);
    expect(cronLines).toHaveLength(RECURRENCE_SCHEDULE_EXAMPLES.length);

    for (const line of humanLines) {
      expect(line.textContent).not.toMatch(/^\d+\s+\d+\s+/);
    }
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
