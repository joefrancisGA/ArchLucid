import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunDetailEngineProvenanceRow } from "@/components/reviews/RunDetailEngineProvenanceRow";
import type { ReviewRunEngineProvenance } from "@/lib/review-engine-provenance-display";

const sampleProvenance: ReviewRunEngineProvenance = {
  providerKind: "azure-openai",
  deploymentOrModelId: "gpt-4o-arch",
  promptPackVersion: "architecture-review-v0.4",
  policyPackVersion: "Healthcare Claims v0.2",
  outputSchemaVersion: "FindingsSnapshot v2",
  runTimestampUtc: "2026-06-16T12:00:00Z",
  estimatedCostUsd: 0.0042,
};

describe("RunDetailEngineProvenanceRow", () => {
  it("renders engine and pack metadata", () => {
    render(<RunDetailEngineProvenanceRow provenance={sampleProvenance} />);

    expect(screen.getByText("Engine & model")).toBeInTheDocument();
    expect(screen.getByText("Azure OpenAI / gpt-4o-arch")).toBeInTheDocument();
    expect(screen.getByText("architecture-review-v0.4")).toBeInTheDocument();
    expect(screen.getByText("Healthcare Claims v0.2")).toBeInTheDocument();
    expect(screen.getByText("FindingsSnapshot v2")).toBeInTheDocument();
    expect(screen.getByText("$0.0042")).toBeInTheDocument();
  });
});
