import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ArchLucidProcurementEvidenceHomeSection } from "./ArchLucidProcurementEvidenceHomeSection";
import { PROCUREMENT_AL_EVAL_ANCHOR_HREF } from "@/lib/procurement/procurement-evidence-map-anchors";

describe("ArchLucidProcurementEvidenceHomeSection", () => {
  it("renders the in-product evidence map with guarded AL-EVAL href", () => {
    render(<ArchLucidProcurementEvidenceHomeSection />);

    expect(screen.getByTestId("archlucid-procurement-evidence-map")).toBeInTheDocument();

    const alEvalLink = screen.getByRole("link", { name: /AL-EVAL guided-pilot acceptance/i });

    expect(alEvalLink).toHaveAttribute("href", PROCUREMENT_AL_EVAL_ANCHOR_HREF);
  });
});
