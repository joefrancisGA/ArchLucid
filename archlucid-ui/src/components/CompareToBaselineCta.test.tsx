import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CompareToBaselineCta } from "@/components/CompareToBaselineCta";
import { COMPARE_BASELINE_RUN_STORAGE_KEY, persistCompareBaselineRunId } from "@/lib/compare-baseline-run";

describe("CompareToBaselineCta", () => {
  afterEach(() => {
    window.localStorage.removeItem(COMPARE_BASELINE_RUN_STORAGE_KEY);
  });

  it("renders nothing when no baseline is set", () => {
    render(<CompareToBaselineCta currentRunId="run-a" />);
    expect(screen.queryByTestId("compare-to-baseline-banner")).toBeNull();
  });

  it("renders nothing when this run is the baseline", () => {
    persistCompareBaselineRunId("run-a");
    render(<CompareToBaselineCta currentRunId="run-a" />);
    expect(screen.queryByTestId("compare-to-baseline-banner")).toBeNull();
  });

  it("renders compare link when baseline differs from current", () => {
    persistCompareBaselineRunId("baseline-1");
    render(<CompareToBaselineCta currentRunId="run-b" />);
    const link = screen.getByTestId("compare-to-baseline-link");
    expect(link).toHaveAttribute("href", expect.stringContaining("baseline-1"));
    expect(link.getAttribute("href")).toContain("run-b");
  });
});
