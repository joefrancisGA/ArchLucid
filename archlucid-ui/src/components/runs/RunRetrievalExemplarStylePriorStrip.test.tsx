import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { RunRetrievalExemplarStylePriorStrip } from "@/components/runs/RunRetrievalExemplarStylePriorStrip";
import type { RunRetrievalGroundingSummary } from "@/types/authority";

describe("RunRetrievalExemplarStylePriorStrip", () => {
  it("shows missing copy when exemplarMissing is true", () => {
    const summary: RunRetrievalGroundingSummary = {
      topologyReferenceArchitectureExemplarMissing: true,
      topologyReferenceArchitectureExemplarCount: 0,
      topologyReferenceArchitectureExemplarDocumentIds: [],
    };

    render(<RunRetrievalExemplarStylePriorStrip summary={summary} />);

    expect(screen.getByTestId("run-retrieval-exemplar-style-prior")).toBeInTheDocument();
    expect(screen.getByText(/No reference architecture exemplar matched/i)).toBeInTheDocument();
  });

  it("shows exemplar count, document ids, and style-prior disclaimer when hits exist", () => {
    const summary: RunRetrievalGroundingSummary = {
      topologyReferenceArchitectureExemplarMissing: false,
      topologyReferenceArchitectureExemplarCount: 2,
      topologyReferenceArchitectureExemplarDocumentIds: [
        "exemplar-standard-3-tier",
        "exemplar-microservices",
      ],
    };

    render(<RunRetrievalExemplarStylePriorStrip summary={summary} />);

    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText(/exemplar-standard-3-tier, exemplar-microservices/i)).toBeInTheDocument();
    expect(screen.getByText(/Style prior only — not cited in findings/i)).toBeInTheDocument();
  });
});
