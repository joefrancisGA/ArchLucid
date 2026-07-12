import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PlanningExportReadinessNote } from "@/components/planning/PlanningExportReadinessNote";
import { isShowSystemAdministrationNavEnabled } from "@/lib/features";
import {
  IMPROVEMENT_PLANNING_DOWNLOAD_REPORT_CTA,
  IMPROVEMENT_PLANNING_EXPORT_DATA_CTA,
  IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE,
} from "@/lib/planning-page-copy";

vi.mock("@/lib/features", () => ({
  isShowSystemAdministrationNavEnabled: vi.fn(() => false),
}));

const mockIsShowSystemAdministrationNavEnabled = vi.mocked(isShowSystemAdministrationNavEnabled);

describe("PlanningExportReadinessNote", () => {
  it("shows product export actions without raw JSON links by default", () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(false);

    render(<PlanningExportReadinessNote />);

    expect(screen.getByText(IMPROVEMENT_PLANNING_EXPORT_SECTION_TITLE)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: IMPROVEMENT_PLANNING_DOWNLOAD_REPORT_CTA })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: IMPROVEMENT_PLANNING_EXPORT_DATA_CTA })).toBeInTheDocument();
    expect(screen.queryByText(/Open JSON in browser/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/GET \/v1\/learning\/report/i)).not.toBeInTheDocument();
  });

  it("moves JSON browser export behind technical options for internal users", () => {
    mockIsShowSystemAdministrationNavEnabled.mockReturnValue(true);

    render(<PlanningExportReadinessNote />);

    expect(screen.getByTestId("planning-technical-export-options")).toBeInTheDocument();
    expect(screen.getByText(/Open JSON in browser/i)).toBeInTheDocument();
  });
});
