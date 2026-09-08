/** @vitest-environment jsdom */
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { expectFollowUpLink } from "@/lib/claim-discipline-test-helpers";

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
  HELP_TOPIC_CATCHALL_PRIMARY_CONTENT_ID,
  HELP_TOPIC_CATCHALL_SKIP_LINK_LABEL,
} from "@/lib/help/help-topic-catchall-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

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
    expect(screen.getByTestId("help-topic-catchall-residual")).toBeInTheDocument();

    const primary = screen.getByTestId(HELP_TOPIC_CATCHALL_PRIMARY_CONTENT_ID);
    const content = screen.getByTestId("help-topic-content");
    const orientation = screen.getByTestId("help-topic-catchall-orientation-bottom");

    expect(primary).toContainElement(content);
    expect(primary).toContainElement(orientation);
    expect(content.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    expect(screen.getByRole("heading", { level: 2, name: "Overview" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: HELP_TOPIC_CATCHALL_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    for (const source of HELP_TOPIC_CATCHALL_SOURCES) {
      expectFollowUpLink(screen, source);
    }
  });
});
