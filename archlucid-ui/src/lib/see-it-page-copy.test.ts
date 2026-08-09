import { describe, expect, it } from "vitest";

import { MARKETING_SEE_IT_OG_DESCRIPTION } from "@/lib/marketing-open-graph";
import {
  SEE_IT_MARKETING_PDF_DOWNLOAD_LABEL,
  SEE_IT_MARKETING_PDF_HREF,
  SEE_IT_PAGE_METADATA_TITLE,
  SEE_IT_PAGE_TITLE,
} from "@/lib/see-it-page-copy";

describe("see-it-page-copy (TB-1280)", () => {
  it("uses honest sample-review title instead of 30-second time overclaim", () => {
    expect(SEE_IT_PAGE_TITLE.toLowerCase()).not.toMatch(/30\s*seconds?/);
    expect(SEE_IT_PAGE_TITLE.toLowerCase()).not.toMatch(/30-second/);
    expect(SEE_IT_PAGE_TITLE.toLowerCase()).not.toMatch(/\(30s\)/);
    expect(SEE_IT_PAGE_TITLE).toMatch(/sample review/i);
  });

  it("keeps metadata title aligned with page H1", () => {
    expect(SEE_IT_PAGE_METADATA_TITLE).toContain(SEE_IT_PAGE_TITLE);
    expect(SEE_IT_PAGE_METADATA_TITLE.toLowerCase()).not.toMatch(/30\s*seconds?/);
  });

  it("keeps OG description free of bare 30-second primary claim", () => {
    expect(MARKETING_SEE_IT_OG_DESCRIPTION.toLowerCase()).not.toMatch(/see it in 30/);
    expect(MARKETING_SEE_IT_OG_DESCRIPTION.toLowerCase()).not.toMatch(/30-second/);
  });
});

describe("see-it-page-copy (TB-1283)", () => {
  it("labels marketing PDF honestly instead of evidence bundle", () => {
    expect(SEE_IT_MARKETING_PDF_DOWNLOAD_LABEL.toLowerCase()).not.toContain("evidence bundle");
    expect(SEE_IT_MARKETING_PDF_DOWNLOAD_LABEL.toLowerCase()).toMatch(/sample|overview|marketing|why archlucid/);
    expect(SEE_IT_MARKETING_PDF_HREF).toBe("/api/proxy/v1/marketing/why-archlucid-pack.pdf");
  });
});
