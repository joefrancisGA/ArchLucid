import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { isPersistentWorkspaceNextActionStripPath } from "@/lib/persistent-workspace-next-action-strip-path";

const UI_ROOT = join(process.cwd());

describe("operator home primary CTA composition (TB-1539)", () => {
  it("omits the cross-page Core Pilot strip and resume strip on operator home", () => {
    const source = readFileSync(join(UI_ROOT, "src/components/shell/AppShellMainAffordances.tsx"), "utf8");

    expect(source).toContain("isPersistentWorkspaceNextActionStripPath(pathname)");
    expect(source).toContain(
      "{showPersistentWorkspaceNextActionStrip ? <PersistentWorkspaceNextActionStrip /> : null}",
    );
    expect(source).not.toContain("RecentReviewsResumeStrip");
    expect(isPersistentWorkspaceNextActionStripPath("/")).toBe(false);
  });

  it("collapses lifecycle alternatives when a draft primary owns the viewport", () => {
    const source = readFileSync(
      join(UI_ROOT, "src/components/operator-home/OperatorHomeLifecycleAlternativesDisclosure.tsx"),
      "utf8",
    );

    expect(source).toContain("pagePrimaryOwnedElsewhere");
    expect(source).toContain("defaultExpanded={false}");
    expect(source).toContain("OperatorHomeDisclosureSection");
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
