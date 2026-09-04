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

import { HelpModelGovernanceGuideView } from "@/app/(operator)/help/_sections/HelpModelGovernanceGuideView";
import {
  MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE,
  MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE,
  MODEL_GOVERNANCE_HELP_SOURCES,
} from "@/lib/model-governance-help-evidence-copy";
import { MODEL_GOVERNANCE_HELP_PRIMARY_ACTION } from "@/lib/model-governance-help-guide-content";
import {
  MODEL_GOVERNANCE_HELP_FIRST_VIEWPORT_TEST_ID,
  MODEL_GOVERNANCE_HELP_PRIMARY_CONTENT_ID,
  MODEL_GOVERNANCE_HELP_SKIP_LINK_LABEL,
  MODEL_GOVERNANCE_HELP_SKIP_TARGET_ID,
} from "@/lib/model-governance-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpModelGovernanceGuideView buyer-polished shell (HMO)", () => {
  const entry = getProductDocumentationEntry("model-governance");

  it("renders skip link, first-viewport action panel, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected model-governance documentation entry.");
    }

    render(<HelpModelGovernanceGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: MODEL_GOVERNANCE_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${MODEL_GOVERNANCE_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-model-governance-header-claim-discipline")).toHaveTextContent(
      MODEL_GOVERNANCE_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-model-governance-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc-mobile")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: MODEL_GOVERNANCE_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-model-governance-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(MODEL_GOVERNANCE_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(MODEL_GOVERNANCE_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-model-governance-action-panel");
    const orientationBottom = screen.getByTestId("help-model-governance-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-model-governance-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-model-governance-start-here-primary-cta")).toHaveAttribute(
      "href",
      MODEL_GOVERNANCE_HELP_PRIMARY_ACTION.href,
    );

    for (const source of filterWhereToGoNextFollowUpLinks(MODEL_GOVERNANCE_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
