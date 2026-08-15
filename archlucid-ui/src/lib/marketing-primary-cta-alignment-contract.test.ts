import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { MARKETING_PRIMARY_CTA_CLASS, MARKETING_PRIMARY_FILL_CLASS } from "@/lib/design-tokens";

const SRC_ROOT = join(process.cwd(), "src");

const TB_2292_MIGRATED_MODULES = [
  "app/(marketing)/showcase/[runId]/ShowcaseBottomCTA.tsx",
  "app/(marketing)/demo/preview/_sections/DemoPreviewUnavailable.tsx",
  "app/(marketing)/live-demo/LiveDemoWalkthroughNav.tsx",
  "app/(marketing)/live-demo/LiveDemoContinuousWalkthrough.tsx",
  "app/(marketing)/live-demo/LiveDemoEvidenceChainPreview.tsx",
] as const;

describe("TB-2292 marketing primary CTA token alignment", () => {
  it("exports marketing CTA classes on operator primary-action tokens", () => {
    expect(MARKETING_PRIMARY_FILL_CLASS).toContain("--al-primary-action-bg");
    expect(MARKETING_PRIMARY_CTA_CLASS).toContain(MARKETING_PRIMARY_FILL_CLASS);
    expect(MARKETING_PRIMARY_CTA_CLASS).not.toMatch(/\bbg-teal-/);
  });

  it.each(TB_2292_MIGRATED_MODULES)("uses shared marketing primary tokens in %s", (relativePath) => {
    const source = readFileSync(join(SRC_ROOT, ...relativePath.split("/")), "utf8");

    expect(source).not.toMatch(/bg-teal-[678]00.*px-4 py-2/);
    expect(source).toMatch(/MARKETING_PRIMARY_CTA_CLASS|MARKETING_PRIMARY_FILL_CLASS/);
  });
});
