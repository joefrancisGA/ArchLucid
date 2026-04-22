import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("example-roi-bulletin marketing page", () => {
  it("reads the checked-in synthetic sample from docs/", () => {
    const mdPath = join(process.cwd(), "..", "docs", "go-to-market", "SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md");
    const md = readFileSync(mdPath, "utf8");

    expect(md).toContain("SYNTHETIC EXAMPLE");
    expect(md.split("\n")[0]).toContain("FORBIDDEN");
  });

  it("source links to admin roi-bulletin-preview with minTenants=5", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");

    expect(source).toContain("/api/proxy/v1/admin/roi-bulletin-preview");
    expect(source).toContain("minTenants=5");
  });
});
