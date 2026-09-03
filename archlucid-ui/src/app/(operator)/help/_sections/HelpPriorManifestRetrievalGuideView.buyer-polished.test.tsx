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

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => <div data-testid="help-topic-print-button" />,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpPriorManifestRetrievalGuideView } from "@/app/(operator)/help/_sections/HelpPriorManifestRetrievalGuideView";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_FOLLOW_UPS_TITLE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES,
} from "@/lib/prior-manifest-retrieval-help-evidence-copy";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_FIRST_VIEWPORT_TEST_ID,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_CONTENT_ID,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SKIP_LINK_LABEL,
  PRIOR_MANIFEST_RETRIEVAL_HELP_SKIP_TARGET_ID,
} from "@/lib/prior-manifest-retrieval-help-page-copy";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS } from "@/lib/prior-manifest-retrieval-help-guide-content";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpPriorManifestRetrievalGuideView buyer-polished shell (HPR)", () => {
  const loaded = tryLoadProductDocumentation("prior-manifest-retrieval");

  it("renders skip link, workspace before follow-ups, header claim discipline, and hides contextual help", () => {
    if (loaded === null) {
      throw new Error("Expected prior-manifest-retrieval documentation to load.");
    }

    render(<HelpPriorManifestRetrievalGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: PRIOR_MANIFEST_RETRIEVAL_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PRIOR_MANIFEST_RETRIEVAL_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-prior-manifest-retrieval-header-claim-discipline")).toHaveTextContent(
      PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-prior-manifest-retrieval-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-prior-manifest-retrieval-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: PRIOR_MANIFEST_RETRIEVAL_HELP_FOLLOW_UPS_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("help-prior-manifest-retrieval-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(PRIOR_MANIFEST_RETRIEVAL_HELP_FIRST_VIEWPORT_TEST_ID);
    const orientationBottom = screen.getByTestId("help-prior-manifest-retrieval-orientation-bottom");
    const sourcesSection = screen.getByTestId("help-prior-manifest-retrieval-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);
    expect(screen.getByTestId("help-prior-manifest-retrieval-open-ask")).toHaveAttribute(
      "href",
      PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.href,
    );

    for (const source of PRIOR_MANIFEST_RETRIEVAL_HELP_SOURCES) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
