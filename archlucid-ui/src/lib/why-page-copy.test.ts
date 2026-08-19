import { describe, expect, it } from "vitest";

import {
  WHY_MARKETING_PDF_DOWNLOAD_LABEL,
  WHY_MARKETING_PDF_HREF,
  WHY_MARKETING_PDF_SECTION_TITLE,
  WHY_PROOF_LADDER_PRIMARY_HREF,
  WHY_PROOF_LADDER_SAMPLE_HREF,
} from "@/lib/why-page-copy";
import { CANONICAL_ANONYMOUS_PROOF_HREF } from "@/lib/showcase-static-demo";

describe("why-page-copy (TB-1305)", () => {
  it("labels why marketing PDF honestly instead of audit evidence bundle", () => {
    expect(WHY_MARKETING_PDF_DOWNLOAD_LABEL.toLowerCase()).not.toContain("audit evidence bundle");
    expect(WHY_MARKETING_PDF_DOWNLOAD_LABEL.toLowerCase()).not.toContain("evidence bundle");
    expect(WHY_MARKETING_PDF_DOWNLOAD_LABEL.toLowerCase()).toMatch(/differentiation|overview|marketing/);
    expect(WHY_MARKETING_PDF_HREF).toBe("/api/proxy/v1/marketing/why-archlucid-pack.pdf");
  });

  it("keeps PDF section title free of audit evidence bundle overclaim", () => {
    expect(WHY_MARKETING_PDF_SECTION_TITLE.toLowerCase()).not.toContain("audit evidence bundle");
    expect(WHY_MARKETING_PDF_SECTION_TITLE.toLowerCase()).not.toContain("evidence bundle");
  });

  it("TB-1302: proof ladder primary follows see-it / Claims-static universe", () => {
    expect(WHY_PROOF_LADDER_PRIMARY_HREF).toBe("/see-it");
    expect(WHY_PROOF_LADDER_SAMPLE_HREF).toBe(CANONICAL_ANONYMOUS_PROOF_HREF);
  });
});
