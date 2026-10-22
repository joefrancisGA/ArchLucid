import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import { ARCHITECTURES_LIST_CLAIM_DISCIPLINE, ARCHITECTURES_LIST_FOLLOW_UPS_TITLE, ARCHITECTURES_LIST_SOURCES } from "@/lib/architectures-list-evidence-copy";
import {
  ARCHITECTURES_HUB_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER,
  ARCHITECTURES_HUB_PAGE_TITLE,
  ARCHITECTURES_HUB_PRIMARY_CONTENT_ID,
  ARCHITECTURES_HUB_SKIP_LINK_LABEL,
  ARCHITECTURES_HUB_SKIP_TARGET_ID,
} from "@/lib/architectures-hub-copy";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => true,
}));

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();

  return {
    ...actual,
    useWorkspaceMode: () => ({ isWorkingMode: false }),
  };
});

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/components/architecture/ArchitectureDraftListClient", () => ({
  ArchitectureDraftListClient: () => <div data-testid="architecture-draft-list" />,
}));

vi.mock("./_sections/ArchitecturesHubHeaderActions", () => ({
  ArchitecturesHubHeaderActions: () => <div data-testid="architectures-hub-header-actions" />,
}));

import ArchitecturesListPage from "./page";

describe("ArchitecturesListPage buyer-polished shell (ARA)", () => {
  it("renders skip link, first-viewport band, orientation above draft list, and Sources links", () => {
    render(<ArchitecturesListPage />);

    expect(screen.getByRole("link", { name: ARCHITECTURES_HUB_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURES_HUB_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("architectures-hub-primary-content")).toHaveAttribute(
      "id",
      ARCHITECTURES_HUB_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("architectures-hub-page-title")).toHaveTextContent(ARCHITECTURES_HUB_PAGE_TITLE);
    expect(screen.getByText(ARCHITECTURES_HUB_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByTestId("architectures-hub-breadcrumb")).not.toBeInTheDocument();
    expect(screen.getByTestId("architectures-hub-claim-discipline").textContent).toContain(
      ARCHITECTURES_LIST_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.getByRole("heading", { level: 2, name: ARCHITECTURES_LIST_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    const primaryContent = screen.getByTestId("architectures-hub-primary-content");
    const firstViewport = screen.getByTestId(ARCHITECTURES_HUB_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("architectures-hub-orientation-top");
    const draftList = screen.getByTestId("architecture-draft-list");
    const sourcesSection = screen.getByTestId("architectures-hub-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(draftList);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(draftList) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    for (const source of filterWhereToGoNextFollowUpLinks(ARCHITECTURES_LIST_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
  });
});
