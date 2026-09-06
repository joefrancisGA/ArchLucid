import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/help/MermaidDiagram", () => ({
  MermaidDiagram: ({ source }: { readonly source: string }) => (
    <div data-testid="help-evidence-trail-provenance-diagram">{source}</div>
  ),
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpEvidenceTrailGuideView } from "@/app/(operator)/help/_sections/HelpEvidenceTrailGuideView";
import {
  EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE,
  EVIDENCE_TRAIL_HELP_FOLLOW_UPS_TITLE,
  EVIDENCE_TRAIL_HELP_PRIMARY_ACTION,
  EVIDENCE_TRAIL_HELP_SOURCES,
} from "@/lib/evidence-trail-help-evidence-copy";
import {
  EVIDENCE_TRAIL_HELP_FIRST_VIEWPORT_TEST_ID,
  EVIDENCE_TRAIL_HELP_PRIMARY_CONTENT_ID,
  EVIDENCE_TRAIL_HELP_SKIP_LINK_LABEL,
  EVIDENCE_TRAIL_HELP_SKIP_TARGET_ID,
} from "@/lib/evidence-trail-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpEvidenceTrailGuideView buyer-polished shell (EV)", () => {
  const loaded = tryLoadProductDocumentation("evidence-trail");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected evidence-trail documentation to load.");
    }

    render(<HelpEvidenceTrailGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: EVIDENCE_TRAIL_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${EVIDENCE_TRAIL_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-evidence-trail-header-claim-discipline")).toHaveTextContent(
      EVIDENCE_TRAIL_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("evidence-trail-help-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: EVIDENCE_TRAIL_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-evidence-trail-sources")).toBeInTheDocument();
    expect(screen.getByTestId("help-evidence-trail-mermaid-diagram")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(EVIDENCE_TRAIL_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(EVIDENCE_TRAIL_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-evidence-trail-action-panel");
    const orientationBottom = screen.getByTestId("help-evidence-trail-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-evidence-trail-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId(EVIDENCE_TRAIL_HELP_PRIMARY_ACTION.testId)).toHaveAttribute(
      "href",
      EVIDENCE_TRAIL_HELP_PRIMARY_ACTION.href,
    );

    for (const source of filterWhereToGoNextFollowUpLinks(EVIDENCE_TRAIL_HELP_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
