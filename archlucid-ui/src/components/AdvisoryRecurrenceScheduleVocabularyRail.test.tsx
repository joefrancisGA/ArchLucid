import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AdvisoryRecurrenceScheduleVocabularyRail } from "@/components/AdvisoryRecurrenceScheduleVocabularyRail";
import {
  ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK,
  ADVISORY_RECURRENCE_SCHEDULE_COMPACT_LINE,
  ADVISORY_RECURRENCE_SCHEDULE_HEADING,
  ADVISORY_RECURRENCE_SCHEDULE_RECURRENCE_LINK,
  ADVISORY_RECURRENCE_SCHEDULE_WHY_TWO,
} from "@/lib/vocabulary/advisory-recurrence-schedule-vocabulary";

describe("AdvisoryRecurrenceScheduleVocabularyRail (TB-2246)", () => {
  it("renders compact strip on advisory schedules with peer link to recurrence", () => {
    render(
      <AdvisoryRecurrenceScheduleVocabularyRail currentSurfaceId="advisory-schedules" />,
    );

    const strip = screen.getByTestId("advisory-recurrence-schedule-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "advisory-schedules");
    expect(strip.textContent ?? "").toContain(ADVISORY_RECURRENCE_SCHEDULE_COMPACT_LINE);

    const peer = screen.getByTestId("advisory-recurrence-schedule-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ADVISORY_RECURRENCE_SCHEDULE_RECURRENCE_LINK.label);
    expect(peer).toHaveAttribute("href", ADVISORY_RECURRENCE_SCHEDULE_RECURRENCE_LINK.href);
  });

  it("renders compact strip on recurrence schedules with peer link to advisory", () => {
    render(
      <AdvisoryRecurrenceScheduleVocabularyRail currentSurfaceId="recurrence-schedules" />,
    );

    expect(screen.getByTestId("advisory-recurrence-schedule-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "recurrence-schedules",
    );

    const peer = screen.getByTestId("advisory-recurrence-schedule-vocabulary-peer-link");
    expect(peer).toHaveTextContent(ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK.label);
    expect(peer).toHaveAttribute("href", ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <AdvisoryRecurrenceScheduleVocabularyRail
        currentSurfaceId="advisory-schedules"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("advisory-recurrence-schedule-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(ADVISORY_RECURRENCE_SCHEDULE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(ADVISORY_RECURRENCE_SCHEDULE_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("advisory-recurrence-schedule-vocabulary-current")).toHaveTextContent(
      ADVISORY_RECURRENCE_SCHEDULE_ADVISORY_LINK.label,
    );
  });
});
