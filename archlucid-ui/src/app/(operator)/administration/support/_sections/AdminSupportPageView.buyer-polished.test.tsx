import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SUPPORT_WORKSPACE_CLAIM_DISCIPLINE_HEADING,
  SUPPORT_WORKSPACE_FOLLOW_UPS_TITLE,
} from "@/lib/support-workspace-evidence-copy";

import { AdminSupportPageView } from "./AdminSupportPageView";
import {
  ADMIN_SUPPORT_PAGE_SUBTITLE_BUYER,
  ADMIN_SUPPORT_PRIMARY_CONTENT_ID,
  ADMIN_SUPPORT_SKIP_LINK_LABEL,
} from "./admin-support-page-copy";
import type { UseAdminSupportPageModel } from "./use-admin-support-page";

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();

  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: (): boolean => true,
  };
});

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

describe("AdminSupportPageView buyer-polished shell", () => {
  it("renders skip link, breadcrumb, orientation above sections, and hides vocabulary rail", () => {
    render(<AdminSupportPageView model={model()} />);

    expect(screen.getByRole("link", { name: ADMIN_SUPPORT_SKIP_LINK_LABEL })).toHaveAttribute(
      "href",
      `#${ADMIN_SUPPORT_PRIMARY_CONTENT_ID}`,
    );
    expect(screen.getByTestId("admin-support-breadcrumb")).toBeInTheDocument();
    expect(screen.getByText(ADMIN_SUPPORT_PAGE_SUBTITLE_BUYER)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: SUPPORT_WORKSPACE_CLAIM_DISCIPLINE_HEADING }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: SUPPORT_WORKSPACE_FOLLOW_UPS_TITLE })).toBeInTheDocument();
    expect(screen.queryByTestId("report-problem-support-workspace-vocabulary")).toBeNull();
    expect(screen.queryByTestId("admin-support-guidance")).toBeNull();

    const orientation = screen.getByTestId("admin-support-orientation-top");
    const reportProblem = screen.getByTestId("admin-support-report-problem");

    expect(screen.getByTestId("admin-support-primary-content")).toContainElement(orientation);
    expect(orientation.compareDocumentPosition(reportProblem) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });
});
