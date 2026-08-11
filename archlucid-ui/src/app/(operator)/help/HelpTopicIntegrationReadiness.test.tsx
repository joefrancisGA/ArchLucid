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

import { HelpTopicMarkdownView } from "@/app/(operator)/help/HelpTopicMarkdownView";
import { IntegrationReadinessHelpEvidenceOrientationStrip } from "@/components/help/IntegrationReadinessHelpEvidenceOrientationStrip";
import {
  INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE,
  INTEGRATION_READINESS_HELP_PRIMARY_ACTION,
} from "@/lib/integration-readiness-help-evidence-copy";
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

  it("renders Connection status primary action in help-topic-export-actions", () => {
    if (loaded === null || entry === null) {
      throw new Error("Expected integration-readiness help to load.");
    }

    render(
      <HelpTopicMarkdownView
        entry={entry}
        markdown={loaded.markdown}
        showContextualHelp
        evidenceOrientation={<IntegrationReadinessHelpEvidenceOrientationStrip />}
      />,
    );

    const exportActions = screen.getByTestId("help-topic-export-actions");
    const connectionStatusLink = within(exportActions).getByRole("link", {
      name: INTEGRATION_READINESS_HELP_PRIMARY_ACTION.label,
    });

    expect(connectionStatusLink).toHaveAttribute("href", INTEGRATION_READINESS_HELP_PRIMARY_ACTION.href);
    expect(screen.getByTestId("page-contextual-help-button")).toBeInTheDocument();
    expect(screen.getByText(INTEGRATION_READINESS_HELP_CLAIM_DISCIPLINE)).toBeInTheDocument();
    expect(screen.getByTestId("integration-readiness-help-sources")).toBeInTheDocument();
  });
});
