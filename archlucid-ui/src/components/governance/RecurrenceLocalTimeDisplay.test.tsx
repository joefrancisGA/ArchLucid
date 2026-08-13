import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RecurrenceLocalTimeDisplay } from "@/components/governance/RecurrenceLocalTimeDisplay";
import type { RecurrenceLocalTimeSummary } from "@/lib/recurrence-local-time";

const SERVER_SCHEDULE_PREFIX = /Server schedule \(UTC\):/;

function summary(overrides: Partial<RecurrenceLocalTimeSummary> = {}): RecurrenceLocalTimeSummary {
  return {
    timeZoneId: "America/New_York",
    localPrimary: "Monthly on the 1st at 4:00 AM (America/New_York)",
    utcSecondary: "Monthly on the 1st at 08:00 UTC",
    isUtcZone: false,
    ...overrides,
  };
}

describe("RecurrenceLocalTimeDisplay", () => {
  it("prefers authored UTC cadence over the derived secondary line", () => {
    render(
      <RecurrenceLocalTimeDisplay
        summary={summary()}
        authoredUtcCadence="Annually on January 1 at 08:00 UTC"
        secondaryTestId="utc-line"
      />,
    );

    expect(screen.getByTestId("utc-line")).toHaveTextContent(
      "Server schedule (UTC): Annually on January 1 at 08:00 UTC",
    );
  });

  /**
   * A UTC display zone leaves `utcSecondary` empty because `localPrimary` already states the cadence
   * in UTC. An authored override previously won that null check and printed the cadence twice.
   */
  it("suppresses the server-schedule line when the display zone is already UTC", () => {
    render(
      <RecurrenceLocalTimeDisplay
        summary={summary({
          timeZoneId: "UTC",
          localPrimary: "Annually on January 1 at 08:00 UTC",
          utcSecondary: "",
          isUtcZone: true,
        })}
        authoredUtcCadence="Annually on January 1 at 08:00 UTC"
      />,
    );

    expect(screen.getByText("Annually on January 1 at 08:00 UTC")).toBeInTheDocument();
    expect(screen.queryByText(SERVER_SCHEDULE_PREFIX)).not.toBeInTheDocument();
  });

  it("renders the DST offset basis as a separate helper line when present", () => {
    render(
      <RecurrenceLocalTimeDisplay
        summary={summary({ localOffsetBasis: "Shifts to 3:00 AM during EST." })}
        offsetBasisTestId="offset-basis"
      />,
    );

    expect(screen.getByTestId("offset-basis")).toHaveTextContent("Shifts to 3:00 AM during EST.");
  });

  it("omits the offset basis line when the recurrence does not cross a DST boundary", () => {
    render(<RecurrenceLocalTimeDisplay summary={summary()} offsetBasisTestId="offset-basis" />);

    expect(screen.queryByTestId("offset-basis")).not.toBeInTheDocument();
  });
});
