import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

import { HelpWebhooksIntegrationGuideView } from "@/app/(operator)/help/_sections/HelpWebhooksIntegrationGuideView";
import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
  WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS,
  WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION,
} from "@/lib/webhooks-integration-help-guide-content";
import {
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE,
  WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING,
  WEBHOOKS_INTEGRATION_HELP_SOURCES,
} from "@/lib/webhooks-integration-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpWebhooksIntegrationGuideView", () => {
  const entry = getProductDocumentationEntry("webhooks-integration");

  it("renders claim discipline heading id and guide headings in the TOC", () => {
    if (entry === undefined) {
      throw new Error("Expected webhooks-integration documentation entry.");
    }

    render(<HelpWebhooksIntegrationGuideView entry={entry} />);

    expect(screen.getByTestId("help-webhooks-integration-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-webhooks-integration-overview").textContent?.toLowerCase()).not.toContain(
      "sources package",
    );
    expect(screen.getByTestId("help-webhooks-integration-claim-discipline").textContent).toContain(
      WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { name: WEBHOOKS_INTEGRATION_HELP_CLAIM_DISCIPLINE_HEADING })).toHaveAttribute(
      "id",
      WEBHOOKS_INTEGRATION_HELP_CLAIM_HEADING_ID,
    );
    expect(screen.getByRole("link", { name: WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.label })).toHaveAttribute(
      "href",
      WEBHOOKS_INTEGRATION_HELP_PRIMARY_ACTION.href,
    );

    for (const source of WEBHOOKS_INTEGRATION_HELP_SOURCES) {
      expect(screen.getByRole("link", { name: source.label })).toHaveAttribute("href", source.href);
    }

    for (const heading of WEBHOOKS_INTEGRATION_HELP_GUIDE_HEADINGS) {
      expect(screen.getByRole("heading", { level: 2, name: heading.title })).toBeInTheDocument();
    }
  });
});
