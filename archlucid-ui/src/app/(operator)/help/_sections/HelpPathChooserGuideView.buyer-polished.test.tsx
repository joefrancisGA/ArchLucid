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

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/choose-your-next-step",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpPathChooserGuideView } from "@/app/(operator)/help/_sections/HelpPathChooserGuideView";
import {
  PATH_CHOOSER_HELP_FIRST_VIEWPORT_TEST_ID,
  PATH_CHOOSER_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  PATH_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID,
  PATH_CHOOSER_HELP_PAGE_LEAD,
  PATH_CHOOSER_HELP_PAGE_SUBTITLE,
  PATH_CHOOSER_HELP_PAGE_SUBTITLE_BUYER,
  PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID,
  PATH_CHOOSER_HELP_SKIP_LINK_LABEL,
  PATH_CHOOSER_HELP_SKIP_TARGET_ID,
  PATH_CHOOSER_HELP_START_HERE_HELPER,
} from "@/lib/path-chooser-help-guide-content";
import {
  PATH_CHOOSER_HELP_CLAIM_DISCIPLINE,
  PATH_CHOOSER_HELP_FOLLOW_UPS_TITLE,
  PATH_CHOOSER_HELP_ORIENTATION_SOURCES,
} from "@/lib/path-chooser-help-evidence-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

describe("HelpPathChooserGuideView buyer-polished shell (HPX)", () => {
  const loaded = tryLoadProductDocumentation("choose-your-next-step");

  it("renders skip link, buyer subtitle, first-viewport intro, bottom orientation, and hides operator chrome", () => {
    if (loaded === null) {
      throw new Error("Expected path-chooser documentation to load.");
    }

    render(<HelpPathChooserGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: PATH_CHOOSER_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PATH_CHOOSER_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(PATH_CHOOSER_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(PATH_CHOOSER_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-heading-eyebrow")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-print-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-path-chooser-claim-discipline")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-path-chooser-orientation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("path-chooser-create-object-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId(PATH_CHOOSER_HELP_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      PATH_CHOOSER_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByTestId("help-path-chooser-intro")).toHaveTextContent(PATH_CHOOSER_HELP_PAGE_LEAD);
    expect(screen.getByTestId("help-path-chooser-start-here-helper")).toHaveTextContent(
      PATH_CHOOSER_HELP_START_HERE_HELPER,
    );
    expect(screen.getByRole("heading", { level: 2, name: PATH_CHOOSER_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.getByTestId("help-path-chooser-sources")).toBeInTheDocument();

    const primaryContent = screen.getByTestId(PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(PATH_CHOOSER_HELP_FIRST_VIEWPORT_TEST_ID);
    const branches = screen.getByTestId("help-path-chooser-branches");
    const orientationBottom = screen.getByTestId(PATH_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("help-path-chooser-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(branches);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(orientationBottom).toContainElement(sourcesSection);

    expectWhereToGoNextFollowUpLinks(within(sourcesSection), PATH_CHOOSER_HELP_ORIENTATION_SOURCES, "/help/choose-your-next-step");

    expect(firstViewport.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
