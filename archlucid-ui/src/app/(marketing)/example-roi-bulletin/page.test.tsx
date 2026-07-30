import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF } from "@/lib/marketing/example-roi-bulletin-honesty";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("example-roi-bulletin marketing page", () => {
  it("reads the checked-in synthetic sample from docs/", () => {
    const mdPath = join(process.cwd(), "..", "docs", "go-to-market", "SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md");
    const md = readFileSync(mdPath, "utf8");

    expect(md).toContain("SYNTHETIC EXAMPLE");
    expect(md.split("\n")[0]).toContain("FORBIDDEN");
  });

  it("keeps operator-only admin preview with minTenants=5 and purges contributor paths (TB-1520)", () => {
    const source = readFileSync(join(__dirname, "page.tsx"), "utf8");

    expect(source).toContain("/api/proxy/v1/admin/roi-bulletin-preview");
    expect(source).toContain("minTenants=5");
    expect(source).toContain("Operator-only");
    expect(source).not.toContain("docs/CLI_USAGE.md");
    expect(source).toContain("index: false");
    expect(source).toContain(EXAMPLE_ROI_BULLETIN_METHODOLOGY_HELP_HREF);
  });
});
