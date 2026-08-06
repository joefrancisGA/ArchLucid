import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DigestsScheduleEvidenceOrientationStrip } from "@/components/digests/DigestsScheduleEvidenceOrientationStrip";
import {
  DIGESTS_SCHEDULE_CANONICAL_PATH,
  DIGESTS_SCHEDULE_SOURCES,
} from "@/lib/digests-schedule-evidence-copy";

describe("DigestsScheduleEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking the schedule tab", () => {
    render(<DigestsScheduleEvidenceOrientationStrip />);

    expect(screen.getByTestId("digests-schedule-sources")).toBeInTheDocument();

    // Owner decision 2026-08-05: no claim-boundary band on the digests hub.
    expect(screen.queryByTestId("digests-schedule-claim-discipline")).not.toBeInTheDocument();

    for (const link of DIGESTS_SCHEDULE_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      DIGESTS_SCHEDULE_SOURCES.some((link) => link.href === DIGESTS_SCHEDULE_CANONICAL_PATH),
    ).toBe(false);
  });
});
