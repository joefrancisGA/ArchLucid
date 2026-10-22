import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpStandardsRulesGuideView } from "@/app/(operator)/help/_sections/HelpStandardsRulesGuideView";
import {
  STANDARDS_RULES_HELP_PAGE_SUBTITLE,
  STANDARDS_RULES_HELP_PAGE_SUBTITLE_BUYER,
  STANDARDS_RULES_HELP_PRIMARY_CONTENT_ID,
  STANDARDS_RULES_HELP_SKIP_LINK_LABEL,
} from "@/lib/standards-rules-help-guide-content";
import { STANDARDS_RULES_HELP_CLAIM_DISCIPLINE } from "@/lib/standards-rules-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpStandardsRulesGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("standards-and-rules");

  it("renders skip link, buyer subtitle, orientation above overview, and hides registry provenance", () => {
    if (entry === undefined) {
      throw new Error("Expected standards-and-rules documentation entry.");
    }

    render(<HelpStandardsRulesGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: STANDARDS_RULES_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${STANDARDS_RULES_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(STANDARDS_RULES_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(STANDARDS_RULES_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-heading-eyebrow")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-standards-rules-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("help-standards-rules-claim-discipline-strip").textContent).toContain(
      STANDARDS_RULES_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const primaryContent = document.getElementById(STANDARDS_RULES_HELP_PRIMARY_CONTENT_ID);

    expect(primaryContent).not.toBeNull();

    const orderedLandmarks = within(primaryContent as HTMLElement)
      .getAllByTestId(/help-standards-rules-(orientation-top|overview)/)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["help-standards-rules-orientation-top", "help-standards-rules-overview"]);
  });
});
