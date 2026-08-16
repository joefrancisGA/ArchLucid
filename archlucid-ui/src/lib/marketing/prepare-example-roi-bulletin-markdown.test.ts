import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { loadSampleAggregateRoiBulletinSyntheticMarkdown } from "@/marketing/load-sample-aggregate-roi-bulletin-synthetic";
import { prepareExampleRoiBulletinMarkdownForBuyer } from "@/lib/marketing/prepare-example-roi-bulletin-markdown";

describe("prepareExampleRoiBulletinMarkdownForBuyer", () => {
  it("strips repo preamble, duplicate H1, and Related section for buyer render", () => {
    const source = loadSampleAggregateRoiBulletinSyntheticMarkdown();
    const prepared = prepareExampleRoiBulletinMarkdownForBuyer(source);

    expect(prepared).not.toMatch(/^#\s/m);
    expect(prepared).not.toContain("FORBIDDEN");
    expect(prepared).not.toContain("## Related");
    expect(prepared).not.toContain("ROI_MODEL.md");
    expect(prepared).toContain("## Headline numbers");
    expect(prepared).toContain("illustrative sample");
  });

  it("keeps full source in docs sample for Markdown source disclosure", () => {
    const mdPath = join(process.cwd(), "..", "docs", "go-to-market", "SAMPLE_AGGREGATE_ROI_BULLETIN_SYNTHETIC.md");
    const md = readFileSync(mdPath, "utf8");

    expect(md).toContain("SYNTHETIC EXAMPLE");
    expect(md.split("\n")[0]).toContain("FORBIDDEN");
    expect(md).toContain("## Related");
  });
});
