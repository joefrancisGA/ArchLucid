import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DriftResumeLastComparisonRow } from "@/app/(operator)/governance/infrastructure/drift/DriftResumeLastComparisonRow";

describe("DriftResumeLastComparisonRow", () => {
  it("renders resume action", () => {
    const onResume = vi.fn();

    render(<DriftResumeLastComparisonRow onResume={onResume} />);

    expect(screen.getByTestId("infra-drift-resume-last-comparison-row")).toBeInTheDocument();
    screen.getByTestId("infra-drift-resume-last-comparison-open").click();
    expect(onResume).toHaveBeenCalledTimes(1);
  });
});
