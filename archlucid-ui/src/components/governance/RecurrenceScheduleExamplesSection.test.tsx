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
  it("shows local cadence as the primary subtitle and authored UTC cadence as secondary", () => {
    render(<RecurrenceScheduleExamplesSection />);

    const first = RECURRENCE_SCHEDULE_EXAMPLES[0]!;

    expect(screen.getByText(/Quarterly on the 1st at 4:00 AM EDT/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Server schedule \(UTC\):/).length).toBe(RECURRENCE_SCHEDULE_EXAMPLES.length);
    expect(screen.getByText(`Cron (UTC): ${first.cronExpression}`)).toBeInTheDocument();

    const humanLines = screen.getAllByTestId("recurrence-schedule-example-human-cadence");
    const cronLines = screen.getAllByTestId("recurrence-schedule-example-cron");

    expect(humanLines).toHaveLength(RECURRENCE_SCHEDULE_EXAMPLES.length);
    expect(cronLines).toHaveLength(RECURRENCE_SCHEDULE_EXAMPLES.length);

    for (const [index, line] of humanLines.entries()) {
      const example = RECURRENCE_SCHEDULE_EXAMPLES[index]!;

      expect(line.textContent).not.toMatch(/^\d+\s+\d+\s+/);
      expect(line.textContent).toContain(example.humanCadence);
      expect(line.textContent).toMatch(/Server schedule \(UTC\):/);
    }
  });

  it("renders annual preset as annually, not monthly", () => {
    render(<RecurrenceScheduleExamplesSection />);

    const annual = RECURRENCE_SCHEDULE_EXAMPLES[1]!;

    expect(screen.getByText(annual.title)).toBeInTheDocument();
    expect(screen.getByText(/Annually on January 1 at 3:00 AM EST/i)).toBeInTheDocument();
    expect(screen.getByText(`Server schedule (UTC): ${annual.humanCadence}`)).toBeInTheDocument();

    const annualCadence = screen.getAllByTestId("recurrence-schedule-example-human-cadence")[1];

    expect(annualCadence?.textContent ?? "").not.toMatch(/Monthly on the 1st/i);
  });

  it("renders compact chooser with when-to-use and action affordance (TB-1133 / P0-4)", () => {
    render(<RecurrenceScheduleExamplesSection variant="compact" onApplyExample={() => undefined} />);

    expect(screen.getByTestId("recurrence-schedule-examples")).toHaveAttribute("data-variant", "compact");
    expect(screen.getByText("Start from a common cadence")).toBeInTheDocument();

    for (const example of RECURRENCE_SCHEDULE_EXAMPLES) {
      expect(screen.getByText(example.whenToUse)).toBeInTheDocument();

      // The visible cadence is aria-hidden inside the button, so the accessible name is the only
      // thing telling assistive tech which cadence this row selects. Assert on the parts that
      // carry meaning rather than the exact sentence, so wording can change but coverage cannot.
      const applyButton = screen.getByRole("button", {
        name: (accessibleName: string) =>
          accessibleName.includes(example.title)
          && accessibleName.includes(example.humanCadence)
          && accessibleName.includes("Opens the create recurrence schedule form"),
      });

      expect(applyButton).toBeInTheDocument();
    }

    expect(screen.getAllByText("Use this cadence").length).toBe(RECURRENCE_SCHEDULE_EXAMPLES.length);
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
