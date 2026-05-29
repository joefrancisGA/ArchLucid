import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OperatorAiQualityProofCard } from "@/components/OperatorAiQualityProofCard";

describe("OperatorAiQualityProofCard", () => {
  it("renders retrieval IR metrics when snapshot loads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
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
        }),
      }),
    );

    render(<OperatorAiQualityProofCard />);

    expect(await screen.findByTestId("operator-ai-quality-proof-card")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Assistant readiness" })).toBeInTheDocument();
    expect(screen.getByText(/Mean recall@5/)).toBeInTheDocument();
  });
});
