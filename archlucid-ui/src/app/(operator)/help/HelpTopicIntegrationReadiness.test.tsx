import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

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
  INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE,
  INTEGRATION_READINESS_HELP_PRIMARY_ACTION,
  INTEGRATION_READINESS_HELP_SOURCES,
} from "@/lib/integration-readiness-help-evidence-copy";
import {
  INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID,
  INTEGRATION_READINESS_HELP_STATUS_GLOSSARY_TITLE,
} from "@/lib/integration-readiness-help-guide-content";
import {
  INTEGRATION_READINESS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
} from "@/lib/integration-readiness-help-page-copy";
import { INTEGRATION_READINESS_HELP_RELATED_TEST_ID } from "@/lib/integration-readiness-help-related-guides";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
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
    expect(screen.getByTestId(INTEGRATION_READINESS_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("help-integration-readiness-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("integration-readiness-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: INTEGRATION_READINESS_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-integration-readiness-sources")).toBeInTheDocument();
    expect(screen.getByTestId(INTEGRATION_READINESS_HELP_RELATED_TEST_ID)).toBeInTheDocument();

    const sourcesSection = screen.getByTestId("help-integration-readiness-sources");

    for (const source of filterWhereToGoNextFollowUpLinks(INTEGRATION_READINESS_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    const firstViewport = screen.getByTestId(INTEGRATION_READINESS_HELP_FIRST_VIEWPORT_TEST_ID);
    const statusGlossary = screen.getByTestId("help-integration-readiness-status-glossary");
    const orientationBottom = screen.getByTestId("help-integration-readiness-orientation-bottom");

    expect(
      firstViewport.compareDocumentPosition(statusGlossary) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(within(firstViewport).queryByRole("columnheader", { name: /^ready$/i })).toBeNull();

    const configureBody = screen.getByTestId("help-integration-readiness-configure-body");

    expect(within(configureBody).getByRole("link", { name: /^digests$/i })).toHaveAttribute(
      "href",
      "/architecture/digests",
    );
  });
});
