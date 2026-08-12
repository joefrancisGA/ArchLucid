import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { InProductEvidenceChecklist } from "@/components/usability/InProductEvidenceChecklist";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: import("react").ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

vi.mock("@/lib/fetch-health-ready", () => ({
  fetchHealthReadySummary: vi.fn(async () => null),
}));

vi.mock("@/lib/fetch-admin-config-lint", () => ({
  fetchAdminConfigLintSummary: vi.fn(async () => ({
    blockingCount: 0,
    advisoryCount: 0,
    loadFailed: true,
  })),
}));

const fetchCorePilotTeamChecklist = vi.fn();

vi.mock("@/lib/api/tenant-customer-success", () => ({
  fetchCorePilotTeamChecklist: () => fetchCorePilotTeamChecklist(),
}));

describe("InProductEvidenceChecklist", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
    fetchCorePilotTeamChecklist.mockReset();
    fetchCorePilotTeamChecklist.mockResolvedValue([]);
  });

  it("renders without throwing when the checklist body is a non-array (malformed API/mock response)", async () => {
    // Regression for `teamChecklist.some is not a function` (CI #2162): a generic fetch mock can
    // resolve `{ items: [], totalCount: 0 }` instead of an array, which previously crashed `.some`.
    fetchCorePilotTeamChecklist.mockResolvedValue({ items: [], totalCount: 0 } as never);

    renderWithOperatorQuery(<InProductEvidenceChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId("in-product-evidence-checklist")).toBeInTheDocument();
      expect(screen.queryByText("Checking workspace readiness…")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Evidence attached or sample review opened")).toBeInTheDocument();
    expect(screen.queryByText(/\/health\/ready/)).not.toBeInTheDocument();
    expect(screen.getByText("Service connectivity")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open setup guide" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Full walkthrough" })).not.toBeInTheDocument();
  });

  it("marks the evidence step ready when the checklist array reports step 1 complete", async () => {
    fetchCorePilotTeamChecklist.mockResolvedValue([
      { stepIndex: 1, isCompleted: true, updatedUtc: "2026-01-01T00:00:00.000Z" },
    ] as never);

    renderWithOperatorQuery(<InProductEvidenceChecklist />);

    await waitFor(() => {
      expect(screen.getByTestId("in-product-evidence-checklist")).toBeInTheDocument();
      expect(screen.queryByText("Checking workspace readiness…")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Evidence attached or sample review opened")).toBeInTheDocument();
  });
});
