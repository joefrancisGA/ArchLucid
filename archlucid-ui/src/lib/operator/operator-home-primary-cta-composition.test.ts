import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import { isPersistentWorkspaceNextActionStripPath } from "@/lib/persistent-workspace-next-action-strip-path";

const UI_ROOT = join(process.cwd());

describe("operator home primary CTA composition (TB-1539)", () => {
  it("omits the cross-page Core Pilot strip and resume strip on operator home", () => {
    const source = readFileSync(join(UI_ROOT, "src/components/shell/AppShellMainAffordances.tsx"), "utf8");

    expect(source).toContain("isPersistentWorkspaceNextActionStripPath(pathname)");
    expect(source).toContain("showPersistentWorkspaceNextActionStrip && teachingChromeVisible");
    expect(source).not.toContain("RecentReviewsResumeStrip");
    expect(isPersistentWorkspaceNextActionStripPath("/")).toBe(false);
  });

  it("keeps lifecycle alternatives visible when a draft primary owns the viewport", () => {
    const source = readFileSync(
      join(UI_ROOT, "src/components/operator-home/OperatorHomeLifecycleAlternativesDisclosure.tsx"),
      "utf8",
    );

    expect(source).toContain("pagePrimaryOwnedElsewhere");
    expect(source).toContain("OperatorHomeDualPathCards");
    expect(source).not.toContain("OperatorHomeDisclosureSection");
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

  it("keeps exactly one filled primary CTA across the header and unfinished-work regions", () => {
    const headerSource = readFileSync(
      join(UI_ROOT, "src/app/(operator)/_sections/OperatorHomePageHeader.tsx"),
      "utf8",
    );
    const unfinishedSource = readFileSync(
      join(UI_ROOT, "src/components/operator-home/UnfinishedWorkRail.tsx"),
      "utf8",
    );

    expect(headerSource).toContain('variant="primary"');
    expect(unfinishedSource).not.toMatch(/variant="primary"/);
    expect(unfinishedSource).toContain('variant="outline"');
  });

  it("labels home wayfinding links with sidebar destination names", () => {
    const source = readFileSync(
      join(UI_ROOT, "src/components/operator-home/OperatorHomeWorkingPrimaryCta.tsx"),
      "utf8",
    );

    expect(source).toContain("ARCHITECTURE_DRAFTS_LIST_LABEL");
    expect(source).toContain("OPERATOR_NAV_LINK_LABELS.reviewPackage");
    expect(source).not.toContain("OPERATOR_NAV_LINK_LABELS.packages");
  });
});
