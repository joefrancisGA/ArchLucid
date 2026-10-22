import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReportProblemSurfaceCoverageTable } from "@/components/help/ReportProblemSurfaceCoverageTable";
import { REPORT_PROBLEM_V1_SURFACES } from "@/lib/report-problem-surfaces";

describe("ReportProblemSurfaceCoverageTable", () => {
  it("enumerates every registry surface and states the validation-only 400 exclusion", () => {
    render(<ReportProblemSurfaceCoverageTable />);

    const section = screen.getByTestId("report-problem-surface-coverage");
    expect(section.textContent).toMatch(/validation-only HTTP 400/i);
    expect(section.textContent?.toLowerCase() ?? "").not.toContain("typical");
    expect(section.textContent?.toLowerCase() ?? "").not.toContain("include review load");
    expect(section.textContent ?? "").not.toMatch(/\bV1\b/i);

    for (const surface of REPORT_PROBLEM_V1_SURFACES) {
      expect(section.textContent).toContain(surface.id);
      expect(section.textContent).toContain(surface.description);
    }
  });
});
