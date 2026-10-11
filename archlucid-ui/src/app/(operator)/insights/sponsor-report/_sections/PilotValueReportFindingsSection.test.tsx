import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PilotValueReportFindingsSection } from "./PilotValueReportFindingsSection";
import type { PilotValueReportJson } from "@/types/pilot-value-report";

vi.mock("next/navigation", () => ({
  usePathname: () => "/insights/sponsor-report",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

const data = {
  tenantId: "tenant-1",
  fromUtc: "2026-01-01T00:00:00Z",
  toUtc: "2026-02-01T00:00:00Z",
  totalRunsCommitted: 1,
  runDetailsTruncated: false,
  runDetailCap: 10,
  totalFindings: 0,
  governanceApprovals: 0,
  governanceRejections: 0,
  governancePendingApprovalsNow: 0,
  policyPackAssignments: 0,
  comparisonOrDriftDetections: 0,
  totalRecommendationsProduced: 0,
  uniqueAgentTypes: [],
  auditExportTruncated: false,
  findingsBySeverity: { critical: 0, high: 0, medium: 0, low: 0, info: 0 },
  committedRunsTimeline: [
    {
      runId: "",
      systemName: "",
      createdUtc: "",
      committedUtc: "",
    },
  ],
} as PilotValueReportJson;

describe("PilotValueReportFindingsSection", () => {
  it("labels missing review table values explicitly", () => {
    render(
      <PilotValueReportFindingsSection
        data={data}
        scopedRunFilterActive={false}
        scopedRunId=""
      />,
    );

    expect(screen.getByText("Review id was not stored")).toBeInTheDocument();
    expect(screen.getByText("System name was not stored")).toBeInTheDocument();
    expect(screen.getByText("Created time was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Finalized time was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Outcome was not stored")).toBeInTheDocument();
    expect(screen.getByText("Highest severity was not stored")).toBeInTheDocument();
    expect(screen.getByText("Open actions were not stored")).toBeInTheDocument();
    expect(screen.getByText("Exceptions or waivers were not stored.")).toBeInTheDocument();
    expect(screen.getByText("Recommendations accepted were not stored.")).toBeInTheDocument();
    expect(screen.getByText("Remediation assignments were not stored.")).toBeInTheDocument();
    expect(screen.getByText("Findings remediated were not stored.")).toBeInTheDocument();
  });
});
