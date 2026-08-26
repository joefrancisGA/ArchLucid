import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPdfDownloadButton", () => ({
  HelpTopicPdfDownloadButton: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => null,
}));

import { HelpIntegrationReadinessGuideView } from "@/app/(operator)/help/_sections/HelpIntegrationReadinessGuideView";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_PRIMARY_ACTION,
} from "@/lib/integration-readiness-help-evidence-copy";
import {
  INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID,
  INTEGRATION_READINESS_HELP_STATUS_GLOSSARY_TITLE,
} from "@/lib/integration-readiness-help-guide-content";
import { INTEGRATION_READINESS_HELP_RELATED_TEST_ID } from "@/lib/integration-readiness-help-related-guides";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

const GUIDE_SLUG = "integration-readiness";

describe("HelpTopicIntegrationReadiness (HEI)", () => {
  const entry = getProductDocumentationEntry(GUIDE_SLUG);
  const loaded = tryLoadProductDocumentation(GUIDE_SLUG);

  it("registers integration-readiness help metadata", () => {
    expect(entry?.title).toBe("Integration readiness");
    expect(loaded).not.toBeNull();
  });

  it("renders specialty guide with Connection status CTA before status glossary (TB-1696, TB-1699)", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected integration-readiness help to load.");
    }

    render(<HelpIntegrationReadinessGuideView entry={entry} markdown={loaded.markdown} />);

    expect(screen.getByTestId("help-integration-readiness-guide")).toBeInTheDocument();
    expect(screen.getByTestId("help-integration-readiness-page-title")).toHaveTextContent("Integration readiness");

    const connectionStatusLink = within(screen.getByTestId("help-integration-readiness-action-panel")).getByRole(
      "link",
      {
        name: INTEGRATION_READINESS_HELP_PRIMARY_ACTION.label,
      },
    );

    expect(connectionStatusLink).toHaveAttribute("href", INTEGRATION_READINESS_HELP_PRIMARY_ACTION.href);
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByTestId("help-integration-readiness-claim-discipline-strip")).toHaveTextContent(
      INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.getByTestId("integration-readiness-help-sources")).toBeInTheDocument();
    expect(screen.getByTestId(INTEGRATION_READINESS_HELP_RELATED_TEST_ID)).toBeInTheDocument();

    const firstViewport = screen.getByTestId(INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID);
    const statusGlossary = screen.getByTestId("help-integration-readiness-status-glossary");

    expect(
      firstViewport.compareDocumentPosition(statusGlossary) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(within(firstViewport).queryByRole("columnheader", { name: /^ready$/i })).toBeNull();

    const configureBody = screen.getByTestId("help-integration-readiness-configure-body");

    expect(within(configureBody).getByRole("link", { name: /^digests$/i })).toHaveAttribute(
      "href",
      "/architecture/digests",
    );
  });
});
