import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RemediationWorkbenchClient } from "@/app/(operator)/governance/infrastructure/remediation/RemediationWorkbenchClient";
import { fetchRemediationInstances } from "@/lib/infra-evidence/infra-evidence-remediation-api";

let searchParams = new URLSearchParams("");

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({
    items: [
      {
        snapshotId: "11111111-1111-1111-1111-111111111111",
        subscriptionId: "sub-1",
        subscriptionName: "Prod",
        capturedUtc: "2026-09-01T12:00:00Z",
        captureStatus: 1,
        resourceCount: 12,
        relationshipCount: 4,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 20,
    hasMore: false,
  })),
  formatInfraEvidenceApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  fetchRemediationInstances: vi.fn(async () => [
    {
      instanceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      findingId: "22222222-2222-2222-2222-222222222222",
      patternKey: "storage.encrypt-at-rest",
      status: "PreflightBlocked",
      automationLevel: "Guided",
      cloudResourceId: "33333333-3333-3333-3333-333333333333",
      waveId: null,
      createdUtc: "2026-09-01T12:00:00Z",
      updatedUtc: "2026-09-01T12:00:00Z",
    },
  ]),
  fetchRemediationFactorySummary: vi.fn(async () => ({
    factoryMetrics: {
      openFindings: 4,
      remediatedThisWeek: 1,
      verificationFailureCount: 0,
      businessBlockedCount: 1,
    },
    openInstancesByStatus: { PreflightBlocked: 1 },
    waves: [{ waveId: "wave-1", name: "Wave A", status: "Active", memberCount: 2, targetSize: 5 }],
  })),
  fetchRemediationPrioritizedFindings: vi.fn(async () => []),
  fetchRemediationWaves: vi.fn(async () => [{ waveId: "wave-1", name: "Wave A" }]),
  fetchRemediationInstanceDetail: vi.fn(async () => ({
    instance: {
      instanceId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      findingId: "22222222-2222-2222-2222-222222222222",
      patternKey: "storage.encrypt-at-rest",
      status: "PreflightBlocked",
      automationLevel: "Guided",
      cloudResourceId: "33333333-3333-3333-3333-333333333333",
      waveId: null,
      createdUtc: "2026-09-01T12:00:00Z",
      updatedUtc: "2026-09-01T12:00:00Z",
    },
    finding: {
      findingId: "22222222-2222-2222-2222-222222222222",
      title: "Public storage endpoint",
      severity: "High",
      status: "Open",
      cloudResourceId: "33333333-3333-3333-3333-333333333333",
      controlId: "SC-28",
    },
    activeMatch: {
      matchResultId: "match-1",
      patternKey: "storage.encrypt-at-rest",
      patternVersion: "1.0.0",
      matchKind: "ExactMatch",
      explainText: "Control metadata matched approved pattern.",
    },
    evidence: [],
  })),
  matchOperationalFinding: vi.fn(),
  createRemediationInstance: vi.fn(),
  runRemediationPreflight: vi.fn(),
  approveRemediationInstance: vi.fn(),
  assignRemediationWave: vi.fn(),
  executeRemediationInstance: vi.fn(),
  verifyRemediationInstance: vi.fn(),
  closeRemediationInstance: vi.fn(),
  formatInfraEvidenceRemediationApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Remediation factory",
      useWhen: "Track instances",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

describe("RemediationWorkbenchClient", () => {
  it("renders lifecycle board and disables approve when preflight blocked", async () => {
    searchParams = new URLSearchParams("");
    render(<RemediationWorkbenchClient />);

    expect(await screen.findByTestId("infra-remediation-board")).toBeInTheDocument();
    expect(screen.getByTestId("infra-remediation-column-preflight")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("infra-remediation-card-aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"));

    expect(await screen.findByTestId("infra-remediation-detail")).toBeInTheDocument();
    expect(screen.getByTestId("infra-remediation-execute-disclaimer")).toBeInTheDocument();
    expect(screen.getByTestId("infra-remediation-approve")).toBeDisabled();
    expect(screen.getByTestId("infra-remediation-preflight")).toBeDisabled();
  });

  it("shows resource scope banner when cloudResourceId is in the URL", async () => {
    searchParams = new URLSearchParams("cloudResourceId=33333333-3333-3333-3333-333333333333");
    render(<RemediationWorkbenchClient />);

    expect(await screen.findByTestId("infra-remediation-resource-scope-banner")).toHaveTextContent(
      "33333333-3333-3333-3333-333333333333",
    );
    expect(screen.getByTestId("infra-remediation-open-findings-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/33333333-3333-3333-3333-333333333333?tab=findings",
    );
    expect(screen.getByTestId("infra-remediation-open-terraform-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/33333333-3333-3333-3333-333333333333?tab=terraform",
    );
    expect(vi.mocked(fetchRemediationInstances)).toHaveBeenCalledWith({
      cloudResourceId: "33333333-3333-3333-3333-333333333333",
      findingId: null,
    });
  });

  it("selects the matching instance when findingId is deep-linked", async () => {
    searchParams = new URLSearchParams("findingId=22222222-2222-2222-2222-222222222222");
    render(<RemediationWorkbenchClient />);

    expect(await screen.findByTestId("infra-remediation-finding-scope-banner")).toHaveTextContent(
      "22222222-2222-2222-2222-222222222222",
    );
    await waitFor(() => {
      expect(fetchRemediationInstances).toHaveBeenCalledWith({
        cloudResourceId: null,
        findingId: "22222222-2222-2222-2222-222222222222",
      });
    });
    expect(await screen.findByTestId("infra-remediation-detail")).toBeInTheDocument();
    expect(screen.getByTestId("infra-remediation-finding-id")).toHaveValue("22222222-2222-2222-2222-222222222222");
  });

  it("passes combined cloudResourceId and findingId filters from the URL", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=33333333-3333-3333-3333-333333333333&findingId=22222222-2222-2222-2222-222222222222&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    render(<RemediationWorkbenchClient />);

    await waitFor(() => {
      expect(fetchRemediationInstances).toHaveBeenCalledWith({
        cloudResourceId: "33333333-3333-3333-3333-333333333333",
        findingId: "22222222-2222-2222-2222-222222222222",
      });
    });
    expect(screen.getByTestId("infra-remediation-finding-open-findings-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/33333333-3333-3333-3333-333333333333?tab=findings&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-remediation-finding-open-terraform-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/33333333-3333-3333-3333-333333333333?tab=terraform&snapshotId=11111111-1111-1111-1111-111111111111",
    );
  });

  it("shows create guidance when findingId has no remediation instance yet", async () => {
    vi.mocked(fetchRemediationInstances).mockResolvedValueOnce([]);
    searchParams = new URLSearchParams("findingId=99999999-9999-9999-9999-999999999999");
    render(<RemediationWorkbenchClient />);

    expect(await screen.findByTestId("infra-remediation-finding-scope-banner")).toHaveTextContent(
      "No remediation instance exists yet",
    );
  });

  it("links back to diagram reconcile with full conflict handoff context", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=33333333-3333-3333-3333-333333333333&findingId=22222222-2222-2222-2222-222222222222&correspondenceId=corr-1&runId=run-1&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    render(<RemediationWorkbenchClient />);

    expect(await screen.findByRole("link", { name: /originating conflict row/i })).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=11111111-1111-1111-1111-111111111111&cloudResourceId=33333333-3333-3333-3333-333333333333&reconcileFilter=Conflict&correspondenceId=corr-1",
    );
    expect(screen.getByTestId("infra-remediation-open-diagram-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/33333333-3333-3333-3333-333333333333?tab=diagram&runId=run-1&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByTestId("infra-remediation-open-terraform-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/33333333-3333-3333-3333-333333333333?tab=terraform&snapshotId=11111111-1111-1111-1111-111111111111",
    );
    await waitFor(() => {
      expect(screen.getByTestId("infra-remediation-open-ask")).toHaveAttribute(
        "href",
        "/governance/infrastructure/ask?cloudResourceId=33333333-3333-3333-3333-333333333333&snapshotId=11111111-1111-1111-1111-111111111111&findingId=22222222-2222-2222-2222-222222222222&instanceId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee&correspondenceId=corr-1&runId=run-1",
      );
    });
  });

  it("links Ask with resource scope when cloudResourceId is in the URL", async () => {
    searchParams = new URLSearchParams("cloudResourceId=33333333-3333-3333-3333-333333333333");
    render(<RemediationWorkbenchClient />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-remediation-open-ask")).toHaveAttribute(
        "href",
        "/governance/infrastructure/ask?cloudResourceId=33333333-3333-3333-3333-333333333333&instanceId=aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      );
    });
  });
});
