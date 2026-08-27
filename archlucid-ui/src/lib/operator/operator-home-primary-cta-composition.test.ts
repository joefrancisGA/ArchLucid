import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const UI_ROOT = join(process.cwd());

describe("operator home primary CTA composition (TB-1539)", () => {
  it("shows the cross-page Core Pilot strip only on first-review architecture surfaces", () => {
    const source = readFileSync(join(UI_ROOT, "src/components/shell/AppShellMainAffordances.tsx"), "utf8");

    expect(source).toContain("isPersistentWorkspaceNextActionStripPath(pathname)");
    expect(source).toContain(
      "{showPersistentWorkspaceNextActionStrip ? <PersistentWorkspaceNextActionStrip /> : null}",
    );
    expect(source).not.toMatch(
      /<PersistentWorkspaceNextActionStrip\s*\/>\s*\n\s*\{isOperatorHome \? <RecentReviewsResumeStrip/,
    );
  });

  it("demotes lifecycle card primaries before emphasized-path promotion in dual-path cards", () => {
    const source = readFileSync(
      join(UI_ROOT, "src/components/operator-home/OperatorHomeDualPathCards.tsx"),
      "utf8",
    );

    const fnStart = source.indexOf("function resolveLifecycleCardButtonVariant");
    const fnBody = source.slice(fnStart, source.indexOf("function lifecycleCardClassName", fnStart));

    expect(fnBody.indexOf("pagePrimaryOwnedElsewhere")).toBeLessThan(fnBody.indexOf("emphasizedPath === path"));
  });
});
