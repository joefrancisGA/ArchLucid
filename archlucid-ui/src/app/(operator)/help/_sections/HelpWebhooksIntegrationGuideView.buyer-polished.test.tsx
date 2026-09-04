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

vi.mock("@/lib/resolve-nav-link-for-pathname", () => ({
  resolveNavIconForHref: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/webhooks-integration",
}));

import { HelpWebhooksIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpWebhooksIntegrationGuideView";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
} from "@/lib/webhooks-integration-help-evidence-copy";
import {
  WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE,
  WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION,
  WEBHOOKS_INTEGRATION_HELP_START_HERE_CARD_TITLE,
} from "@/lib/webhooks-integration-help-guide-content";
import {
  WEBHOOKS_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID,
  WEBHOOKS_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  WEBHOOKS_INTEGRATION_HELP_SKIP_LINK_LABEL,
  WEBHOOKS_INTEGRATION_HELP_SKIP_TARGET_ID,
} from "@/lib/webhooks-integration-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpWebhooksIntegrationGuideView buyer-polished shell (HEW)", () => {
  const entry = getProductDocumentationEntry("webhooks-integration");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides operator chrome", () => {
    if (entry === undefined) {
      throw new Error("Expected webhooks-integration documentation entry.");
    }

    render(<HelpWebhooksIntegrationGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: WEBHOOKS_INTEGRATION_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${WEBHOOKS_INTEGRATION_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId(WEBHOOKS_INTEGRATION_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-webhooks-integration-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-webhooks-integration-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-webhooks-integration-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-webhooks-integration-role-tag")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: WEBHOOKS_INTEGRATION_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-webhooks-integration-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId("help-webhooks-integration-primary-content");
    const firstViewport = screen.getByTestId(WEBHOOKS_INTEGRATION_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-webhooks-integration-action-panel");
    const orientationBottom = screen.getByTestId("help-webhooks-integration-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-webhooks-integration-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(within(actionPanel).getByTestId("help-webhooks-integration-mutation-prerequisite")).toHaveTextContent(
      WEBHOOKS_INTEGRATION_HELP_MUTATION_PREREQUISITE_NOTICE,
    );
    expect(
      within(actionPanel).getByRole("link", { name: WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.label }),
    ).toHaveAttribute("href", WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.href);
    expect(
      screen.getByRole("heading", { level: 2, name: WEBHOOKS_INTEGRATION_HELP_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();

    for (const source of filterWhereToGoNextFollowUpLinks(WEBHOOKS_INTEGRATION_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
