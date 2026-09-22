import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { WORKING_CAREER_REHEARSAL_HELP_CANONICAL_PATH } from "@/lib/governance/working-career-rehearsal-help-evidence-copy";
import { WORKING_CAREER_REHEARSAL_HELP_CANONICAL_HANDOFF_MARKERS } from "@/lib/governance/working-career-rehearsal-help-guide-content";
import { WORKING_CAREER_REHEARSAL_HELP_PATH } from "@/lib/governance/working-career-rehearsal-help-route";
import { HELP_APP_GUIDED_TOPIC_SLUGS } from "@/lib/help/help-topic-content-loader";

const UI_ROOT = join(process.cwd());
const REPO_ROOT = join(UI_ROOT, "..");

const HELP_TOPIC_VIEW_RESOLVER_OPERATE = join(
  UI_ROOT,
  "src/lib/help/help-topic-view-resolver-operate.tsx",
);

const PRODUCT_HANDOFF_SURFACES = [
  "archlucid-ui/src/lib/product-documentation-registry-entries-operator-workspace.ts",
  "archlucid-ui/src/lib/help/help-search-panel-catalog-topics.ts",
  "archlucid-ui/src/lib/usability/page-help-topic-rows-operator.ts",
  "docs/library/OPERATOR_UI_EXPERIENCE_MODES.md",
] as const;

function expectCanonicalHandoff(source: string): void {
  const hasHandoff = WORKING_CAREER_REHEARSAL_HELP_CANONICAL_HANDOFF_MARKERS.some((marker) =>
    source.includes(marker),
  );

  expect(hasHandoff).toBe(true);
}

describe("working-career-rehearsal-help-route (AS-082)", () => {
  it("uses the canonical /help/career-rehearsal-doors path", () => {
    expect(WORKING_CAREER_REHEARSAL_HELP_PATH).toBe("/help/career-rehearsal-doors");
    expect(WORKING_CAREER_REHEARSAL_HELP_CANONICAL_PATH).toBe(WORKING_CAREER_REHEARSAL_HELP_PATH);
  });

  it("registers the slug as an app-guided help topic", () => {
    expect(HELP_APP_GUIDED_TOPIC_SLUGS).toContain("career-rehearsal-doors");
  });

  it("routes the slug through HelpWorkingCareerRehearsalGuideView", () => {
    const resolverSource = readFileSync(HELP_TOPIC_VIEW_RESOLVER_OPERATE, "utf8");

    expect(resolverSource).toContain('loaded.entry.slug === "career-rehearsal-doors"');
    expect(resolverSource).toContain("HelpWorkingCareerRehearsalGuideView");
  });

  it("keeps product handoffs on canonical /help/career-rehearsal-doors", () => {
    for (const relativePath of PRODUCT_HANDOFF_SURFACES) {
      const source = readFileSync(join(REPO_ROOT, relativePath), "utf8");

      expectCanonicalHandoff(source);
    }
  });
});
