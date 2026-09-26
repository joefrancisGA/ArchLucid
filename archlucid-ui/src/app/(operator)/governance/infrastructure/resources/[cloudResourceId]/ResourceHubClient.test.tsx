import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { ResourceHubClient } from "./ResourceHubClient";
import {
  buildResourceHubTestMockHub,
  RESOURCE_HUB_TEST_AUDIT_SUFFIX,
  RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
  RESOURCE_HUB_TEST_SNAPSHOT_ID,
} from "./resource-hub-test-mock-hub";

const replace = vi.fn();
let searchParams = new URLSearchParams(`tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);

const fetchCachedInfraEvidenceResourceHub = vi.fn(async () => buildResourceHubTestMockHub());
const matchOperationalFinding = vi.fn(async () => undefined);
const createRemediationInstance = vi.fn(async () => ({
  succeeded: true,
  instanceId: "new-instance-1",
  blockers: [] as string[],
  errorMessage: null as string | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push: vi.fn() }),
  usePathname: () => `/governance/infrastructure/resources/${RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID}`,
  useSearchParams: () => searchParams,
}));

vi.mock("@/hooks/useProductionDeskChrome", () => ({
  useProductionEvalChrome: (): boolean => false,
  useProductionDeskChrome: (): boolean => true,
}));

vi.mock("@/components/product-line/ProductLineProvider", () => ({
  useProductLine: () => ({ productLine: "archlucid" }),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-resource-hub-cache", () => ({
  fetchCachedInfraEvidenceResourceHub: (...args: unknown[]) => fetchCachedInfraEvidenceResourceHub(...args),
  invalidateInfraEvidenceResourceHubCacheForResource: vi.fn(),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-remediation-api", () => ({
  matchOperationalFinding: (...args: unknown[]) => matchOperationalFinding(...args),
  createRemediationInstance: (...args: unknown[]) => createRemediationInstance(...args),
  formatInfraEvidenceRemediationApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/infra-evidence/infra-evidence-hub-api", () => ({
  formatInfraEvidenceHubApiError: (error: unknown) => String(error),
}));

vi.mock("@/lib/use-nav-surface", () => ({
  useNavSurface: () => ({
    layerGuidance: {
      layerBadge: "Advanced operations",
      headline: "Resource hub",
      useWhen: "Inspect evidence",
      firstPilotNote: null,
    },
    contextHints: { layerHeaderEnterpriseRankCue: null },
  }),
}));

describe("ResourceHubClient", () => {
  beforeEach(() => {
    replace.mockClear();
    matchOperationalFinding.mockClear();
    createRemediationInstance.mockClear();
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () => buildResourceHubTestMockHub());
    searchParams = new URLSearchParams(`tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
  });

  it("renders cross-workbench overview links without hub tab switchers", async () => {
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-open-remediation-work")).toHaveAttribute(
      "href",
      `/governance/infrastructure/remediation?cloudResourceId=${RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID}&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
    expect(screen.getByTestId("infra-resource-hub-open-drift-work")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-open-diagrams-work")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-open-findings-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-open-drift-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-open-terraform-work")).not.toBeInTheDocument();
  });

  it("shows snapshot scope strip with pinned label when snapshotId is in the URL", async () => {
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-snapshot-scope-strip")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-snapshot-id")).toHaveTextContent("22222222");
  });

  it("shows paginated finding stream caption when hasMore", async () => {
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-findings-stream-more-OperationalSecurity")).toHaveTextContent(
      "Showing 1 of 40",
    );
  });

  it("derives diagram correspondence status from match kind", async () => {
    searchParams = new URLSearchParams(`tab=diagram&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByText("Diagram node conflicts with inventory public IP configuration.");
    const diagramSection = screen.getByText("Diagram node conflicts with inventory public IP configuration.").closest("section");
    expect(diagramSection).not.toBeNull();
    expect(within(diagramSection as HTMLElement).getByText("Conflict")).toBeInTheDocument();
    expect(within(diagramSection as HTMLElement).getByText("Likely")).toBeInTheDocument();
  });

  it("renders configuration properties, tags, RBAC, network, and evidence tables on overview", async () => {
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByText("Properties");
    expect(screen.getAllByText("sku").length).toBeGreaterThan(0);
    expect(screen.getByText("env")).toBeInTheDocument();
    expect(screen.getByText("principal-1")).toBeInTheDocument();
    expect(screen.getByText("Peering")).toBeInTheDocument();
    expect(screen.getByText("snapshots/222/properties.json")).toBeInTheDocument();
  });

  it("uses shared drift table with old and new values on overview and drift tab", async () => {
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-drift-change-change-1")).toBeInTheDocument();
    expect(screen.getAllByText("Basic").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Standard").length).toBeGreaterThan(0);

    searchParams = new URLSearchParams(`tab=drift&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    const { unmount } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);
    expect(await screen.findByTestId("infra-resource-hub-drift-tab-change-change-1")).toBeInTheDocument();
    unmount();
  });

  it("does not render hub tab cross-links on drift tab", async () => {
    searchParams = new URLSearchParams(`tab=drift&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-open-drift");
    expect(screen.queryByTestId("infra-resource-hub-drift-open-overview-tab")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-drift-open-findings-tab")).not.toBeInTheDocument();
  });

  it("opens confirm dialog before creating remediation and calls API only on confirm", async () => {
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    const dialog = await screen.findByTestId("infra-resource-hub-create-remediation-dialog");
    expect(within(dialog).getByText("Public endpoint")).toBeInTheDocument();
    expect(matchOperationalFinding).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId("infra-resource-hub-create-remediation-confirm"));
    await waitFor(() => {
      expect(matchOperationalFinding).toHaveBeenCalledWith("finding-1");
      expect(createRemediationInstance).toHaveBeenCalledWith("finding-1");
    });

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-finding-message-finding-1")).toHaveTextContent(
        "Remediation instance created.",
      );
      expect(screen.getByTestId("infra-resource-hub-finding-created-factory-finding-1")).toBeInTheDocument();
    });
  });

  it("clears per-finding remediation message when switching tabs", async () => {
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    fireEvent.click(screen.getByTestId("infra-resource-hub-create-remediation-confirm"));
    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-finding-message-finding-1")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("infra-resource-hub-tab-overview"));
    expect(replace).toHaveBeenCalled();
    expect(screen.queryByTestId("infra-resource-hub-finding-message-finding-1")).not.toBeInTheDocument();
  });

  it("registers Alt+number tab shortcuts in page shortcuts disclosure", async () => {
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-page-shortcuts")).toBeInTheDocument();
  });

  it("switches hub tabs with Alt+number keyboard shortcuts", async () => {
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);
    await screen.findByTestId("infra-resource-hub-tabs");

    fireEvent.keyDown(window, { key: "2", altKey: true });
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("tab=drift"));
  });

  it("shows tab count badges for findings and drift", async () => {
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-tab-findings")).toHaveTextContent("Findings (41)");
    expect(screen.getByTestId("infra-resource-hub-tab-drift")).toHaveTextContent("Drift (1)");
  });

  it("preserves runId on drift Infrastructure Ask links", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-drift-ask-change-1")).toHaveAttribute(
      "href",
      expect.stringContaining("runId=run-1"),
    );
  });

  it("preserves runId on overview drift change workbench links", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-drift-change-change-1")).toHaveAttribute(
      "href",
      expect.stringContaining("runId=run-1"),
    );
  });

  it("preserves runId on findings stream more remediation link", async () => {
    searchParams = new URLSearchParams(
      `tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-findings-stream-more-OperationalSecurity")).toHaveAttribute(
      "href",
      expect.stringContaining("runId=run-1"),
    );
  });

  it("preserves runId when switching hub tabs from the tab bar", async () => {
    searchParams = new URLSearchParams(
      `tab=diagram&runId=run-1&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-tab-drift"));

    expect(replace).toHaveBeenCalledWith(expect.stringContaining("runId=run-1"));
  });

  it("pins hub snapshotId when switching tabs without snapshot in URL", async () => {
    searchParams = new URLSearchParams("tab=overview&runId=run-1");
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-tab-drift"));

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`),
    );
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("runId=run-1"));
  });

  it("surfaces stale audit banner for partial URL audit params", async () => {
    searchParams = new URLSearchParams("tab=overview&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-stale-audit-scope")).toBeInTheDocument();
  });

  it("preserves hub snapshot and runId on stale audit scope banner audit tab link", async () => {
    searchParams = new URLSearchParams(
      "tab=overview&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&runId=run-1",
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const banner = await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    const auditTabLink = within(banner).getByRole("link", { name: "Open audit tab" });

    expect(auditTabLink).toHaveAttribute(
      "href",
      expect.stringContaining(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`),
    );
    expect(auditTabLink).toHaveAttribute("href", expect.stringContaining("runId=run-1"));

    const clearLink = within(banner).getByRole("link", { name: "Clear stale audit scope" });
    expect(clearLink).toHaveAttribute(
      "href",
      expect.stringContaining(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`),
    );
    expect(clearLink).toHaveAttribute("href", expect.stringContaining("runId=run-1"));
    expect(clearLink.getAttribute("href")).not.toContain("assessmentId=");
  });

  it("preserves hub snapshot and runId when clearing active audit scope", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&runId=run-1&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-audit-scope-bar-clear-scope"));

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`),
    );
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("runId=run-1"));
    expect(replace).toHaveBeenCalledWith(
      expect.not.stringMatching(/assessmentId=|auditEvidenceSnapshotId=|controlId=/),
    );
  });

  it("omits terraform mapping from overview when address is absent", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({ terraformAddress: null, terraformGenerationMethod: null }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-open-remediation-work");
    expect(screen.queryByTestId("infra-resource-hub-open-terraform-work")).not.toBeInTheDocument();
  });
});
