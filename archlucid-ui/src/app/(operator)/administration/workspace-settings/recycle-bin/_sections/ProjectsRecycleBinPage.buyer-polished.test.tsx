import { render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AUTHORITY_RANK } from "@/lib/nav-authority";
import {
  PROJECTS_RECYCLE_BIN_CLAIM_DISCIPLINE,
  PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE,
  PROJECTS_RECYCLE_BIN_SOURCES,
} from "@/lib/projects-recycle-bin-evidence-copy";
import {
  PROJECTS_RECYCLE_BIN_PAGE_SUBTITLE_BUYER,
  PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_OVERVIEW,
  PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_START_HERE_HELPER,
  PROJECTS_RECYCLE_BIN_SETTINGS_FIRST_VIEWPORT_TEST_ID,
  PROJECTS_RECYCLE_BIN_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID,
  PROJECTS_RECYCLE_BIN_SETTINGS_ORIENTATION_BOTTOM_TEST_ID,
  PROJECTS_RECYCLE_BIN_SETTINGS_PAGE_LEAD,
  PROJECTS_RECYCLE_BIN_SETTINGS_PRIMARY_CONTENT_ID,
  PROJECTS_RECYCLE_BIN_SETTINGS_SKIP_LINK_LABEL,
  PROJECTS_RECYCLE_BIN_SETTINGS_SKIP_TARGET_ID,
  PROJECTS_RECYCLE_BIN_SETTINGS_START_HERE_CARD_TITLE,
  PROJECTS_RECYCLE_BIN_SETTINGS_WORKSPACE_TEST_ID,
} from "@/lib/projects-recycle-bin-settings-page-copy";
import { recycleBinPageDescription } from "@/lib/projects-recycle-bin-payload";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => true,
  useProductionDeskChrome: (): boolean => false,
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  usePathname: () => "/administration/workspace-settings/recycle-bin",
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PAGE_HELP_SHORT_TRIGGER_TEXT: "Help",
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: AUTHORITY_RANK.ExecuteAuthority,
    isAuthorityLoading: false,
  }),
}));

vi.mock("@/components/ProjectsRecycleDraftsPackageVocabularyRail", () => ({
  ProjectsRecycleDraftsPackageVocabularyRail: () => <div data-testid="projects-recycle-vocabulary-rail-stub" />,
}));

import { ProjectsRecycleBinPage } from "./ProjectsRecycleBinPage";

const recycleBinPayload = {
  retentionDays: 30,
  workspaces: [
    {
      workspaceId: "ws-1",
      name: "Production",
      deletedProjects: [
        {
          projectId: "proj-1",
          name: "Contoso Core",
          deletedUtc: "2026-07-01T12:00:00.000Z",
          purgeAfterUtc: "2026-07-31T12:00:00.000Z",
        },
      ],
    },
  ],
};

describe("ProjectsRecycleBinPage buyer-polished shell (STR)", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders skip link, intro, read-only table, sources chrome, and hides mutations", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify(recycleBinPayload), { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    render(<ProjectsRecycleBinPage />);

    expect(screen.getByRole("link", { name: PROJECTS_RECYCLE_BIN_SETTINGS_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${PROJECTS_RECYCLE_BIN_SETTINGS_SKIP_TARGET_ID}`,
    );
    expect(screen.getByText(PROJECTS_RECYCLE_BIN_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.queryByText(recycleBinPageDescription(30))).not.toBeInTheDocument();
    expect(screen.getByTestId("projects-recycle-bin-intro")).toHaveTextContent(PROJECTS_RECYCLE_BIN_SETTINGS_PAGE_LEAD);
    expect(screen.getByTestId("projects-recycle-bin-overview")).toHaveTextContent(PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_OVERVIEW);
    expect(screen.getByTestId(PROJECTS_RECYCLE_BIN_SETTINGS_FIRST_VIEWPORT_TEST_ID)).toContainElement(
      screen.getByTestId("projects-recycle-bin-intro"),
    );
    expect(
      screen.getByTestId(PROJECTS_RECYCLE_BIN_SETTINGS_FIRST_VIEWPORT_TEST_ID),
    ).not.toContainElement(screen.getByTestId("projects-recycle-bin-overview"));
    expect(screen.getByTestId("projects-recycle-bin-buyer-start-here-helper")).toHaveTextContent(
      PROJECTS_RECYCLE_BIN_SETTINGS_BUYER_START_HERE_HELPER,
    );
    expect(
      screen.getByRole("heading", { level: 2, name: PROJECTS_RECYCLE_BIN_SETTINGS_START_HERE_CARD_TITLE }),
    ).toBeInTheDocument();
    expect(screen.getByTestId(PROJECTS_RECYCLE_BIN_SETTINGS_HEADER_CLAIM_DISCIPLINE_TEST_ID)).toHaveTextContent(
      PROJECTS_RECYCLE_BIN_CLAIM_DISCIPLINE.slice(0, 40),
    );
    expect(screen.queryByTestId("page-contextual-help-button")).not.toBeInTheDocument();
    expect(screen.queryByTestId("projects-recycle-vocabulary-rail-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("projects-recycle-bin-restore-residue-honesty")).not.toBeInTheDocument();
    expect(screen.queryByTestId("projects-recycle-bin-audit-note")).not.toBeInTheDocument();
    expect(screen.queryByTestId("projects-recycle-bin-restore")).not.toBeInTheDocument();
    expect(screen.getByTestId("projects-recycle-bin-refresh-button")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: PROJECTS_RECYCLE_BIN_FOLLOW_UPS_TITLE })).toBeInTheDocument();

    await screen.findByTestId("projects-recycle-bin-row-proj-1");

    expect(screen.queryByTestId("projects-recycle-bin-audit-trail-proj-1")).not.toBeInTheDocument();

    const primaryContent = screen.getByTestId(PROJECTS_RECYCLE_BIN_SETTINGS_PRIMARY_CONTENT_ID);
    const firstViewport = screen.getByTestId(PROJECTS_RECYCLE_BIN_SETTINGS_FIRST_VIEWPORT_TEST_ID);
    const overview = screen.getByTestId("projects-recycle-bin-overview");
    const workspace = screen.getByTestId(PROJECTS_RECYCLE_BIN_SETTINGS_WORKSPACE_TEST_ID);
    const orientationBottom = screen.getByTestId(PROJECTS_RECYCLE_BIN_SETTINGS_ORIENTATION_BOTTOM_TEST_ID);
    const sourcesSection = screen.getByTestId("projects-recycle-bin-settings-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(primaryContent).toContainElement(overview);
    expect(primaryContent).toContainElement(workspace);
    expect(primaryContent).toContainElement(orientationBottom);
    expect(workspace).toContainElement(screen.getByTestId("projects-recycle-bin-row-proj-1"));
    expect(orientationBottom).toContainElement(sourcesSection);

    for (const source of filterWhereToGoNextFollowUpLinks(PROJECTS_RECYCLE_BIN_SOURCES)) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }

    expect(firstViewport.compareDocumentPosition(overview) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(overview.compareDocumentPosition(workspace) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(workspace.compareDocumentPosition(orientationBottom) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
