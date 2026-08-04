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
    expect(screen.getByTestId("digests-schedule-claim-discipline")).toBeInTheDocument();

    for (const link of DIGESTS_SCHEDULE_SOURCES) {
      expect(screen.getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(
      DIGESTS_SCHEDULE_SOURCES.some((link) => link.href === DIGESTS_SCHEDULE_CANONICAL_PATH),
    ).toBe(false);
  });
});
