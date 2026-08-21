import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AdvisoryScheduleExamplePreview } from "@/components/advisory/AdvisoryScheduleExamplePreview";
import {
  ADVISORY_SCANS_SCHEDULES_EXAMPLE_PREVIEW_LABEL,
  ADVISORY_SCANS_SCHEDULES_LAST_SCAN_HEADER,
  ADVISORY_SCANS_SCHEDULES_NEXT_SCAN_HEADER,
} from "@/lib/advisory-copy";

describe("AdvisoryScheduleExamplePreview", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-20T15:30:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders scan column headers and an accessible example row", () => {
    render(<AdvisoryScheduleExamplePreview projectLabel="claims-intake" displayTimeZoneId="UTC" />);

    expect(screen.getByRole("columnheader", { name: ADVISORY_SCANS_SCHEDULES_NEXT_SCAN_HEADER })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: ADVISORY_SCANS_SCHEDULES_LAST_SCAN_HEADER })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: ADVISORY_SCANS_SCHEDULES_EXAMPLE_PREVIEW_LABEL })).toBeInTheDocument();
    expect(screen.getByTestId("advisory-schedule-example-row")).not.toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Ready")).toBeInTheDocument();
  });
});
