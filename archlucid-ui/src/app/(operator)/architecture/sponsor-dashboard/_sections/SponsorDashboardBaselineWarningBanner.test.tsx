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

vi.mock("@/components/operator/OperatorNavAuthorityProvider", () => ({
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
  SPONSOR_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF,
  SponsorDashboardBaselineWarningBanner,
} from "./SponsorDashboardBaselineWarningBanner";

import { AUTHORITY_RANK } from "@/lib/nav-authority";

const SESSION_STORAGE_KEY = "archlucid-dashboard-baseline-upload-warning-dismissed";

describe("SponsorDashboardBaselineWarningBanner", () => {
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

    render(<SponsorDashboardBaselineWarningBanner />);

    expect(screen.getByTestId("sponsor-baseline-upload-warning-banner")).toBeInTheDocument();

    expect(screen.getByTestId("sponsor-baseline-upload-wizard-link")).toHaveAttribute(
      "href",
      SPONSOR_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF,
    );
  });

  it("omits banner for reader-tier callers even when baseline artifacts are absent", () => {
    navAuth.callerAuthorityRank = AUTHORITY_RANK.ReadAuthority;

    render(<SponsorDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("sponsor-baseline-upload-warning-banner")).toBeNull();
  });

  it("omits banner while workspace artifact load is unresolved", () => {
    workspaceArtifacts.loading = true;

    render(<SponsorDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("sponsor-baseline-upload-warning-banner")).toBeNull();
  });

  it("omits banner while authority rank has not settled (conservative bootstrap)", () => {
    navAuth.isAuthorityLoading = true;

    render(<SponsorDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("sponsor-baseline-upload-warning-banner")).toBeNull();
  });

  it("omits banner when artifact presence is unknown or affirmative", () => {
    workspaceArtifacts.hasBaselineArtifacts = null;

    const { unmount } = render(<SponsorDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("sponsor-baseline-upload-warning-banner")).toBeNull();

    unmount();
    workspaceArtifacts.hasBaselineArtifacts = true;
    render(<SponsorDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("sponsor-baseline-upload-warning-banner")).toBeNull();
  });

  it("stays dismissed for the session via sessionStorage", () => {
    sessionStorage.setItem(SESSION_STORAGE_KEY, "1");

    render(<SponsorDashboardBaselineWarningBanner />);

    expect(screen.queryByTestId("sponsor-baseline-upload-warning-banner")).toBeNull();
  });

  it("dismiss button hides the banner until the session ends", () => {
    render(<SponsorDashboardBaselineWarningBanner />);

    fireEvent.click(screen.getByTestId("sponsor-baseline-upload-warning-dismiss"));

    expect(screen.queryByTestId("sponsor-baseline-upload-warning-banner")).toBeNull();
    expect(sessionStorage.getItem(SESSION_STORAGE_KEY)).toBe("1");
  });

  it("renders setup card variant without alert role", () => {
    render(<SponsorDashboardBaselineWarningBanner variant="setup" />);

    expect(screen.getByTestId("sponsor-baseline-upload-setup-card")).toBeInTheDocument();
    expect(screen.queryByTestId("sponsor-baseline-upload-warning-banner")).toBeNull();
    expect(screen.getByText("Improve ROI estimates")).toBeInTheDocument();
    expect(screen.getByText(/Upload a baseline inventory when you want ROI estimates/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upload baseline inventory" })).toHaveAttribute(
      "href",
      SPONSOR_DASHBOARD_BASELINE_UPLOAD_WIZARD_HREF,
    );
  });
});
