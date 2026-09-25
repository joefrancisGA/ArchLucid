import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";
import { resolveHelpTopicProductLineExclusionContent } from "@/lib/help/help-topic-product-line-exclusion-copy";
import { isHelpTopicExcludedForProductLine } from "@/lib/product-line/securenow-cloud-platform-policy";
import {
  SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS,
  SYSTEM_GRAVITY_HELP_OVERVIEW,
  SYSTEM_GRAVITY_HELP_SLUG,
  SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS,
} from "@/lib/system-gravity-help-guide-content";
import { SYSTEM_GRAVITY_HELP_PATH } from "@/lib/system-gravity-help-route";

/** SG-107 help topic registration. */
describe("system-gravity help route (SG-107)", () => {
  it("registers slug, path, and resolver wiring", () => {
    expect(SYSTEM_GRAVITY_HELP_SLUG).toBe("system-gravity");
    expect(SYSTEM_GRAVITY_HELP_PATH).toBe("/help/system-gravity");
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain("system-gravity");

    const resolverSource = readFileSync(
      join(process.cwd(), "src/lib/help/help-topic-view-resolver-operate.tsx"),
      "utf8",
    );

    expect(resolverSource).toContain("HelpSystemGravityGuideView");
  });

  it("renders on ArchLucid and uses silent SecureNow exclusion", () => {
    expect(isHelpTopicExcludedForProductLine("system-gravity", "architecture")).toBe(false);
    expect(isHelpTopicExcludedForProductLine("system-gravity", "security")).toBe(true);
    expect(resolveHelpTopicProductLineExclusionContent("system-gravity", "security")).toBeNull();
  });

  it("teaches architecture desk vs nested review inspector without ADR 0098 customer copy", () => {
    const corpus = [
      SYSTEM_GRAVITY_HELP_OVERVIEW,
      ...SYSTEM_GRAVITY_HELP_DESK_HOME_DEFINITIONS.map((row) => `${row.term} ${row.definition}`),
      ...SYSTEM_GRAVITY_HELP_TECHNICAL_IDENTIFIERS,
    ].join(" ");

    expect(corpus).toMatch(/desk lock/i);
    expect(corpus).toMatch(/inspector/i);
    expect(corpus).toMatch(/Record/i);
    expect(corpus).toMatch(/Practice/i);
    expect(corpus.toLowerCase()).not.toContain("0098");
    expect(corpus.toLowerCase()).not.toContain("github.com");
  });
});
