import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  usePathname: () => "/architecture/reviews/run-1",
  useRouter: () => ({ refresh: vi.fn(), push: vi.fn(), replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

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

  it.each([
    [null, "Output schema version was not stored."],
    [undefined, "Output schema version was not stored."],
    ["", "Output schema version was stored empty."],
    ["FindingsSnapshot v3", "FindingsSnapshot v3"],
  ])("always renders the output schema value %s", (outputSchemaVersion, expectedValue) => {
    render(
      <RunDetailEngineProvenanceRow
        provenance={{ ...sampleProvenance, outputSchemaVersion }}
      />,
    );

    expect(screen.getByText("Output schema")).toBeInTheDocument();
    expect(screen.getByText(expectedValue)).toBeInTheDocument();
  });

  it("labels omitted prompt pack, policy pack, catalog alias, and cost (P-14–P-16)", () => {
    render(
      <RunDetailEngineProvenanceRow
        provenance={{
          ...sampleProvenance,
          modelAliasId: null,
          promptPackVersion: null,
          policyPackVersion: null,
          estimatedCostUsd: null,
        }}
      />,
    );

    expect(screen.getByText("Catalog alias was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Prompt pack version was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Policy pack version was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Estimated cost was not stored.")).toBeInTheDocument();
  });

  it("renders engine profile and task evaluation provenance honestly", () => {
    render(
      <RunDetailEngineProvenanceRow
        provenance={{
          ...sampleProvenance,
          engineProfileId: null,
          taskEvaluationSnapshotsAtSelection: null,
        }}
      />,
    );

    expect(screen.getByText("Engine profile was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Task evaluations were not stored.")).toBeInTheDocument();
  });

  it("labels empty task evaluation list separately from omitted list", () => {
    render(
      <RunDetailEngineProvenanceRow
        provenance={{
          ...sampleProvenance,
          taskEvaluationSnapshotsAtSelection: [],
        }}
      />,
    );

    expect(screen.getByText("Task evaluations were stored empty.")).toBeInTheDocument();
  });

  it("preserves stored empty and task evaluation values", () => {
    render(
      <RunDetailEngineProvenanceRow
        provenance={{
          ...sampleProvenance,
          engineProfileId: "",
          taskEvaluationSnapshotsAtSelection: [
            { taskType: "Finding", evaluationState: "Passed" },
          ],
        }}
      />,
    );

    expect(screen.getByText("Engine profile was stored empty.")).toBeInTheDocument();
    expect(screen.getByText("Task evaluation: Finding")).toBeInTheDocument();
    expect(screen.getByText("Passed")).toBeInTheDocument();
  });
});
