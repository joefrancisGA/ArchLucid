import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InfrastructureAskClient } from "@/app/(operator)/governance/infrastructure/ask/InfrastructureAskClient";
import { submitInfraEvidenceAsk } from "@/lib/infra-evidence/infra-evidence-ask-api";

const mockAskResponse = {
  topicKind: "InventoryChange",
  answer: "Insufficient structured evidence is available in the current scope to answer this question.",
  insufficientEvidence: true,
  citations: [
    {
      kind: "CloudResourceId",
      id: "11111111-1111-1111-1111-111111111111",
      label: "gateway-pip",
    },
  ],
  simulatorLabel: "SIMULATOR — deterministic template grounded on cited structured rows only.",
};

let searchParams = new URLSearchParams("");
const replace = vi.fn();

vi.mock("next/navigation", () => ({
  useSearchParams: () => searchParams,
  usePathname: () => "/governance/infrastructure/ask",
  useRouter: () => ({ replace }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-drift-api", () => ({
  fetchInfraEvidenceSnapshots: vi.fn(async () => ({
    items: [
      {
        snapshotId: "22222222-2222-2222-2222-222222222222",
        subscriptionId: null,
        subscriptionName: null,
        capturedUtc: "2026-09-08T22:44:27Z",
        captureStatus: 1,
        resourceCount: 12,
        relationshipCount: 0,
      },
    ],
    totalCount: 1,
    page: 1,
    pageSize: 50,
    hasMore: false,
  })),
}));

vi.mock("@/hooks/use-infra-evidence-resource-hub-audit-lineage", () => ({
  useInfraEvidenceResourceHubAuditLineage: () => ({
    hub: null,
    loading: false,
    loadError: null,
  }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-ask-api", () => ({
  submitInfraEvidenceAsk: vi.fn(async () => mockAskResponse),
  formatInfraEvidenceAskApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Infrastructure Ask",
      useWhen: "Ask grounded questions",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

describe("InfrastructureAskClient", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("shows insufficient evidence state, simulator banner, and citation link", async () => {
    searchParams = new URLSearchParams("");
    render(<InfrastructureAskClient />);

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "What changed since baseline?" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    expect(await screen.findByTestId("infra-ask-response")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-insufficient-evidence")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-simulator-banner")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-citation-CloudResourceId-11111111-1111-1111-1111-111111111111")).toBeInTheDocument();
  });

  it("links FindingId citations into the remediation factory", async () => {
    vi.mocked(submitInfraEvidenceAsk).mockResolvedValueOnce({
      topicKind: "ResourceOverview",
      answer: "One operational finding is open for this resource.",
      insufficientEvidence: false,
      citations: [
        {
          kind: "FindingId",
          id: "99999999-9999-9999-9999-999999999999",
          label: "Public endpoint",
        },
      ],
      simulatorLabel: null,
    });
    searchParams = new URLSearchParams("cloudResourceId=11111111-1111-1111-1111-111111111111");
    render(<InfrastructureAskClient />);

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "What findings are open?" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    const citation = await screen.findByTestId("infra-ask-citation-FindingId-99999999-9999-9999-9999-999999999999");
    expect(citation.querySelector("a")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&findingId=99999999-9999-9999-9999-999999999999",
    );
  });

  it("passes diffId to Ask API and links ChangeId citations with diff scope", async () => {
    vi.mocked(submitInfraEvidenceAsk).mockResolvedValueOnce({
      topicKind: "InventoryChange",
      answer: "One property changed in this diff.",
      insufficientEvidence: false,
      citations: [
        {
          kind: "ChangeId",
          id: "44444444-4444-4444-4444-444444444444",
          label: "sku change",
        },
      ],
      simulatorLabel: null,
    });
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&diffId=diff-1",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-context-banner")).toHaveTextContent("diff diff-1");

    expect(screen.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByRole("link", { name: "View drift in hub" })).toBeInTheDocument();

    expect(screen.getByTestId("infra-ask-drift-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/drift?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&diffId=diff-1",
    );
    expect(screen.getByTestId("infra-ask-inventory-diagrams-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagrams?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111",
    );

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "What changed in this diff?" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    await waitFor(() => {
      expect(vi.mocked(submitInfraEvidenceAsk)).toHaveBeenCalledWith(
        expect.objectContaining({
          diffId: "diff-1",
          snapshotId: "22222222-2222-2222-2222-222222222222",
          cloudResourceId: "11111111-1111-1111-1111-111111111111",
        }),
      );
    });

    const citation = await screen.findByTestId("infra-ask-citation-ChangeId-44444444-4444-4444-4444-444444444444");
    expect(citation.querySelector("a")).toHaveAttribute(
      "href",
      "/governance/infrastructure/drift?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&changeId=44444444-4444-4444-4444-444444444444&diffId=diff-1",
    );
  });

  it("shows finding scope in context banner and links hub findings tab", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&findingId=finding-1",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-context-banner")).toHaveTextContent("finding finding-1");
    expect(screen.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByRole("link", { name: "View findings in hub" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-open-overview-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-ask-remediation-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&findingId=finding-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("shows instance scope in context banner and links hub remediation tab", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&instanceId=instance-1",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-context-banner")).toHaveTextContent("instance instance-1");
    expect(screen.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=remediation&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByRole("link", { name: "View remediation in hub" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-remediation-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&instanceId=instance-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("shows audit control scope in context banner and links hub audit tab", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-context-banner")).toHaveTextContent(
      "control cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    expect(screen.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=audit&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    expect(screen.getByRole("link", { name: "View audit lineage in hub" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-audit-lineage-back-link")).toHaveAttribute(
      "href",
      "/governance/audit-evidence/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/snapshots/bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb/controls/cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("prefers drift hub tab when diff and audit scope are both present", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&diffId=diff-1&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    expect(screen.getByTestId("infra-ask-open-audit-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=audit&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("prefers drift hub tab from workbench origin when audit scope is also present", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&tab=drift&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=drift&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    expect(screen.getByTestId("infra-ask-open-audit-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=audit&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("shows correspondence scope in context banner and links hub diagram tab", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&runId=run-1&correspondenceId=corr-1",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-context-banner")).toHaveTextContent("correspondence corr-1");
    expect(screen.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=diagram&runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByRole("link", { name: "View diagram correspondence in hub" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-diagram-reconcile-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagram-reconcile?runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&correspondenceId=corr-1",
    );
    expect(screen.getByTestId("infra-ask-remediation-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&correspondenceId=corr-1&runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("preserves diagram reconcile handoff context on finding remediation back link", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&runId=run-1&correspondenceId=corr-1&findingId=finding-1",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-remediation-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/remediation?cloudResourceId=11111111-1111-1111-1111-111111111111&findingId=finding-1&correspondenceId=corr-1&runId=run-1&snapshotId=22222222-2222-2222-2222-222222222222",
    );
  });

  it("shows explorer work queue in context banner and links back to filtered explorer", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&workQueue=open-findings",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-context-banner")).toHaveTextContent("explorer Open findings");
    expect(screen.getByTestId("infra-ask-open-work-queue-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&workQueue=open-findings",
    );
    expect(screen.getByRole("link", { name: "View findings in hub" })).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-open-overview-hub")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?workQueue=open-findings",
    );
    expect(screen.getByTestId("infra-ask-explorer-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources?workQueue=open-findings",
    );
  });

  it("prefers ask scope over explorer work queue for hub back-link label", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&findingId=finding-1&workQueue=open-remediation",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=findings&snapshotId=22222222-2222-2222-2222-222222222222&workQueue=open-remediation",
    );
    expect(screen.getByRole("link", { name: "View findings in hub" })).toBeInTheDocument();
    expect(screen.queryByTestId("infra-ask-open-work-queue-hub-tab")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View remediation in hub" })).not.toBeInTheDocument();
  });

  it("preserves diagram neighborhood seed in inventory diagrams back link", async () => {
    const armId = "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway";
    searchParams = new URLSearchParams(
      `cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&seedNodeId=${encodeURIComponent(armId)}`,
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-inventory-diagrams-back-link")).toHaveAttribute(
      "href",
      `/governance/infrastructure/diagrams?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&mermaidMode=dependencyNeighborhood&seedNodeId=${encodeURIComponent(armId)}`,
    );
  });

  it("shows terraform workbench back link when opened from hub terraform tab", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222&tab=terraform&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-terraform-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/terraform?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    expect(screen.getByTestId("infra-ask-open-scope-hub-tab")).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?tab=terraform&snapshotId=22222222-2222-2222-2222-222222222222&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("shows context banner and keeps multi-turn history", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    vi.mocked(submitInfraEvidenceAsk).mockClear();

    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-context-banner")).toHaveTextContent(
      "resource 11111111-1111-1111-1111-111111111111",
    );
    expect(screen.getByRole("link", { name: "Open resource evidence hub" })).toHaveAttribute(
      "href",
      "/governance/infrastructure/resources/11111111-1111-1111-1111-111111111111?snapshotId=22222222-2222-2222-2222-222222222222",
    );
    expect(screen.queryByTestId("infra-ask-open-overview-hub")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-inventory-diagrams-back-link")).toHaveAttribute(
      "href",
      "/governance/infrastructure/diagrams?snapshotId=22222222-2222-2222-2222-222222222222&cloudResourceId=11111111-1111-1111-1111-111111111111",
    );

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "First question" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));
    await waitFor(() => {
      expect(vi.mocked(submitInfraEvidenceAsk)).toHaveBeenCalledTimes(1);
    });

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "Second question" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    await waitFor(() => {
      expect(screen.getAllByText(/Question:/)).toHaveLength(2);
    });
    expect(vi.mocked(submitInfraEvidenceAsk)).toHaveBeenCalledTimes(2);
  });

  it("inserts canned prompts into the draft without auto-submitting", async () => {
    searchParams = new URLSearchParams("");
    render(<InfrastructureAskClient />);

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "Partial draft" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-canned-What changed since baseline?"));

    expect(screen.getByTestId("infra-ask-question")).toHaveValue("Partial draft What changed since baseline?");
    expect(vi.mocked(submitInfraEvidenceAsk)).not.toHaveBeenCalled();
  });

  it("submits on Ctrl+Enter and shows shortcut affordance", async () => {
    searchParams = new URLSearchParams("");
    render(<InfrastructureAskClient />);

    expect(screen.getByText("Ctrl+Enter")).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "Keyboard submit?" },
    });
    fireEvent.keyDown(screen.getByTestId("infra-ask-question"), {
      key: "Enter",
      ctrlKey: true,
    });

    expect(await screen.findByTestId("infra-ask-response")).toBeInTheDocument();
  });

  it("shows simulator provenance after response and snapshot freshness in scoped context", async () => {
    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    render(<InfrastructureAskClient />);

    expect(screen.getByTestId("infra-ask-snapshot-freshness")).toHaveTextContent(
      "Snapshot 22222222-2222-2222-2222-222222222222",
    );
    expect(screen.getByTestId("infra-ask-context-banner")).toHaveTextContent("captured");

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "Why is this PIP public?" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    expect(await screen.findByTestId("infra-ask-simulator-status-header")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-simulator-banner")).toBeInTheDocument();
  });

  it("renders blocked ask errors as a semantic callout", async () => {
    vi.mocked(submitInfraEvidenceAsk).mockRejectedValueOnce(new Error("Ask blocked for test"));
    searchParams = new URLSearchParams("");
    render(<InfrastructureAskClient />);

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "Blocked question" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    const errorPanel = await screen.findByTestId("infra-ask-submit-error");
    expect(errorPanel).toHaveAttribute("role", "alert");
    expect(errorPanel).toHaveTextContent("Ask blocked");
  });

  it("maps topic kind to plain labels in responses", async () => {
    vi.mocked(submitInfraEvidenceAsk).mockResolvedValueOnce({
      topicKind: "ResourceOverview",
      answer: "One operational finding is open for this resource.",
      insufficientEvidence: false,
      citations: [],
      simulatorLabel: null,
    });
    searchParams = new URLSearchParams("");
    render(<InfrastructureAskClient />);

    fireEvent.change(screen.getByTestId("infra-ask-question"), {
      target: { value: "What findings are open?" },
    });
    fireEvent.click(screen.getByTestId("infra-ask-submit"));

    expect(await screen.findByText("Topic: Resource overview")).toBeInTheDocument();
    expect(screen.queryByText("ResourceOverview")).not.toBeInTheDocument();
  });

  it("rehydrates transcript and draft from sessionStorage per scope", async () => {
    const scopeKey = "11111111-1111-1111-1111-111111111111|22222222-2222-2222-2222-222222222222|_|_|_|_|_|_|_|_|_|all|_";
    window.sessionStorage.setItem(
      `archlucid.infra-evidence.ask-transcript.unknown.anonymous.${scopeKey}`,
      JSON.stringify({
        turns: [
          {
            question: "Persisted question",
            response: {
              topicKind: "ResourceOverview",
              answer: "Persisted answer",
              insufficientEvidence: false,
              citations: [],
              simulatorLabel: null,
            },
          },
        ],
        draft: "Saved draft",
      }),
    );

    searchParams = new URLSearchParams(
      "cloudResourceId=11111111-1111-1111-1111-111111111111&snapshotId=22222222-2222-2222-2222-222222222222",
    );
    render(<InfrastructureAskClient />);

    expect(await screen.findByText("Question: Persisted question")).toBeInTheDocument();
    expect(screen.getByTestId("infra-ask-question")).toHaveValue("Saved draft");
  });
});
