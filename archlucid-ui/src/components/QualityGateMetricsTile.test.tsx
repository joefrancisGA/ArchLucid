import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { QualityGateMetricsTile } from "@/components/QualityGateMetricsTile";
import { fetchOperatorAiQualitySnapshot } from "@/lib/operator/operator-ai-quality-snapshot";
import { resetOperatorQueryClientForTests } from "@/lib/query/operator-query-client";
import { renderWithOperatorQuery } from "@/testing/render-with-operator-query";

vi.mock("@/lib/operator/operator-ai-quality-snapshot", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/operator/operator-ai-quality-snapshot")>();

  return {
    ...actual,
    fetchOperatorAiQualitySnapshot: vi.fn(),
  };
});

vi.mock("@/lib/query/operator-query-persist-client", () => ({
  setupOperatorQueryClientPersistence: () => {},
}));

const fetchSnapshotMock = vi.mocked(fetchOperatorAiQualitySnapshot);

describe("QualityGateMetricsTile", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
    fetchSnapshotMock.mockReset();
    fetchSnapshotMock.mockResolvedValue({
      generatedUtc: "2026-01-01T00:00:00Z",
      disposition: "PASS",
      retrievalIr: {
        casesEvaluated: 31,
        meanRecallAt5: 1,
        meanMrr: 0.92,
        floorRecallAt5: 0.85,
        floorMrr: 0.75,
      },
      remediationLinks: [],
    });
  });

  it("maps PASS to ready styling on operator surface", async () => {
    renderWithOperatorQuery(<QualityGateMetricsTile surface="operator" />);

    await waitFor(() => {
      expect(screen.getByLabelText("Status: PASS")).toBeInTheDocument();
    });

    const statusTag = screen.getByLabelText("Status: PASS");

    expect(statusTag.className).toContain("--al-status-ready-bg");
  });

  it("maps PASS to neutral styling on sponsor surface (FC-46)", async () => {
    renderWithOperatorQuery(<QualityGateMetricsTile surface="sponsor" />);

    await waitFor(() => {
      expect(screen.getByLabelText("Status: PASS")).toBeInTheDocument();
    });

    const statusTag = screen.getByLabelText("Status: PASS");

    expect(statusTag.className).toContain("--al-status-neutral-bg");
    expect(statusTag.className).not.toContain("--al-status-ready-bg");
  });

  it("shows vendor platform scope note on sponsor surface (FC-50)", async () => {
    renderWithOperatorQuery(<QualityGateMetricsTile surface="sponsor" />);

    await waitFor(() => {
      expect(screen.getByText(/ArchLucid platform infrastructure/i)).toBeInTheDocument();
    });
  });
});
