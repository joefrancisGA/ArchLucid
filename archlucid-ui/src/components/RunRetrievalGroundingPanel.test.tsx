import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunRetrievalGroundingPanel } from "@/components/RunRetrievalGroundingPanel";
import type { RunRetrievalGroundingPayload } from "@/types/agent-forensics";

function payload(overrides: Partial<RunRetrievalGroundingPayload> = {}): RunRetrievalGroundingPayload {
  return {
    runId: "22222222-2222-2222-2222-222222222222",
    traceCount: 1,
    hasDegradedMetadata: false,
    rows: [
      {
        traceId: "33333333-3333-3333-3333-333333333333",
        agentName: "Compliance",
        corpusKind: "PolicyPack",
        retrievedChunkIds: ["chunk-a", "chunk-b", "chunk-c", "chunk-d"],
        documentIds: ["doc-a", "doc-b"],
        scoreSummaries: [{ chunkId: "chunk-a", score: 0.9123 }],
        retrievedChunkCount: 4,
        tokensIn: 120,
        tokensOut: 40,
        citationCoverage: 0.75,
        topK: 5,
        agentExecutionTraceId: "trace-1",
        scoreMetadataMalformed: false,
        documentMetadataMalformed: false,
        createdUtc: "2026-05-28T01:02:03Z",
      },
    ],
    ...overrides,
  };
}

describe("RunRetrievalGroundingPanel", () => {
  it("renders populated retrieval grounding rows", () => {
    render(<RunRetrievalGroundingPanel payload={payload()} failure={null} />);

    expect(screen.getByText("Retrieval grounding (diagnostics)")).toBeInTheDocument();
    expect(screen.getByText("Compliance")).toBeInTheDocument();
    expect(screen.getByText("PolicyPack")).toBeInTheDocument();
    expect(screen.getByText("chunk-a, chunk-b, chunk-c +1")).toBeInTheDocument();
    expect(screen.getByText("doc-a, doc-b")).toBeInTheDocument();
    expect(screen.getByText("chunk-a: 0.9123")).toBeInTheDocument();
    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("120 in / 40 out")).toBeInTheDocument();
  });

  it("renders degraded metadata state", () => {
    render(
      <RunRetrievalGroundingPanel
        payload={payload({
          hasDegradedMetadata: true,
          rows: [
            {
              ...payload().rows[0]!,
              documentIds: [],
              scoreSummaries: [],
              scoreMetadataMalformed: true,
              documentMetadataMalformed: true,
            },
          ],
        })}
        failure={null}
      />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/metadata could not be parsed/i);
    expect(screen.getAllByText("degraded")).toHaveLength(2);
  });

  it("renders absent data state without a noisy table", () => {
    render(
      <RunRetrievalGroundingPanel
        payload={payload({ traceCount: 0, rows: [] })}
        failure={null}
      />,
    );

    expect(screen.getByText(/No retrieval grounding recorded/i)).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders load failures", () => {
    render(
      <RunRetrievalGroundingPanel
        payload={null}
        failure={{
          message: "Boom",
          problem: null,
          correlationId: "corr-1",
          httpStatus: null,
          retryAfterSeconds: null,
        }}
      />,
    );

    expect(screen.getByText("Retrieval grounding could not be loaded.")).toBeInTheDocument();
    expect(screen.getByText(/Boom/i)).toBeInTheDocument();
  });
});
