import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";
import {
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SLUG,
} from "@/lib/livelihood-grade-no-help-extraction-fidelity-guide-content";
import {
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SLUG,
} from "@/lib/livelihood-grade-no-help-false-hard-guide-content";
import {
  LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH,
  LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH,
} from "@/lib/livelihood-grade-no-help-route";

const UI_ROOT = join(process.cwd());
const REPO_ROOT = join(UI_ROOT, "..");

const HELP_TOPIC_VIEW_RESOLVER_OPERATE = join(
  UI_ROOT,
  "src/lib/help/help-topic-view-resolver-operate.tsx",
);

describe("livelihood-grade-no help routes (LN-024 / LN-034)", () => {
  it("uses canonical /help paths for false-hard and extraction-fidelity", () => {
    expect(LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_PATH).toBe("/help/false-hard-infeasibility");
    expect(LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_PATH).toBe("/help/extraction-fidelity");
  });

  it("registers both slugs as app-guided help topics", () => {
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain(LIVELIHOOD_GRADE_NO_HELP_FALSE_HARD_SLUG);
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain(LIVELIHOOD_GRADE_NO_HELP_EXTRACTION_FIDELITY_SLUG);
  });

  it("routes slugs through dedicated Help guide views", () => {
    const resolverSource = readFileSync(HELP_TOPIC_VIEW_RESOLVER_OPERATE, "utf8");

    expect(resolverSource).toContain('loaded.entry.slug === "false-hard-infeasibility"');
    expect(resolverSource).toContain("HelpFalseHardInfeasibilityGuideView");
    expect(resolverSource).toContain('loaded.entry.slug === "extraction-fidelity"');
    expect(resolverSource).toContain("HelpExtractionFidelityGuideView");
  });

  it("indexes help search catalog topics for false-hard aliases", () => {
    const catalogSource = readFileSync(
      join(UI_ROOT, "src/lib/help/help-search-panel-catalog-topics.ts"),
      "utf8",
    );

    expect(catalogSource).toContain("false-hard-infeasibility");
    expect(catalogSource).toContain("extraction-fidelity");
    expect(catalogSource).toContain("hard infeasible");
  });
});
