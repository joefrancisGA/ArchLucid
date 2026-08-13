import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

import {
  GETTING_STARTED_HELP_PRIMARY_ACTIONS,
  GETTING_STARTED_HELP_SOURCES,
} from "@/lib/getting-started-help-guide-content";
import {
  FIRST_ARCHITECTURE_REVIEW_INBOUND_HANDOFF_SOURCE_FILES,
  hrefIsCanonicalFirstArchitectureReviewHelp,
  sourceContainsRetiredFirstReviewHelpHandoff,
} from "@/lib/first-architecture-review-help-inbound-handoff-surfaces";
import { FIRST_ARCHITECTURE_REVIEW_HELP_PATH } from "@/lib/first-architecture-review-help-route";
import { listHelpSearchPanelTopics } from "@/lib/help/help-search-panel-catalog";
import { inAppHelpHref } from "@/lib/product-documentation-registry";
import { TROUBLESHOOTING_COMMON_ISSUES } from "@/lib/troubleshooting-help-guide-content";

function readInboundHandoffSource(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

function collectTroubleshootingFirstReviewHrefs(): string[] {
  return TROUBLESHOOTING_COMMON_ISSUES.flatMap((issue) =>
    issue.nextSteps
      .filter((step) => /first review guide/i.test(step.label))
      .map((step) => step.href),
  );
}

describe("first-architecture-review inbound handoff (TB-1376)", () => {
  it("keeps listed product surfaces free of retired first-review help paths", () => {
    for (const relativePath of FIRST_ARCHITECTURE_REVIEW_INBOUND_HANDOFF_SOURCE_FILES) {
      const source = readInboundHandoffSource(relativePath);

      expect(sourceContainsRetiredFirstReviewHelpHandoff(source), relativePath).toBe(false);
      expect(source, relativePath).toContain("first-architecture-review");
    }
  });

  it("routes getting-started first-review pointers to the canonical help path", () => {
    expect(GETTING_STARTED_HELP_PRIMARY_ACTIONS.firstReviewGuide.href).toBe(
      FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
    );
    expect(
      GETTING_STARTED_HELP_SOURCES.some(
        (link) => link.label === "Your first architecture review" && link.href === FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
      ),
    ).toBe(true);
  });

  it("routes troubleshooting first-review pointers to the canonical help path", () => {
    const hrefs = collectTroubleshootingFirstReviewHrefs();

    expect(hrefs.length).toBeGreaterThan(0);
    expect(hrefs.every((href) => hrefIsCanonicalFirstArchitectureReviewHelp(href))).toBe(true);
  });

  it("routes help-search first-review topic to the canonical help path", () => {
    const firstReviewTopic = listHelpSearchPanelTopics(false).find((topic) => topic.id === "first-review-guide");

    expect(firstReviewTopic?.action).toEqual({
      kind: "route",
      href: FIRST_ARCHITECTURE_REVIEW_HELP_PATH,
      helpSlug: "first-architecture-review",
    });
  });

  it("resolves inAppHelpHref(first-architecture-review) to the canonical path", () => {
    expect(inAppHelpHref("first-architecture-review")).toBe(FIRST_ARCHITECTURE_REVIEW_HELP_PATH);
  });
});
