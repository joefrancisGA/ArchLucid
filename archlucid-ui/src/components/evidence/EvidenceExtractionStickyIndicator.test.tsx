import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EvidenceExtractionStickyIndicator } from "@/components/evidence/EvidenceExtractionStickyIndicator";
import {
  EVIDENCE_EXTRACTION_STICKY_PROCESSING_LABEL,
  EVIDENCE_EXTRACTION_STICKY_READY_LABEL,
} from "@/lib/evidence/evidence-extraction-progress-copy";

describe("EvidenceExtractionStickyIndicator", () => {
  it("renders nothing when not visible", () => {
    const { container } = render(<EvidenceExtractionStickyIndicator visible={false} phase="processing" />);

    expect(container).toBeEmptyDOMElement();
  });

  it("renders a same-page jump link while processing", () => {
    render(<EvidenceExtractionStickyIndicator visible phase="processing" />);

    const link = screen.getByRole("link", { name: /Jump to evidence processing/i });
    expect(link).toHaveAttribute("href", "#evidence-extraction-progress-card");
    expect(screen.getByText(EVIDENCE_EXTRACTION_STICKY_PROCESSING_LABEL)).toBeInTheDocument();
  });

  it("renders the ready label when complete", () => {
    render(<EvidenceExtractionStickyIndicator visible phase="complete" />);

    expect(screen.getByText(EVIDENCE_EXTRACTION_STICKY_READY_LABEL)).toBeInTheDocument();
  });
});
