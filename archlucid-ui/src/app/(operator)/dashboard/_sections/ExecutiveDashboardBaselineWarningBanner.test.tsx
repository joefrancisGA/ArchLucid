import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navAuth = vi.hoisted(() => ({
  /** Numeric Execute rank — `vi.hoisted` precedes `@/lib/nav-authority`; keep literal parity with `AUTHORITY_RANK`. */

  callerAuthorityRank: 2,
  isAuthorityLoading: false,
}));

const workspaceArtifacts = vi.hoisted(() => ({
  loading: false,
  hasBaselineArtifacts: false as boolean | null,
  reload: vi.fn(),
}));

vi.mock("@/components/OperatorNavAuthorityProvider", () => ({
  useOperatorNavAuthority: () => ({
    callerAuthorityRank: navAuth.callerAuthorityRank,
    isAuthorityLoading: navAuth.isAuthorityLoading,
    currentPrincipal: {},
  }),
}));

vi.mock("@/hooks/use-workspace-baseline-artifacts", () => ({
  useWorkspaceBaselineArtifactsPresence: () => ({
    loading: workspaceArtifacts.loading,
    hasBaselineArtifacts: workspaceArtifacts.hasBaselineArtifacts,
    reload: workspaceArtifacts.reload,
  }),
}));

import {
  EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF,
  ExecutiveDashboardBaselineWarningBanner,
} from "./ExecutiveDashboardBaselineWarningBanner";

import { AUTHORITY_RANK } from "@/lib/nav-authority";

const SESSION_STORAGE_KEY = "archlucid-dashboard-baseline-upload-warning-dismissed";

describe("ExecutiveDashboardBaselineWarningBanner", () => {
  beforeEach(() => {
    sessionStorage.clear();
    navAuth.callerAuthorityRank = AUTHORITY_RANK.ExecuteAuthority;
    navAuth.isAuthorityLoading = false;
    workspaceArtifacts.loading = false;
    workspaceArtifacts.hasBaselineArtifacts = false;
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("renders for Execute-tier callers when workspace baseline artifacts are absent", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.AdminAuthority;

    render(<ExecutiveDashboardBaselineWarningBanner />);

    expect(screen.getByTestId("executive-baseline-upload-warning-banner")).toBeInTheDocument();

    expect(screen.getByTestId("executive-baseline-upload-wizard-link")).toHaveAttribute(
      "href",
      EXECUTIVE_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF,
    );
  });

  it("omits banner for reader-tier callers even when baseline artifacts are absent", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.ReadAuthority;

    render(<ExecutiveDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("executive-baseline-upload-warning-banner")).toBeNull();
  });

  it("omits banner while workspace artifact load is unresolved", () => {
    workspaceArtifacts.loading = true;

    render(<ExecutiveDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("executive-baseline-upload-warning-banner")).toBeNull();
  });

  it("omits banner while authority rank has not settled (conservative bootstrap)", () => {
    navAuth.isAuthorityLoading = true;

    render(<ExecutiveDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("executive-baseline-upload-warning-banner")).toBeNull();
  });

  it("omits banner when artifact presence is unknown or affirmative", () => {
    workspaceArtifacts.hasBaselineArtifacts = null;

    const { unmount } = render(<ExecutiveDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("executive-baseline-upload-warning-banner")).toBeNull();

    unmount();
    workspaceArtifacts.hasBaselineArtifacts = true;
    render(<ExecutiveDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("executive-baseline-upload-warning-banner")).toBeNull();
  });

  it("stays dismissed for the session via sessionStorage", () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "1");

    render(<ExecutiveDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("executive-baseline-upload-warning-banner")).toBeNull();
  });

  it("dismiss button hides the banner until the session ends", () => {
    render(<ExecutiveDashboardBaselineWarningBanner />);

    fireEvent.click(screen.getByTestId("executive-baseline-upload-warning-dismiss"));

    expect(screen.queryByTestId("executive-baseline-upload-warning-banner")).toBeNull();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe("1");
  });
});
