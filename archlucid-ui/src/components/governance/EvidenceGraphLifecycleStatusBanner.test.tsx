import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceGraphLifecycleStatusBanner } from "@/components/governance/EvidenceGraphLifecycleStatusBanner";
import {
  EVIDENCE_GRAPH_VIEW_AUDIT_TRAIL,
  EVIDENCE_GRAPH_VIEW_GOVERNANCE_APPROVAL,
  EVIDENCE_GRAPH_VIEW_SIGNED_RECORD,
} from "@/lib/evidence-graph-page";

describe("EvidenceGraphLifecycleStatusBanner", () => {
  it("renders compact lifecycle copy and calm chip links without arrow glyphs", () => {
    render(<EvidenceGraphLifecycleStatusBanner />);

    expect(screen.getByTestId("evidence-graph-lifecycle-status-banner")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: EVIDENCE_GRAPH_VIEW_SIGNED_RECORD })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: EVIDENCE_GRAPH_VIEW_GOVERNANCE_APPROVAL })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: EVIDENCE_GRAPH_VIEW_AUDIT_TRAIL })).toBeInTheDocument();
    expect(screen.queryByText(/→/)).toBeNull();
    expect(screen.queryByText(/←/)).toBeNull();
  });
});
