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
}));

import { HelpPathChooserGuideView } from "@/app/(operator)/help/_sections/HelpPathChooserGuideView";
import {
  PATH_CHOOSER_HELP_PAGE_SUBTITLE,
  PATH_CHOOSER_HELP_PAGE_SUBTITLE_BUYER,
  PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID,
  PATH_CHOOSER_HELP_SKIP_LINK_LABEL,
} from "@/lib/path-chooser-help-guide-content";
import { PATH_CHOOSER_HELP_CLAIM_DISCIPLINE } from "@/lib/path-chooser-help-evidence-copy";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpPathChooserGuideView buyer-polished shell", () => {
  const loaded = tryLoadProductDocumentation("choose-your-next-step");

  it("renders skip link, buyer subtitle, orientation above overview, and hides operator chrome", () => {
    if (loaded === null) {
      throw new Error("Expected path-chooser documentation to load.");
    }

    render(<HelpPathChooserGuideView entry={loaded.entry} markdown={loaded.markdown} />);

    expect(screen.getByRole("link", { name: PATH_CHOOSER_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(PATH_CHOOSER_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(PATH_CHOOSER_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.getByTestId("help-topic-breadcrumb")).toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("path-chooser-create-object-vocabulary")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-path-chooser-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("help-path-chooser-claim-discipline").textContent).toContain(
      PATH_CHOOSER_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const primaryContent = document.getElementById(PATH_CHOOSER_HELP_PRIMARY_CONTENT_ID);

    expect(primaryContent).not.toBeNull();

    const orderedLandmarks = within(primaryContent as HTMLElement)
      .getAllByTestId(/help-path-chooser-(orientation-top|overview)/)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual(["help-path-chooser-orientation-top", "help-path-chooser-overview"]);
  });
});
