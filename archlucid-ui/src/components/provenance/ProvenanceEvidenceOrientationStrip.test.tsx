import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProvenanceEvidenceOrientationStrip } from "@/components/provenance/ProvenanceEvidenceOrientationStrip";
import { buildProvenanceSources } from "@/lib/provenance-evidence-copy";

describe("ProvenanceEvidenceOrientationStrip", () => {
  it("lists follow-up Sources without self-linking provenance", () => {
    const runId = "demo-run";
    render(<ProvenanceEvidenceOrientationStrip runId={runId} />);

    expect(screen.getByTestId("provenance-sources")).toBeInTheDocument();
    expect(screen.getByTestId("provenance-claim-discipline")).toHaveTextContent(
      /Coordinator linkage|diligence Sources/i,
    );

    const sources = screen.getByTestId("provenance-sources");
    const expected = buildProvenanceSources(runId);

    for (const link of expected) {
      expect(within(sources).getByRole("link", { name: link.label })).toHaveAttribute("href", link.href);
    }

    expect(expected.some((link) => link.href.includes("/provenance"))).toBe(false);
  });
});
