import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpStandardsRulesGuideView } from "@/app/(operator)/help/_sections/HelpStandardsRulesGuideView";
import {
  expectClaimDisciplineBandContent,
  expectClaimDisciplineHeading,
} from "@/lib/claim-discipline-test-helpers";
import {
  STANDARDS_RULES_HELP_CLAIM_HEADING_ID,
  STANDARDS_RULES_HELP_GUIDE_HEADINGS,
  STANDARDS_RULES_HELP_OVERVIEW,
  STANDARDS_RULES_HELP_PAGE_SUBTITLE,
  STANDARDS_RULES_HELP_PRIMARY_ACTION,
  STANDARDS_RULES_HELP_RESOLUTION_SNAPSHOT_EXPORT_HREF,
  STANDARDS_RULES_HELP_TABLE_ITEMS,
} from "@/lib/standards-rules-help-guide-content";
import {
  STANDARDS_RULES_HELP_CLAIM_DISCIPLINE,
  STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING,
  STANDARDS_RULES_HELP_SOURCES,
} from "@/lib/standards-rules-help-evidence-copy";
import { STANDARDS_RULES_PAGE_SUBTITLE } from "@/lib/standards-rules-page";
import { resolveGuideHeadingsForStrip } from "@/lib/claim-discipline-policy";
import { HELP_PAGE_LAYOUT } from "@/lib/help/help-page-layout";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpStandardsRulesGuideView", () => {
  const entry = getProductDocumentationEntry("standards-and-rules");

  it("renders provenance, header primary action, readingBody, scroll-spy TOC, and follow-ups", () => {
    if (entry === undefined) {
      throw new Error("Expected standards-and-rules documentation entry.");
    }

    render(<HelpStandardsRulesGuideView entry={entry} />);

    expect(screen.getByTestId("help-standards-rules-guide")).toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-registry-provenance")).toHaveTextContent(
      "Guide last reviewed 2026-08-13 · Policy resolution, enforced rules, and diagnostic export",
    );
    expect(STANDARDS_RULES_HELP_PAGE_SUBTITLE).not.toBe(STANDARDS_RULES_PAGE_SUBTITLE);
    expect(STANDARDS_RULES_HELP_OVERVIEW.toLowerCase()).not.toContain("this review");
    expect(screen.getByTestId("help-standards-rules-overview")).toHaveTextContent(STANDARDS_RULES_HELP_OVERVIEW);
    expect(screen.getByTestId("help-standards-rules-overview").className).toContain(HELP_PAGE_LAYOUT.readingBody);
    expect(screen.getByTestId("help-standards-rules-claim-discipline-strip").textContent).toContain(
      STANDARDS_RULES_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expectClaimDisciplineBandContent(
      screen,
      "help-standards-rules",
      "help-standards-rules-claim-discipline",
      STANDARDS_RULES_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expectClaimDisciplineHeading(
      screen,
      "help-standards-rules",
      STANDARDS_RULES_HELP_CLAIM_DISCIPLINE_HEADING,
      STANDARDS_RULES_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: STANDARDS_RULES_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      STANDARDS_RULES_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: STANDARDS_RULES_HELP_PRIMARY_ACTION.label })).toHaveLength(1);
    expect(screen.queryByTestId("help-standards-rules-action-panel")).not.toBeInTheDocument();

    for (const item of STANDARDS_RULES_HELP_TABLE_ITEMS) {
      expect(screen.getByRole("link", { name: item.label })).toHaveAttribute("href", item.href);
    }

    expect(screen.getByRole("link", { name: "Resolution snapshot" })).toHaveAttribute(
      "href",
      STANDARDS_RULES_HELP_RESOLUTION_SNAPSHOT_EXPORT_HREF,
    );

    for (const source of STANDARDS_RULES_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);

      expect(screen.getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(
      screen.getByRole("link", {
        name: formatHelpFollowUpLinkAccessibleName(
          STANDARDS_RULES_HELP_SOURCES[0].href,
          STANDARDS_RULES_HELP_SOURCES[0].label,
        ),
      }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Policy packs" })).toHaveLength(1);
    expect(screen.getAllByRole("link", { name: STANDARDS_RULES_HELP_PRIMARY_ACTION.label })).toHaveLength(1);

    for (const heading of resolveGuideHeadingsForStrip(
      "help-standards-rules",
      STANDARDS_RULES_HELP_GUIDE_HEADINGS,
      STANDARDS_RULES_HELP_CLAIM_HEADING_ID,
    )) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }

    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
  });
});
