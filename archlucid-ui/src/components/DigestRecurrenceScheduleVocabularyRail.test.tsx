import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestRecurrenceScheduleVocabularyRail } from "@/components/DigestRecurrenceScheduleVocabularyRail";
import {
  DIGEST_RECURRENCE_SCHEDULE_COMPACT_LINE,
  DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK,
  DIGEST_RECURRENCE_SCHEDULE_HEADING,
  DIGEST_RECURRENCE_SCHEDULE_RECURRENCE_LINK,
  DIGEST_RECURRENCE_SCHEDULE_WHY_TWO,
} from "@/lib/vocabulary/digest-recurrence-schedule-vocabulary";

describe("DigestRecurrenceScheduleVocabularyRail (TB-2226)", () => {
  it("renders compact strip on digest schedule with peer link to recurrence", () => {
    render(
      <DigestRecurrenceScheduleVocabularyRail currentSurfaceId="digest-executive-schedule" />,
    );

    const strip = screen.getByTestId("digest-recurrence-schedule-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "compact");
    expect(strip).toHaveAttribute("data-current-surface", "digest-executive-schedule");
    expect(strip.textContent ?? "").toContain(DIGEST_RECURRENCE_SCHEDULE_COMPACT_LINE);

    const peer = screen.getByTestId("digest-recurrence-schedule-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DIGEST_RECURRENCE_SCHEDULE_RECURRENCE_LINK.label);
    expect(peer).toHaveAttribute("href", DIGEST_RECURRENCE_SCHEDULE_RECURRENCE_LINK.href);
  });

  it("renders compact strip on recurrence schedules with peer link to digests", () => {
    render(
      <DigestRecurrenceScheduleVocabularyRail currentSurfaceId="recurrence-schedules" />,
    );

    expect(screen.getByTestId("digest-recurrence-schedule-vocabulary")).toHaveAttribute(
      "data-current-surface",
      "recurrence-schedules",
    );

    const peer = screen.getByTestId("digest-recurrence-schedule-vocabulary-peer-link");
    expect(peer).toHaveTextContent(DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK.label);
    expect(peer).toHaveAttribute("href", DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK.href);
  });

  it("renders full variant with why-two explanation", () => {
    render(
      <DigestRecurrenceScheduleVocabularyRail
        currentSurfaceId="digest-executive-schedule"
        variant="full"
      />,
    );

    const strip = screen.getByTestId("digest-recurrence-schedule-vocabulary");
    expect(strip).toHaveAttribute("data-variant", "full");
    expect(screen.getByText(DIGEST_RECURRENCE_SCHEDULE_HEADING)).toBeInTheDocument();
    expect(screen.getByText(DIGEST_RECURRENCE_SCHEDULE_WHY_TWO)).toBeInTheDocument();
    expect(screen.getByTestId("digest-recurrence-schedule-vocabulary-current")).toHaveTextContent(
      DIGEST_RECURRENCE_SCHEDULE_DIGEST_LINK.label,
    );
  });
});
