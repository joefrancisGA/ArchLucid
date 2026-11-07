import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { filterOrientationSourcesForJobContext } from "@/lib/evidence-orientation/job-context-orientation-sources-filter";
import { filterWhereToGoNextFollowUpLinks } from "@/lib/evidence-orientation/where-to-go-next-follow-up-links";
import { formatHelpFollowUpLinkAccessibleName } from "@/lib/help/help-follow-up-link-label";
import {
  SUPPORT_WORKSPACE_FOLLOW_UPS_TITLE,
  SUPPORT_WORKSPACE_SOURCES,
} from "@/lib/support-workspace-evidence-copy";
import { SETTINGS_SUPPORT_PATH } from "@/lib/settings-admin-route-paths";

import { AdminSupportPageView } from "./AdminSupportPageView";
import {
  ADMIN_SUPPORT_FIRST_VIEWPORT_TEST_ID,
  ADMIN_SUPPORT_PAGE_SUBTITLE_BUYER,
  ADMIN_SUPPORT_PRIMARY_CONTENT_ID,
  ADMIN_SUPPORT_SKIP_LINK_LABEL,
  ADMIN_SUPPORT_SKIP_TARGET_ID,
} from "./admin-support-page-copy";
import type { UseAdminSupportPageModel } from "./use-admin-support-page";

vi.mock("next/navigation", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/navigation")>();

  return {
    ...actual,
    usePathname: () => SETTINGS_SUPPORT_PATH,
  };
});

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

vi.mock("@/components/ReportProblemSupportWorkspaceVocabularyRail", () => ({
  ReportProblemSupportWorkspaceVocabularyRail: () => (
    <div data-testid="report-problem-support-workspace-vocabulary" />
  ),
}));

function model(overrides: Partial<UseAdminSupportPageModel> = {}): UseAdminSupportPageModel {
  return {
    downloading: false,
    bundleStatus: "idle",
    error: null,
    lastGeneratedAt: null,
    isDemo: false,
    canGenerateBundle: true,
    showInternalDiagnostics: false,
    workspaceLabel: "Pilot workspace",
    onDownload: async () => undefined,
    ...overrides,
  };
}

describe("AdminSupportPageView buyer-polished shell (ASX)", () => {
  it("renders skip link, first-viewport band, orientation above sections, and Sources links", () => {
    render(<AdminSupportPageView model={model()} />);

    expect(screen.getByRole("link", { name: ADMIN_SUPPORT_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ADMIN_SUPPORT_SKIP_TARGET_ID}`,
    );
    expect(screen.getByTestId("admin-support-primary-content")).toHaveAttribute(
      "id",
      ADMIN_SUPPORT_PRIMARY_CONTENT_ID,
    );
    expect(screen.getByTestId("support-workspace-claim-discipline")).toBeInTheDocument();
    expect(screen.getByText(ADMIN_SUPPORT_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SUPPORT_WORKSPACE_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("report-problem-support-workspace-vocabulary")).toBeNull();
    expect(screen.queryByTestId("admin-support-guidance")).toBeNull();

    const primaryContent = screen.getByTestId("admin-support-primary-content");
    const firstViewport = screen.getByTestId(ADMIN_SUPPORT_FIRST_VIEWPORT_TEST_ID);
    const orientationTop = screen.getByTestId("admin-support-orientation-top");
    const reportProblem = screen.getByTestId("admin-support-report-problem");
    const sourcesSection = screen.getByTestId("support-workspace-sources");

    expect(primaryContent).toContainElement(firstViewport);
    expect(firstViewport).toContainElement(orientationTop);
    expect(firstViewport).toContainElement(reportProblem);
    expect(orientationTop).toContainElement(sourcesSection);
    expect(orientationTop.compareDocumentPosition(reportProblem) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const visibleSources = filterOrientationSourcesForJobContext(
      filterWhereToGoNextFollowUpLinks(SUPPORT_WORKSPACE_SOURCES),
      SETTINGS_SUPPORT_PATH,
    );
    for (const source of visibleSources) {
      const accessibleName = formatHelpFollowUpLinkAccessibleName(source.href, source.label);
      expect(within(sourcesSection).getByRole("link", { name: accessibleName })).toHaveAttribute("href", source.href);
    }
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


