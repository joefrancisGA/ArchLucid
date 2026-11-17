import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => false,
  useProductionEvalChrome: () => true,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionDeskChrome: () => false,
  useProductionEvalChrome: () => true,
}));

vi.mock("@/app/(operator)/help/HelpTopicHashScroll", () => ({
  HelpTopicHashScroll: () => null,
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/help/architecture-scorecard",
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/WhereToGoNextPreferenceProvider", () => ({
  useWhereToGoNextVisible: () => true,
}));

import { HelpArchitectureScorecardGuideView } from "@/app/(operator)/help/_sections/HelpArchitectureScorecardGuideView";
import {
  ARCHITECTURE_SCORECARD_HELP_CANONICAL_PATH,
  ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE,
  ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
  ARCHITECTURE_SCORECARD_HELP_SOURCES,
} from "@/lib/architecture-scorecard-help-evidence-copy";
import { ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION } from "@/lib/architecture-scorecard-help-guide-content";
import {
  ARCHITECTURE_SCORECARD_HELP_FIRST_VIEWPORT_TEST_ID,
  ARCHITECTURE_SCORECARD_HELP_ORIENTATION_BOTTOM_TEST_ID,
  ARCHITECTURE_SCORECARD_HELP_PRIMARY_CONTENT_ID,
  ARCHITECTURE_SCORECARD_HELP_SKIP_LINK_LABEL,
  ARCHITECTURE_SCORECARD_HELP_SKIP_TARGET_ID,
} from "@/lib/architecture-scorecard-help-page-copy";
import { getProductDocumentationEntry } from "@/lib/product-documentation-registry";
import { expectWhereToGoNextFollowUpLinks } from "@/lib/claim-discipline-test-helpers";

describe("HelpArchitectureScorecardGuideView buyer-polished shell (HER)", () => {
  const entry = getProductDocumentationEntry("architecture-scorecard");

  it("renders skip link, first-viewport action panel, header claim discipline, and sources-only orientation", () => {
    if (entry === undefined) {
      throw new Error("Expected architecture-scorecard documentation entry.");
    }

    render(<HelpArchitectureScorecardGuideView entry={entry} />);

    expect(screen.getByRole("link", { name: ARCHITECTURE_SCORECARD_HELP_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ARCHITECTURE_SCORECARD_HELP_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("help-architecture-scorecard-header-claim-discipline")).toHaveTextContent(
      ARCHITECTURE_SCORECARD_HELP_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("help-architecture-scorecard-claim-discipline-strip")).not.toBeInTheDocument();
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("scorecard-roi-vocabulary")).not.toBeInTheDocument();
    expect(screen.queryByTestId("help-architecture-scorecard-primary-action")).not.toBeInTheDocument();
    expect(
      within(screen.getByTestId("help-architecture-scorecard-sources")).getByRole("heading", {
        level: 2,
        name: ARCHITECTURE_SCORECARD_HELP_RELATED_SOURCES_TITLE,
      }),
    ).toBeInTheDocument();

    const primaryContent = screen.getByTestId(ARCHITECTURE_SCORECARD_HELP_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(ARCHITECTURE_SCORECARD_HELP_FIRST_VIEWPORT_TEST_ID);
    const actionPanel = screen.getByTestId("help-architecture-scorecard-action-panel");
    const sourcesSection = screen.getByTestId("help-architecture-scorecard-sources");
    const sourcesCollapsibles = screen.getAllByTestId(ARCHITECTURE_SCORECARD_HELP_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesCollapsible =
      sourcesCollapsibles.find((element) => element.contains(sourcesSection)) ?? sourcesCollapsibles[0]!;
    const claimOrientationBottom = sourcesCollapsibles.find(
      (element) => !element.contains(sourcesSection),
    );

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(actionPanel);
    expect(primaryContent).toContainElement(sourcesCollapsible);
    expect(sourcesCollapsible).toContainElement(sourcesSection);
    expect(claimOrientationBottom).toBeDefined();
    expect(primaryContent).toContainElement(claimOrientationBottom!);
    expect(screen.getByTestId("help-architecture-scorecard-start-here-primary-cta")).toHaveAttribute(
      "href",
      ARCHITECTURE_SCORECARD_HELP_PRIMARY_ACTION.href,
    );

    expectWhereToGoNextFollowUpLinks(
      within(sourcesSection),
      ARCHITECTURE_SCORECARD_HELP_SOURCES,
      ARCHITECTURE_SCORECARD_HELP_CANONICAL_PATH,
    );

    expect(
      firstViewport.compareDocumentPosition(sourcesCollapsible) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

vi.mock("@/components/WorkspaceModeProvider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/components/WorkspaceModeProvider")>();
  const guidedWorkspace = {
    mode: "guided" as const,
    mounted: true,
    accountSyncState: "synced" as const,
    isWorkingMode: false,
    setAndPersist: vi.fn(),
  };

  return {
    ...actual,
    useWorkspaceMode: () => guidedWorkspace,
    useWorkspaceModeOrDefault: () => guidedWorkspace,
  };
});


