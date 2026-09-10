import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => true,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/architecture/ArchitectureDraftWorkspace", () => ({
  ArchitectureDraftWorkspace: () => <div data-testid="architecture-draft-workspace" />,
}));

vi.mock("./_sections/ArchitecturesNewPageHeaderActions", () => ({
  ArchitecturesNewPageHeaderActions: () => <div data-testid="architectures-new-page-header-actions" />,
}));

import NewArchitecturePage from "./page";
import { CREATE_ARCHITECTURE_LABEL } from "@/lib/architecture/architecture-workflow-labels";
import {
  ARCHITECTURES_NEW_CLAIM_DISCIPLINE,
  ARCHITECTURES_NEW_SOURCES,
} from "@/lib/architectures-new-evidence-copy";
import {
  ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE,
  ARCHITECTURES_NEW_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER,
  ARCHITECTURES_NEW_PRIMARY_CONTENT_ID,
  ARCHITECTURES_NEW_SKIP_LINK_LABEL,
  ARCHITECTURES_NEW_SKIP_TARGET_ID,
} from "@/lib/architectures-new-page-copy";

describe("NewArchitecturePage buyer-polished shell (ANE)", () => {
  it("renders skip link, first-viewport band, orientation above draft workspace, and Sources links", () => {
    render(<NewArchitecturePage />);

    expect(screen.getByRole("link", { name: ARCHITECTURES_NEW_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURES_NEW_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("architectures-new-primary-content")).toHaveAttribute(
      "id",
      ARCHITECTURES_NEW_PRIMARY_CONTENT_ID,
    );

    const pageSubtitle = screen.getByTestId("architecture-new-page-subtitle");
    expect(screen.getByTestId("architecture-new-page-title")).toHaveTextContent(CREATE_ARCHITECTURE_LABEL);
    expect(pageSubtitle).toHaveTextContent(ARCHITECTURES_NEW_PAGE_SUBTITLE_BUYER);
    expect(pageSubtitle).toHaveTextContent(ARCHITECTURES_NEW_DRAFTING_SCOPE_SENTENCE);
    expect(screen.getByTestId("architectures-new-claim-discipline").textContent).toContain(
      ARCHITECTURES_NEW_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: "Where to go next" })).toBeInTheDocument();

    const primaryContent = screen.getByTestId("architectures-new-primary-content");
    const firstViewport = screen.getByTestId(ARCHITECTURES_NEW_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("architectures-new-orientation-top");
    const draftWorkspace = screen.getByTestId("architecture-draft-workspace");
    const sourcesSection = screen.getByTestId("architectures-new-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(draftWorkspace);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(draftWorkspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(ARCHITECTURES_NEW_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
