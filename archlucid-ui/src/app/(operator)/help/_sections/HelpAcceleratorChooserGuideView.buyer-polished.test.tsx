/** @vitest-environment jsdom */
import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/accelerator-chooser",
  useRouter: () => ({ replace: vi.fn(), push: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/lib/help/help-topic-pdf-download", () => ({
  downloadHelpTopicPdf: vi.fn(),
}));

const useAcceleratorChooserPrerequisitePresentation = vi.fn();

vi.mock("@/hooks/use-accelerator-chooser-prerequisite-presentation", () => ({
  useAcceleratorChooserPrerequisitePresentation: () => useAcceleratorChooserPrerequisitePresentation(),
}));

import { HelpAcceleratorChooserGuideView } from "@/app/(operator)/help/_sections/HelpAcceleratorChooserGuideView";
import {
  ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE,
  ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE,
  ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS,
} from "@/lib/accelerator-chooser-help-evidence-copy";
import {
  ACCELERATOR_CHOOSER_HELP_BUYER_OVERVIEW,
  ACCELERATOR_CHOOSER_HELP_BUYER_START_HERE_HELPER,
  ACCELERATOR_CHOOSER_HELP_FIRST_VIEWPORT_TEST_ID,
  ACCELERATOR_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID,
  ACCELERATOR_CHOOSER_HELP_PAGE_LEAD,
  ACCELERATOR_CHOOSER_HELP_PRIMARY_CONTENT_ID,
  ACCELERATOR_CHOOSER_HELP_SKIP_LINK_LABEL,
  ACCELERATOR_CHOOSER_HELP_SKIP_TARGET_ID,
  ACCELERATOR_CHOOSER_HELP_WORKSPACE_TEST_ID,
} from "@/lib/accelerator-chooser-help-page-copy";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { tryLoadProductDocumentation } from "@/lib/load-product-documentation";

describe("HelpAcceleratorChooserGuideView buyer-polished chrome (HAX)", () => {
  beforeEach(() => {
    useAcceleratorChooserPrerequisitePresentation.mockReturnValue({
      status: "met",
      signedRecordHref: "/architecture/signed-records/manifest-1",
      retry: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
  });

  it("renders skip link, first-viewport intro, start-here panel, and bottom Sources after pack body", () => {
    const loaded = tryLoadProductDocumentation("accelerator-chooser");

    if (loaded === null) {
      throw new Error("Expected accelerator-chooser documentation to load.");
    }

    render(<HelpAcceleratorChooserGuideView entry={loaded.entry} />);

    expect(screen.getByRole("link", { name: ACCELERATOR_CHOOSER_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ACCELERATOR_CHOOSER_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-accelerator-chooser-claim-discipline")).toHaveTextContent(
      ACCELERATOR_CHOOSER_HELP_CLAIM_DISCIPLINE,
    );
    expect(screen.queryByTestId("help-accelerator-chooser-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-accelerator-chooser-related-next-steps")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-topic-toc")).not.toBeInTheDocument();
    expect(screen.getByTestId("help-accelerator-chooser-intro")).toHaveTextContent(
      ACCELERATOR_CHOOSER_HELP_PAGE_LEAD,
    );
    expect(screen.getByTestId("help-accelerator-chooser-overview")).toHaveTextContent(
      ACCELERATOR_CHOOSER_HELP_BUYER_OVERVIEW,
    );
    expect(screen.getByTestId(ACCELERATOR_CHOOSER_HELP_FIRST_VIEWPORT_TEST_ID)).toContainElement(
      screen.getByTestId("help-accelerator-chooser-intro"),
    );
    expect(
      screen.getByTestId(ACCELERATOR_CHOOSER_HELP_FIRST_VIEWPORT_TEST_ID),
    ).not.toContainElement(screen.getByTestId("help-accelerator-chooser-overview"));
    expect(
      screen.getByTestId(ACCELERATOR_CHOOSER_HELP_FIRST_VIEWPORT_TEST_ID).compareDocumentPosition(
        screen.getByTestId("help-accelerator-chooser-overview"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(screen.getByTestId("help-accelerator-chooser-start-here-helper")).toHaveTextContent(
      ACCELERATOR_CHOOSER_HELP_BUYER_START_HERE_HELPER,
    );

    const primary = screen.getByTestId(ACCELERATOR_CHOOSER_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ACCELERATOR_CHOOSER_HELP_FIRST_VIEWPORT_TEST_ID);
    const overview = screen.getByTestId("help-accelerator-chooser-overview");
    const workspace = screen.getByTestId(ACCELERATOR_CHOOSER_HELP_WORKSPACE_TEST_ID);
    const packs = screen.getByTestId("help-accelerator-chooser-packs");
    const orientation = screen.getByTestId(ACCELERATOR_CHOOSER_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("help-accelerator-chooser-sources");

    expect(primary).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(screen.getByTestId("help-accelerator-chooser-start-here-panel"));
    expect(screen.queryByTestId("help-accelerator-chooser-action-panel")).not.toBeInTheDocument();
    expect(primary).toContainElement(overview);
    expect(primary).toContainElement(workspace);
    expect(primary).toContainElement(orientation);
    expect(workspace).toContainElement(packs);
    expect(orientation).toContainElement(sourcesSection);

    expect(screen.getByRole("heading", { level: 2, name: ACCELERATOR_CHOOSER_HELP_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const visibleSources = filterWhereToGoNextFollowUpLinks(ACCELERATOR_CHOOSER_HELP_RELATED_NEXT_STEPS);

    for (const source of visibleSources) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientation) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
