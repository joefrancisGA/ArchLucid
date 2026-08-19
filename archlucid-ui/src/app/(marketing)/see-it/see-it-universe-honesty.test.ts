import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const SEE_IT_ROOT = join(process.cwd(), "src/app/(marketing)/see-it");

/** TB-1029: repo guard that primary /see-it surfaces stay universe-honest after TB-981 flip. */
describe("see-it universe honesty guard (TB-1029)", () => {
  it("see-it-demo-universe resolves customer-intake vs claims-intake banner titles", () => {
    const source = readFileSync(join(SEE_IT_ROOT, "see-it-demo-universe.ts"), "utf8");

    expect(source).toContain('scenario?.slug === "claims-intake"');
    expect(source).toContain("Enterprise customer intake sample");
    expect(source).toContain("seeItUniverseBannerTitleForPayload");
  });

  it("see-it deliverable preview does not keep Healthcare Claims primary chrome", () => {
    const source = readFileSync(join(SEE_IT_ROOT, "SeeItDeliverablePreview.tsx"), "utf8");

    expect(source).not.toMatch(/Healthcare Claims intake modernization/i);
    expect(source).toMatch(/CUSTOMER_INTAKE_/);
  });

  it("see-it marketing surfaces do not deep-link Contoso /demo/preview", () => {
    const files = [
      "SeeItMarketingBody.tsx",
      "SeeItHeroSection.tsx",
      "SeeItDeliverablePreview.tsx",
    ];

    for (const file of files) {
      const source = readFileSync(join(SEE_IT_ROOT, file), "utf8");
      expect(source, file).not.toMatch(/href\s*=\s*["']\/demo\/preview["']/);
      expect(source, file).not.toContain("see-it-cta-demo-preview");
    }
  });

  it("documents both showcase run ids for regulated vs primary samples", () => {
    const source = readFileSync(join(SEE_IT_ROOT, "see-it.test.tsx"), "utf8");

    expect(source).toContain("CUSTOMER_INTAKE_SAMPLE_RUN_ID");
    expect(source).toContain("CLAIMS_INTAKE_SAMPLE_RUN_ID");
  });
});
