import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EVIDENCE_GRAPH_FOLLOW_UPS_TITLE } from "@/lib/evidence-graph-evidence-copy";
import { EvidenceGraphClaimOrientationStrip } from "./EvidenceGraphClaimOrientationStrip";

describe("EvidenceGraphClaimOrientationStrip", () => {
  it("renders sources without claim-discipline hero band", () => {
    render(<EvidenceGraphClaimOrientationStrip />);

    expect(screen.queryByRole("heading", { level: 2, name: /What this/i })).not.toBeInTheDocument();
    expect(screen.getByTestId("evidence-graph-sources")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: EVIDENCE_GRAPH_FOLLOW_UPS_TITLE })).toBeInTheDocument();
  });
});
