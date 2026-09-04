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

import { HelpCloudConnectionsGuideView } from "@/app/(operator)/help/_sections/HelpCloudConnectionsGuideView";
import {
  CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE,
  CLOUD_CONNECTIONS_SOURCES,
} from "@/lib/cloud-connections-evidence-copy";
import {
  CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE,
  CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE,
  CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS,
} from "@/lib/cloud-connections-help-guide-content";
import {
  CLOUD_CONNECTIONS_HELP_FIRST_VIEWPORT_TEST_ID,
  CLOUD_CONNECTIONS_HELP_PRIMARY_CONTENT_ID,
  CLOUD_CONNECTIONS_HELP_SKIP_LINK_LABEL,
  CLOUD_CONNECTIONS_HELP_SKIP_TARGET_ID,
} from "@/lib/cloud-connections-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpCloudConnectionsGuideView buyer-polished shell (HCE)", () => {
  const entry = getProductDocumentationEntry("cloud-connections");

  it("renders skip link, first-viewport action panel, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected cloud-connections documentation entry.");
    }

    render(
      <HelpCloudConnectionsGuideView
        entry={entry}
        markdown="# Cloud connections\n\nOptional connectors.\n\n## Related topics\n\n- [Security](/help/security-trust)\n"
      />,
    );

    expect(screen.getByRole("link", { name: CLOUD_CONNECTIONS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${CLOUD_CONNECTIONS_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-cloud-connections-header-claim-discipline")).toHaveTextContent(
      CLOUD_CONNECTIONS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-cloud-connections-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: CLOUD_CONNECTIONS_HELP_ORIENTATION_TITLE })).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-cloud-connections-action-panel")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: CLOUD_CONNECTIONS_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-cloud-connections-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(CLOUD_CONNECTIONS_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(CLOUD_CONNECTIONS_HELP_FIRST_VIEWPORT_TEST_ID);
    const startHerePanel = screen.getByTestId("help-cloud-connections-start-here-panel");
    const orientationBottom = screen.getByTestId("help-cloud-connections-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-cloud-connections-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(startHerePanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-cloud-connections-start-here-primary-cta")).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.startEvidenceOnlyReview.href,
    );
    expect(screen.getByTestId("help-cloud-connections-header-primary-cta")).toHaveAttribute(
      "href",
      CLOUD_CONNECTIONS_HELP_PRIMARY_ACTIONS.startEvidenceOnlyReview.href,
    );
    expect(screen.queryByTestId("help-cloud-connections-primary-cta")).not.toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(CLOUD_CONNECTIONS_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
