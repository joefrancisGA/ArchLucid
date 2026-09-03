import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/help/HelpTopicPrintButton", () => ({
  HelpTopicPrintButton: () => null,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => false,
  };
});

import { HelpPriorManifestRetrievalGuideView } from "@/app/(operator)/help/_sections/HelpPriorManifestRetrievalGuideView";
import { prepareHelpMarkdownForPresentation } from "@/lib/help/help-markdown-presentation";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import {
  PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_TITLE,
  PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS,
} from "@/lib/prior-manifest-retrieval-help-guide-content";
import { PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE } from "@/lib/prior-manifest-retrieval-help-evidence-copy";

describe("HelpPriorManifestRetrievalGuideView", () => {
  const loaded = tryLoadProductDocumentation("prior-manifest-retrieval");

  it("loads prior-manifest retrieval help from customer guide source", () => {
    expect(loaded).not.toBeNull();
    expect(loaded?.entry.title).toBe(PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_TITLE);
  });

  it("renders specialty Ask-memory chrome without host config keys (TB-1731, TB-1733)", () => {
    if (loaded === null) {
      throw new Error("Expected prior-manifest-retrieval documentation to load.");
    }

    const sourcePath = loaded.entry.sourcePaths[0] ?? "";
    const preparedMarkdown = prepareHelpMarkdownForPresentation(loaded.markdown, sourcePath, {
      helpTopicSlug: "prior-manifest-retrieval",
    });

    render(<HelpPriorManifestRetrievalGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    const visible = (document.body.textContent ?? "").toLowerCase();

    expect(preparedMarkdown.toLowerCase()).not.toContain("retrieval:priormanifest");
    expect(preparedMarkdown.toLowerCase()).not.toContain("maxpriormanifestsperindex");
    expect(visible).toContain("five");
    expect(screen.getByTestId("help-prior-manifest-retrieval-page-title")).toHaveTextContent(
      PRIOR_MANIFEST_RETRIEVAL_HELP_PAGE_TITLE,
    );
    expect(screen.getByTestId("help-prior-manifest-retrieval-open-ask")).toHaveAttribute(
      "href",
      PRIOR_MANIFEST_RETRIEVAL_HELP_PRIMARY_ACTIONS.openAsk.href,
    );
    expect(visible).not.toContain("prior manifest retrieval");
    expect(screen.getByTestId("help-prior-manifest-retrieval-job-matrix-current")).toBeInTheDocument();
    expect(screen.getByTestId("help-prior-manifest-retrieval-header-claim-discipline")).toHaveTextContent(
      PRIOR_MANIFEST_RETRIEVAL_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("help-prior-manifest-retrieval-claim-discipline-strip")).toBeNull();
    expect(screen.getByTestId("help-prior-manifest-retrieval-sources")).toBeInTheDocument();
  });
});
