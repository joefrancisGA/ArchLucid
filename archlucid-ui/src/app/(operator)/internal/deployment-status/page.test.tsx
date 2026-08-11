import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const hoistedLoad = vi.hoisted(() => ({ demo: false }));

vi.mock("./_sections/load-admin-deployment-status-page-data", () => ({
  loadAdminDeploymentStatusPageData: () => Promise.resolve(hoistedLoad),
}));

vi.mock("@/lib/deployment-fingerprint", () => ({
  readClientDeploymentFingerprint: () => ({
    frontendCommitSha: "frontendsha",
    buildTimestamp: "2026-07-17T00:00:00Z",
    deployStamp: "1842212345-1",
    environment: "test",
    apiUpstreamHost: "api.test",
  }),
}));

vi.mock("@/components/usability/PageContextualHelpButton", () => ({
  PageContextualHelpButton: () => <div data-testid="page-contextual-help-button" />,
}));

import { INTERNAL_OPERATIONS_NAV_EYEBROW } from "@/lib/demo-readiness-evidence-copy";

import AdminDeploymentStatusPage from "./page";

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json" } });
}

describe("AdminDeploymentStatusPage", () => {
  it("renders identity fields and match agreement from the admin API", async () => {
    const fetchMock = vi.fn(async (url: string | URL) => {
      const s = String(url);
      expect(s).toContain("/api/proxy/v1/internal/deployment-status");
      expect(s).toContain("frontendBuildId=frontendsha");

      return jsonResponse({
        environment: "Production",
        releaseBuildId: "frontendsha",
        sourceCommit: "frontendsha",
        frontendBuildId: "frontendsha",
        apiBuildId: "frontendsha",
        workerBuildId: "frontendsha",
        deploymentTimeUtc: "2026-07-17T12:00:00Z",
        activePlatformRevision: "api--rev1",
        healthStatus: "Healthy",
        readinessStatus: "Healthy",
        databaseMigrationVersion: "284_SelfServiceTrialAbuse.sql",
        latestSmokeTestResult: "Unknown",
        lastKnownGoodBuildId: "Unknown",
        componentAgreement: "Match",
        componentAgreementDetail: "Frontend, API, and worker BUILD_IDs match.",
        overallStatus: "Healthy",
        overallStatusLabel: "Healthy — components agree and readiness is Healthy.",
        links: [{ kind: "runbook", label: "Release runbook", url: "https://example.com/runbook" }],
        generatedAtUtc: "2026-07-17T12:01:00Z",
      });
    });
    vi.stubGlobal("fetch", fetchMock);

    const page = await AdminDeploymentStatusPage();
    render(page);

    expect(await screen.findByTestId("admin-deployment-status-page")).toBeInTheDocument();
    expect(screen.getByTestId("admin-deployment-status-ops-eyebrow")).toHaveTextContent(
      INTERNAL_OPERATIONS_NAV_EYEBROW,
    );
    expect(screen.getByTestId("admin-deployment-status-refresh")).toHaveTextContent("Refresh");
    expect(screen.getByTestId("admin-deployment-status-page-lead").textContent).not.toMatch(/BUILD_ID/i);
    expect(screen.getByTestId("admin-deployment-status-overall-tag")).toHaveTextContent("Healthy");
    expect(screen.getByTestId("admin-deployment-status-overall-tag")).toHaveAccessibleName(
      "Overall status: Healthy — components agree and readiness is Healthy.",
    );
    expect(screen.getByTestId("ds-api-build-id").textContent).toContain("frontendsha");
    const externalLink = screen.getByTestId("ds-external-link-runbook");
    expect(externalLink).toHaveAttribute("href", "https://example.com/runbook");
    expect(externalLink).toHaveAttribute("target", "_blank");
    expect(externalLink).toHaveAccessibleName(/Release runbook.*opens in new tab/i);
    expect(screen.getByTestId("ds-component-agreement").textContent).toMatch(/Match/i);
    expect(screen.getByTestId("admin-deployment-status-overall").textContent).toMatch(/Healthy/i);

    fireEvent.click(screen.getByTestId("admin-deployment-status-refresh"));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(2));

    vi.unstubAllGlobals();
  });

  it("shows an actionable empty state when the API returns no payload (TB-1424)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse(null)),
    );

    const page = await AdminDeploymentStatusPage();
    render(page);

    expect(await screen.findByTestId("admin-deployment-status-empty")).toBeInTheDocument();
    expect(screen.getByTestId("admin-deployment-status-empty-refresh")).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it("shows Failed label when components disagree", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        jsonResponse({
          environment: "Production",
          releaseBuildId: "aaa",
          sourceCommit: "aaa",
          frontendBuildId: "bbb",
          apiBuildId: "aaa",
          workerBuildId: "Unknown",
          deploymentTimeUtc: "Unknown",
          activePlatformRevision: "Unknown",
          healthStatus: "Healthy",
          readinessStatus: "Healthy",
          databaseMigrationVersion: "Unknown",
          latestSmokeTestResult: "Unknown",
          lastKnownGoodBuildId: "Unknown",
          componentAgreement: "Mismatch",
          componentAgreementDetail: "Component BUILD_IDs disagree.",
          overallStatus: "Failed",
          overallStatusLabel: "Failed — Component BUILD_IDs disagree.",
          links: [],
          generatedAtUtc: "2026-07-17T12:01:00Z",
        }),
      ),
    );

    const page = await AdminDeploymentStatusPage();
    render(page);

    const overall = await screen.findByTestId("admin-deployment-status-overall");
    expect(overall.textContent).toMatch(/Failed/i);
    expect(screen.getByTestId("admin-deployment-status-overall-tag")).toHaveTextContent("Failed");
    expect(screen.getByTestId("admin-deployment-status-overall-tag")).toHaveAccessibleName(
      "Overall status: Failed — Component BUILD_IDs disagree.",
    );
    expect(screen.getByTestId("ds-component-agreement").textContent).toMatch(/Mismatch/i);

    vi.unstubAllGlobals();
  });

  it("surfaces authorization failure instead of inventing status data", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("forbidden", { status: 403 })),
    );

    const page = await AdminDeploymentStatusPage();
    render(page);

    expect(await screen.findByRole("alert")).toHaveTextContent(/administrator access/i);
    expect(screen.queryByTestId("ds-api-build-id")).not.toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
