import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  EVIDENCE_GRAPH_CLAIM_DISCIPLINE,
  EVIDENCE_GRAPH_CLAIM_DISCIPLINE_HEADING,
} from "@/lib/evidence-graph-evidence-copy";

import { EvidenceGraphClaimOrientationStrip } from "./EvidenceGraphClaimOrientationStrip";

describe("EvidenceGraphClaimOrientationStrip", () => {
  it("renders claim discipline heading and body", () => {
    render(<EvidenceGraphClaimOrientationStrip />);

    expect(screen.getByRole("heading", { level: 2, name: EVIDENCE_GRAPH_CLAIM_DISCIPLINE_HEADING })).toBeInTheDocument();
    expect(screen.getByTestId("evidence-graph-claim-discipline").textContent).toContain(
      EVIDENCE_GRAPH_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("evidence-graph-sources")).toBeInTheDocument();
  });
});
