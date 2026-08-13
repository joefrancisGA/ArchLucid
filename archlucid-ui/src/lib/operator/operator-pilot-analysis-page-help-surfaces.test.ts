import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES } from "@/lib/operator/operator-pilot-analysis-page-help-surfaces";
import { pageHelpTopicForPathname } from "@/lib/usability/page-help-topic-map";

const SRC_ROOT = join(process.cwd(), "src");

function readSrcModule(relativePath: string): string {
  return readFileSync(join(SRC_ROOT, relativePath), "utf8");
}

describe("operator-pilot-analysis-page-help-surfaces (TB-1667)", () => {
  it("tracks every TB-1667 named surface", () => {
    expect(OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES.map((entry) => entry.id)).toEqual([
      "operator-home",
      "sponsor-dashboard",
      "first-review-guide",
      "evidence-graph",
      "compare-two-reviews",
      "internal-replay",
      "ask-review-questions",
      "search-review-evidence",
    ]);
  });

  it.each(
    OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES.map((entry) => [
      entry.id,
      entry.pathname,
      entry.modulePath,
    ]),
  )("%s resolves a page help topic for %s", (_id, pathname) => {
    const topic = pageHelpTopicForPathname(pathname);

    expect(topic).not.toBeNull();
    expect(topic?.label?.length).toBeGreaterThan(0);
  });

  it.each(
    OPERATOR_PILOT_ANALYSIS_PAGE_HELP_TB1667_SURFACES.map((entry) => [
      entry.id,
      entry.modulePath,
    ]),
  )("%s mounts PageContextualHelpButton", (_id, modulePath) => {
    const source = readSrcModule(modulePath);

    expect(source).toContain("PageContextualHelpButton");
  });

  it("ask review questions maps to prior-manifest-retrieval (TB-1667)", () => {
    expect(pageHelpTopicForPathname("/insights/ask-review-questions")?.slug).toBe("prior-manifest-retrieval");
  });
});
