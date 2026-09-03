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

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpImpactPreviewGuideView } from "@/app/(operator)/help/_sections/HelpImpactPreviewGuideView";
import {
  IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE,
  IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE,
  IMPACT_PREVIEW_HELP_SOURCES,
} from "@/lib/impact-preview-help-evidence-copy";
import {
  IMPACT_PREVIEW_HELP_PRIMARY_ACTION,
} from "@/lib/impact-preview-help-guide-content";
import {
  IMPACT_PREVIEW_HELP_FIRST_VIEWPORT_TEST_ID,
  IMPACT_PREVIEW_HELP_PRIMARY_CONTENT_ID,
  IMPACT_PREVIEW_HELP_SKIP_LINK_LABEL,
  IMPACT_PREVIEW_HELP_SKIP_TARGET_ID,
} from "@/lib/impact-preview-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpImpactPreviewGuideView buyer-polished shell (HEM)", () => {
  const entry = getProductDocumentationEntry("impact-preview");

  it("renders skip link, first-viewport band, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected impact-preview documentation entry.");
    }

    render(<HelpImpactPreviewGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: IMPACT_PREVIEW_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${IMPACT_PREVIEW_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-impact-preview-header-claim-discipline")).toHaveTextContent(
      IMPACT_PREVIEW_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-impact-preview-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: IMPACT_PREVIEW_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-impact-preview-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(IMPACT_PREVIEW_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(IMPACT_PREVIEW_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-impact-preview-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-impact-preview-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId(IMPACT_PREVIEW_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      IMPACT_PREVIEW_HELP_PRIMARY_ACTION.href,
    );
    expect(screen.getAllByRole("link", { name: IMPACT_PREVIEW_HELP_PRIMARY_ACTION.label })).toHaveLength(2);

    for (const source of IMPACT_PREVIEW_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
