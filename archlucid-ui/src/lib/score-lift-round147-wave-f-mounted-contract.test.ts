import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

function readUiSource(relativePath: string): string {
  return readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", relativePath), "utf8");
}

describe("score lift round147 wave F mounted contract", () => {
  it("pipes evidence honesty, sealed lifecycle stepper, scope chip, section search, spine dedupe", () => {
    const tabShell = readUiSource("components/reviews/ReviewDetailWorkspaceTabShell.tsx");
    expect(tabShell).toContain("evidenceReferenceCountNotStored={props.evidenceReferenceCountNotStored");

    const chrome = readUiSource(
      "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailWorkspaceChrome.tsx",
    );
    expect(chrome).toContain("reviewIsSealed={reviewIsSealed}");
    expect(chrome).toContain("ReviewWorkspacePackageSearchScopeChip");

    const sectionsPanel = readUiSource("components/GlobalSearchReviewDetailSectionsPanel.tsx");
    expect(sectionsPanel).toContain("REVIEW_DETAIL_HEADER_SECTION_SEARCH_EMPTY_NO_NAV_LINE");

    const spine = readUiSource("components/reviews/RunDetailFirstReviewSpineBand.tsx");
    expect(spine).toContain("suppressOpenGatePrimaryForTabCognitiveStrip");

    const tabbed = readUiSource(
      "app/(operator)/architecture/reviews/[reviewId]/_sections/RunDetailTabbedWorkspaceShell.tsx",
    );
    expect(tabbed).toContain("evidenceReferenceCountNotStored={evidenceReferenceCountNotStored}");
  });
});
