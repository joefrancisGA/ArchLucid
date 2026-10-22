import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

import {
  WHY_HERO_PRODUCT_SCREENSHOT_ALT,
  WHY_HERO_PRODUCT_SCREENSHOT_CAPTION,
  WHY_HERO_PRODUCT_SCREENSHOT_FILENAME,
  WHY_HERO_PRODUCT_SCREENSHOT_SRC,
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

  it("TB-2301: hero product screenshot asset exists and copy stays honest", () => {
    const assetPath = path.join(
      process.cwd(),
      "public",
      "marketing",
      "why",
      WHY_HERO_PRODUCT_SCREENSHOT_FILENAME,
    );

    expect(fs.existsSync(assetPath)).toBe(true);
    expect(WHY_HERO_PRODUCT_SCREENSHOT_SRC).toBe(
      `/marketing/why/${WHY_HERO_PRODUCT_SCREENSHOT_FILENAME}`,
    );
    expect(WHY_HERO_PRODUCT_SCREENSHOT_ALT.toLowerCase()).toContain("recent reviews");
    expect(WHY_HERO_PRODUCT_SCREENSHOT_CAPTION.toLowerCase()).toMatch(/claims intake|demo/);
    expect(WHY_HERO_PRODUCT_SCREENSHOT_CAPTION.toLowerCase()).toMatch(/fabricated|demo data/);
  });
});
