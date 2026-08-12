import { screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OperatorAiQualityProofCard } from "@/components/operator/OperatorAiQualityProofCard";
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

describe("OperatorAiQualityProofCard", () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetOperatorQueryClientForTests();
    fetchSnapshotMock.mockReset();
  });

  it("renders retrieval IR metrics when snapshot loads", async () => {
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
      remediationLinks: [{ label: "AI docs", path: "docs/library/AGENT_OUTPUT_EVALUATION.md" }],
    });

    renderWithOperatorQuery(<OperatorAiQualityProofCard />);

    await waitFor(() => {
      expect(screen.getByText(/Mean recall@5/)).toBeInTheDocument();
    });

    expect(screen.getByTestId("operator-ai-quality-proof-card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assistant readiness" })).toBeInTheDocument();
  });
});
