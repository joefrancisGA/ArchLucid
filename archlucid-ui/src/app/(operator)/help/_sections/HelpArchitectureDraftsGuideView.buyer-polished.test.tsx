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

import { HelpArchitectureDraftsGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureDraftsGuideView";
import {
  ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE,
  ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE_BUYER,
  ARCHITECTURE_DRAFTS_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_DRAFTS_HELP_SKIP_LINK_LABEL,
} from "@/lib/architecture-drafts-help-guide-content";
import { ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE } from "@/lib/architecture-drafts-help-evidence-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";

describe("HelpArchitectureDraftsGuideView buyer-polished shell", () => {
  const entry = getProductDocumentationEntry("architecture-drafts");

  it("renders skip link, buyer subtitle, orientation above overview, and hides registry provenance", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-drafts documentation entry.");
    }

    render(<HelpArchitectureDraftsGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: ARCHITECTURE_DRAFTS_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_DRAFTS_HELP_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByText(ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(ARCHITECTURE_DRAFTS_HELP_PAGE_SUBTITLE)).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-registry-provenance")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-heading-eyebrow")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-drafts-orientation-top")).toBeInTheDocument();
    expect(screen.getByTestId("help-architecture-drafts-claim-discipline").textContent).toContain(
      ARCHITECTURE_DRAFTS_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );

    const primaryContent = screen.getByTestId("help-architecture-drafts-guide");
    const orderedLandmarks = within(primaryContent)
      .getAllByTestId(/help-architecture-drafts-(orientation-top|overview)/)
      .map((node) => node.getAttribute("data-testid"));

    expect(orderedLandmarks).toEqual([
      "help-architecture-drafts-orientation-top",
      "help-architecture-drafts-overview",
    ]);
  });
});
