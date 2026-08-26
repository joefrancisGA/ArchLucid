import { render, screen } from "@testing-library/react";
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

import { HelpTeamsIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpTeamsIntegrationGuideView";
import {
  TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE,
  TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER,
  TEAMS_INTEGRATION_HELP_PRIMARY_CONTENT_ID,
  TEAMS_INTEGRATION_HELP_SKIP_LINK_LABEL,
} from "@/lib/teams-integration-help-guide-content";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpTeamsIntegrationGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("teams-integration");

  it("renders skip link, buyer subtitle, orientation above overview, and hides registry provenance", () => {
    if (entry === undefined) {
      throw new Error("Expected teams-integration documentation entry.");
    }

    render(<HelpTeamsIntegrationGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: TEAMS_INTEGRATION_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${TEAMS_INTEGRATION_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(TEAMS_INTEGRATION_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-heading-eyebrow")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-teams-integration-orientation-top")).toBeInTheDocument();
    expect(screen.queryByTestId("help-teams-integration-claim-discipline")).not.toBeInTheDocument();

    const orientationTop = screen.getByTestId("help-teams-integration-orientation-top");
    const overview = screen.getByTestId("help-teams-integration-overview");

    expect(orientationTop.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
