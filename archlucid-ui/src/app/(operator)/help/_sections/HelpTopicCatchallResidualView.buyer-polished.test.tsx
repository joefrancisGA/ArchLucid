/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => null,
}));

import { HelpTopicCatchallResidualView } from "@/app/(operator)/help/_sections/HelpTopicCatchallResidualView";
import {
  HELP_TOPIC_CATCHALL_CLAIM_DISCIPLINE,
  HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE,
  HELP_TOPIC_CATCHALL_SOURCES,
} from "@/lib/help/help-topic-catchall-evidence-copy";
import {
  HELP_TOPIC_CATCHALL_BUYER_OVERVIEW,
  HELP_TOPIC_CATCHALL_BUYER_START_HERE_HELPER,
  HELP_TOPIC_CATCHALL_FIRST_VIEWPORT_TEST_ID,
  HELP_TOPIC_CATCHALL_ORIENTATION_BOTTOM_TEST_ID,
  HELP_TOPIC_CATCHALL_PAGE_LEAD,
  HELP_TOPIC_CATCHALL_PRIMARY_CONTENT_ID,
  HELP_TOPIC_CATCHALL_SKIP_LINK_LABEL,
  HELP_TOPIC_CATCHALL_START_HERE_CARD_TITLE,
  HELP_TOPIC_CATCHALL_WORKSPACE_TEST_ID,
} from "@/lib/help/help-topic-catchall-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

const SAMPLE_MARKDOWN = `## Overview

Use this residual topic when no specialty guide owns the slug yet.

## Related

- [Troubleshooting](/help/troubleshooting)
`;

describe("HelpTopicCatchallResidualView buyer-polished chrome (HE.)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders skip link, header claim discipline, markdown body, and bottom Sources after content", () => {
    const entry = getProductDocumentationEntry("engineering-troubleshooting");

    if (entry === null) {
      throw new Error("Expected engineering-troubleshooting registry entry.");
    }

    render(<HelpTopicCatchallResidualView entry={entry} markdown={SAMPLE_MARKDOWN} />);

    expect(screen.getByRole("link", { name: HELP_TOPIC_CATCHALL_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${HELP_TOPIC_CATCHALL_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("help-topic-catchall-claim-discipline")).toHaveTextContent(
      HELP_TOPIC_CATCHALL_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("help-topic-catchall-intro")).toHaveTextContent(HELP_TOPIC_CATCHALL_PAGE_LEAD);
    expect(screen.getByTestId("help-topic-catchall-overview")).toHaveTextContent(HELP_TOPIC_CATCHALL_BUYER_OVERVIEW);
    expect(screen.getByTestId(HELP_TOPIC_CATCHALL_FIRST_VIEWPORT_TEST_ID)).toContainElement(
      screen.getByTestId("help-topic-catchall-intro"),
    );
    expect(
      screen.getByTestId(HELP_TOPIC_CATCHALL_FIRST_VIEWPORT_TEST_ID),
    ).not.toContainElement(screen.getByTestId("help-topic-catchall-overview"));
    expect(
      screen.getByTestId(HELP_TOPIC_CATCHALL_FIRST_VIEWPORT_TEST_ID).compareDocumentPosition(
        screen.getByTestId("help-topic-catchall-overview"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByTestId("help-topic-catchall-buyer-start-here-helper")).toHaveTextContent(
      HELP_TOPIC_CATCHALL_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: HELP_TOPIC_CATCHALL_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-topic-catchall-residual")).toBeInTheDocument();

    const primary = screen.getByTestId(HELP_TOPIC_CATCHALL_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(HELP_TOPIC_CATCHALL_FIRST_VIEWPORT_TEST_ID);
    const overview = screen.getByTestId("help-topic-catchall-overview");
    const workspace = screen.getByTestId(HELP_TOPIC_CATCHALL_WORKSPACE_TEST_ID);
    const content = screen.getByTestId("help-topic-content");
    const orientation = screen.getByTestId(HELP_TOPIC_CATCHALL_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("help-topic-catchall-sources");

    expect(primary).toContainElement(firstViewport);
    expect(primary).toContainElement(overview);
    expect(primary).toContainElement(workspace);
    expect(primary).toContainElement(orientation);
    expect(workspace).toContainElement(content);
    expect(orientation).toContainElement(sourcesSection);

    expect(screen.getByRole("heading", { level: 2, name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    expectWhereToGoNextFollowUpLinks(within(sourcesSection), HELP_TOPIC_CATCHALL_SOURCES, "/");

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
