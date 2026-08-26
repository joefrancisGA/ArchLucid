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

import { HelpSubprocessorsGuideView } from "@/app/(operator)/help/_sections/HelpSubprocessorsGuideView";
import {
  SUBPROCESSORS_HELP_PAGE_SUBTITLE,
  SUBPROCESSORS_HELP_PAGE_SUBTITLE_BUYER,
  SUBPROCESSORS_HELP_PRIMARY_CONTENT_ID,
  SUBPROCESSORS_HELP_SKIP_LINK_LABEL,
} from "@/lib/subprocessors-help-guide-content";
import { SUBPROCESSORS_HELP_CLAIM_DISCIPLINE } from "@/lib/subprocessors-help-evidence-copy";
import { SUBPROCESSORS_HELP_RELATED_TEST_ID } from "@/lib/subprocessors-help-related-guides";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpSubprocessorsGuideView buyer-polished shell", () => {
  const loaded = tryLoadProductDocumentation("subprocessors");

  it("renders skip link, buyer subtitle, orientation above overview, and hides operator chrome", () => {
    if (loaded === null) {
      throw new Error("Expected subprocessors documentation to load.");
    }

    render(<HelpSubprocessorsGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: SUBPROCESSORS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${SUBPROCESSORS_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(SUBPROCESSORS_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(SUBPROCESSORS_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-breadcrumb")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-subprocessors-header-metadata")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-heading-eyebrow")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-subprocessors-header-actions")).not.toBeInTheDocument();
    expect(screen.queryByTestId(SUBPROCESSORS_HELP_RELATED_TEST_ID)).not.toBeInTheDocument();
    expect(screen.getByTestId("help-subprocessors-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("help-subprocessors-claim-discipline-strip")).toHaveTextContent(
      SUBPROCESSORS_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("subprocessors-help-claim-discipline")).not.toBeInTheDocument();

    const primaryContent = document.getElementById(SUBPROCESSORS_HELP_PRIMARY_CONTENT_ID);

    expect(primaryContent).not.toBeNull();

    const orderedLandmarks = within(primaryContent as HTMLElement)
      .getAllByTestId(/help-subprocessors-(orientation-top|overview)/)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["help-subprocessors-orientation-top", "help-subprocessors-overview"]);
  });
});
