import { readFileSync } from "node:fs";
import { join } from "node:path";

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ReviewWorkspaceTabStrip } from "@/components/reviews/ReviewWorkspaceTabStrip";
import { REVIEW_WORKSPACE_MORE_TABS_TEST_ID } from "@/components/reviews/ReviewWorkspaceMoreTabsMenu";
import { resolveReviewDetailVisibleTabs } from "@/lib/resolve-review-detail-visible-tabs";

const appShellSource = readFileSync(join(process.cwd(), "src/components/AppShellClient.tsx"), "utf8");
const tabStripSource = readFileSync(join(process.cwd(), "src/components/reviews/ReviewWorkspaceTabStrip.tsx"), "utf8");

describe("operator shell eight-hour zoom guard (FD-09)", () => {
  it("keeps the sidebar on a vertical scrollport instead of clipping overflow", () => {
    expect(appShellSource).toMatch(/overflow-y-auto/);
    expect(appShellSource).toContain("min-h-0 flex-1");
    expect(appShellSource).toContain('data-testid="sidebar-nav"');
  });

  it("mounts the CTO journey caption only when eval chrome is on (FD-08)", () => {
    expect(appShellSource).toContain("{evalChrome ? <CtoDemoJourneyCaptionBarDeferred /> : null}");
    expect(appShellSource).toContain("const evalChrome = useProductionEvalChrome()");
  });

  it("keeps the desktop review tab strip on horizontal scroll/wrap without a More menu", () => {
    expect(tabStripSource).toContain("overflow-x-auto");
    expect(tabStripSource).toContain("flex-wrap");
    expect(tabStripSource).not.toContain("ReviewWorkspaceMoreTabsMenu");

    const resolved = resolveReviewDetailVisibleTabs({
      manifestId: "manifest-1",
      showProgressTracker: true,
      runCompleted: false,
    });

    expect(resolved.moreTabIds).toEqual([]);

    render(
      <ReviewWorkspaceTabStrip
        lifecycle="finalized"
        activeTab="overview"
        resolvedTabs={resolved}
        onTabChange={() => undefined}
      />,
    );

    expect(screen.queryByTestId(REVIEW_WORKSPACE_MORE_TABS_TEST_ID)).toBeNull();
    expect(screen.queryByTestId("review-detail-workspace-tab-additional-label")).toBeNull();
  });
});
