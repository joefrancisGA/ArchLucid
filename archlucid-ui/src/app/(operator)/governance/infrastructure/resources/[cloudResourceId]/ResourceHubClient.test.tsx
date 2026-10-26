import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";

import { buildInfraResourceHubTechnicalDisclosureScopedHref } from "@/lib/infra-evidence/infra-resource-hub-technical-disclosure-url";

import { ResourceHubClient } from "./ResourceHubClient";
import {
  buildResourceHubTestMockHub,
  RESOURCE_HUB_TEST_AUDIT_SUFFIX,
  RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
  RESOURCE_HUB_TEST_SNAPSHOT_ID,
} from "./resource-hub-test-mock-hub";

const replace = vi.fn();
const push = vi.fn();
let searchParams = new URLSearchParams(`tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);

const fetchCachedInfraEvidenceResourceHub = vi.fn(async (resourceId: string) =>
  buildResourceHubTestMockHub({ cloudResourceId: resourceId }),
);
const matchOperationalFinding = vi.fn(async () => undefined);
const createRemediationInstance = vi.fn(async () => ({
  succeeded: true,
  instanceId: "new-instance-1",
  blockers: [] as string[],
  errorMessage: null as string | null,
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, push }),
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

describe("buildInfraResourceHubTechnicalDisclosureScopedHref", () => {
  it("pins hub snapshot and runId when syncing buyer-polished technical disclosure", () => {
    const href = buildInfraResourceHubTechnicalDisclosureScopedHref(
      RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
      "tab=overview&runId=run-1",
      "cloudResourceId",
      `/governance/infrastructure/resources/${RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID}`,
      {
        snapshotId: RESOURCE_HUB_TEST_SNAPSHOT_ID,
        runId: "run-1",
      },
    );

    expect(href).toContain(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    expect(href).toContain("runId=run-1");
    expect(href).toContain("infraResourceHubTechnicalKey=cloudResourceId");
  });

  it("preserves explorer workQueue when syncing buyer-polished technical disclosure", () => {
    const href = buildInfraResourceHubTechnicalDisclosureScopedHref(
      RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
      "tab=overview&workQueue=open-findings&runId=run-1",
      "cloudResourceId",
      `/governance/infrastructure/resources/${RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID}`,
      {
        snapshotId: RESOURCE_HUB_TEST_SNAPSHOT_ID,
        runId: "run-1",
      },
    );

    expect(href).toContain("workQueue=open-findings");
  });
});

describe("ResourceHubClient", () => {
  beforeEach(() => {
    replace.mockClear();
    matchOperationalFinding.mockClear();
    createRemediationInstance.mockClear();
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async (resourceId: string) =>
      buildResourceHubTestMockHub({ cloudResourceId: resourceId }),
    );
    searchParams = new URLSearchParams(`tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
  });

  it("shows ARM resource path omission copy when externalResourceId is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        externalResourceId: "   ",
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("ARM resource path was not stored.")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Copy ARM resource path" })).not.toBeInTheDocument();
  });

  it("falls back to the external resource name when the configuration azureResourceId is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementationOnce(async () =>
      buildResourceHubTestMockHub({
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          azureResourceId: "   ",
        },
        externalResourceId:
          "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
      }),
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-page-title")).toHaveTextContent("gateway");
  });

  it("falls back to the external resource name when the configuration id has a trailing slash", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementationOnce(async () =>
      buildResourceHubTestMockHub({
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          azureResourceId:
            "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/",
        },
      }),
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-page-title")).toHaveTextContent("gateway");
  });

  it("shows load error omission copy when the hub load error message is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () => {
      throw "   ";
    });
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-load-error")).toBeInTheDocument();
    expect(screen.getByText("Captured evidence could not be loaded.")).toBeInTheDocument();
  });

  it("clears hub evidence when a newer URL selection fails to load", async () => {
    const nextSnapshotId = "33333333-3333-3333-3333-333333333333";

    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-tabs")).toBeInTheDocument();
    expect(screen.getByText("Peering")).toBeInTheDocument();

    searchParams = new URLSearchParams(`tab=overview&snapshotId=${nextSnapshotId}`);
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () => {
      throw new Error("Captured evidence unavailable for snapshot.");
    });
    rerender(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-load-error")).toBeInTheDocument();
    expect(screen.queryByText("Peering")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-tabs")).not.toBeInTheDocument();
  });

  it("closes create-remediation dialog when cloudResourceId changes", async () => {
    const otherCloudResourceId = "44444444-4444-4444-4444-444444444444";

    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    expect(await screen.findByTestId("infra-resource-hub-create-remediation-dialog")).toBeInTheDocument();

    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    await waitFor(() => {
      expect(screen.queryByTestId("infra-resource-hub-create-remediation-dialog")).not.toBeInTheDocument();
    });
  });

  it("closes create-remediation dialog when switching hub tabs", async () => {
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    expect(await screen.findByTestId("infra-resource-hub-create-remediation-dialog")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("infra-resource-hub-tab-overview"));

    expect(screen.queryByTestId("infra-resource-hub-create-remediation-dialog")).not.toBeInTheDocument();
  });

  it("ignores in-flight create remediation when cloudResourceId changes before the API returns", async () => {
    const otherCloudResourceId = "55555555-5555-5555-5555-555555555555";
    let resolveCreate: (() => void) | undefined;
    const createDeferred = new Promise<{
      succeeded: boolean;
      instanceId: string;
      blockers: string[];
      errorMessage: string | null;
    }>((resolve) => {
      resolveCreate = () =>
        resolve({
          succeeded: true,
          instanceId: "new-instance-1",
          blockers: [],
          errorMessage: null,
        });
    });

    createRemediationInstance.mockImplementationOnce(async () => createDeferred);

    fetchCachedInfraEvidenceResourceHub.mockImplementation(async (resourceId: string) =>
      buildResourceHubTestMockHub({
        externalResourceId:
          resourceId === otherCloudResourceId
            ? "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/other-after-nav"
            : "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gateway",
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          azureResourceId:
            resourceId === otherCloudResourceId
              ? "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/other-after-nav"
              : "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/gateway",
        },
      }),
    );

    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    fireEvent.click(screen.getByTestId("infra-resource-hub-create-remediation-confirm"));

    await waitFor(() => {
      expect(createRemediationInstance).toHaveBeenCalled();
    });

    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    await act(async () => {
      resolveCreate?.();
      await createDeferred;
    });

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("other-after-nav");
    });

    expect(screen.queryByTestId("infra-resource-hub-finding-message-finding-1")).not.toBeInTheDocument();

    const fetchesForPriorResource = fetchCachedInfraEvidenceResourceHub.mock.calls.filter(
      (call) => call[0] === RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
    ).length;
    expect(fetchesForPriorResource).toBe(1);
    expect(fetchCachedInfraEvidenceResourceHub.mock.calls.at(-1)?.[0]).toBe(otherCloudResourceId);
  });

  it("ignores in-flight create remediation when snapshot scope changes before the API returns", async () => {
    const alternateSnapshotId = "66666666-6666-6666-6666-666666666666";
    let resolveCreate: (() => void) | undefined;
    const createDeferred = new Promise<{
      succeeded: boolean;
      instanceId: string;
      blockers: string[];
      errorMessage: string | null;
    }>((resolve) => {
      resolveCreate = () =>
        resolve({
          succeeded: true,
          instanceId: "new-instance-1",
          blockers: [],
          errorMessage: null,
        });
    });

    createRemediationInstance.mockImplementationOnce(async () => createDeferred);

    fetchCachedInfraEvidenceResourceHub.mockImplementation(async (_id, options) => {
      const snapshot = (options as { snapshotId?: string }).snapshotId ?? "";
      const gatewaySuffix =
        snapshot === alternateSnapshotId ? "gateway-scope-b" : "gateway-scope-a";

      return buildResourceHubTestMockHub({
        externalResourceId: `/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/${gatewaySuffix}`,
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          snapshotId: snapshot.length > 0 ? snapshot : RESOURCE_HUB_TEST_SNAPSHOT_ID,
          azureResourceId: `/subscriptions/sub/resourceGroups/rg/providers/Microsoft.Network/publicIPAddresses/${gatewaySuffix}`,
        },
      });
    });

    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("gateway-scope-a");
    });

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    fireEvent.click(screen.getByTestId("infra-resource-hub-create-remediation-confirm"));

    await waitFor(() => {
      expect(createRemediationInstance).toHaveBeenCalled();
    });

    searchParams = new URLSearchParams(`tab=findings&snapshotId=${alternateSnapshotId}`);
    rerender(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("gateway-scope-b");
    });

    await act(async () => {
      resolveCreate?.();
      await createDeferred;
    });

    expect(screen.queryByTestId("infra-resource-hub-finding-message-finding-1")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("gateway-scope-b");
    expect(fetchCachedInfraEvidenceResourceHub.mock.calls.at(-1)?.[1]).toEqual(
      expect.objectContaining({ snapshotId: alternateSnapshotId }),
    );
    expect(screen.getByTestId("infra-resource-hub-create-remediation-finding-1")).toHaveTextContent(
      "Create remediation…",
    );
  });

  it("clears prior hub evidence when pinned snapshotId changes", async () => {
    const alternateSnapshotId = "77777777-7777-7777-7777-777777777777";

    fetchCachedInfraEvidenceResourceHub.mockImplementation(async (_id, options) => {
      const snapshot = (options as { snapshotId?: string }).snapshotId ?? "";
      await new Promise((resolve) => {
        setTimeout(resolve, 40);
      });
      const gatewaySuffix = snapshot === alternateSnapshotId ? "snap-b-gateway" : "snap-a-gateway";

      return buildResourceHubTestMockHub({
        externalResourceId: `/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/${gatewaySuffix}`,
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          snapshotId: snapshot.length > 0 ? snapshot : RESOURCE_HUB_TEST_SNAPSHOT_ID,
          azureResourceId: `/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/${gatewaySuffix}`,
        },
      });
    });

    searchParams = new URLSearchParams(`tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("snap-a-gateway");
    });
    expect(screen.getByText("Peering")).toBeInTheDocument();

    searchParams = new URLSearchParams(`tab=overview&snapshotId=${alternateSnapshotId}`);
    rerender(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(screen.queryByText("Peering")).not.toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("Resource name was not stored.");

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("snap-b-gateway");
    });
  });

  it("ignores stale runId on hub fetch after cloudResourceId changes", async () => {
    const otherCloudResourceId = "88888888-8888-8888-8888-888888888888";
    const staleRunId = "run-from-prior-resource";

    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=${staleRunId}`,
    );
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(fetchCachedInfraEvidenceResourceHub).toHaveBeenCalledWith(
        RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
        expect.objectContaining({ runId: staleRunId }),
      );
    });

    fetchCachedInfraEvidenceResourceHub.mockClear();
    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    await waitFor(() => {
      expect(fetchCachedInfraEvidenceResourceHub).toHaveBeenCalledWith(
        otherCloudResourceId,
        expect.objectContaining({ runId: "" }),
      );
    });
  });

  it("normalizes invalid tab query param via router on load", async () => {
    searchParams = new URLSearchParams(`tab=not-a-real-tab&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-tabs");

    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
      const hrefs = replace.mock.calls.map((call) => String(call[0] ?? ""));
      expect(hrefs.some((href) => !href.includes("tab=not-a-real-tab"))).toBe(true);
    });
  });

  it("uses the last tab query value and canonicalizes duplicate tab params on load", async () => {
    searchParams = new URLSearchParams(
      `tab=not-a-real-tab&tab=drift&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-drift-tab-change-change-1-0");

    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
      const hrefs = replace.mock.calls.map((call) => String(call[0] ?? ""));
      expect(hrefs.some((href) => href.includes("tab=drift") && !href.includes("not-a-real-tab"))).toBe(true);
    });
  });

  it("normalizes whitespace-only tab query param via router on load", async () => {
    searchParams = new URLSearchParams(`tab=%20%20%20&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-tabs");

    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
      const hrefs = replace.mock.calls.map((call) => String(call[0] ?? ""));
      expect(hrefs.some((href) => !href.includes("tab="))).toBe(true);
    });
  });

  it("normalizes stale URL snapshotId via router after cloudResourceId changes", async () => {
    const otherCloudResourceId = "88888888-8888-8888-8888-888888888888";
    const staleSnapshotId = "99999999-9999-9999-9999-999999999999";

    searchParams = new URLSearchParams(`tab=overview&snapshotId=${staleSnapshotId}`);
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);
    await screen.findByTestId("infra-resource-hub-tabs");

    replace.mockClear();
    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    await waitFor(() => {
      expect(replace).toHaveBeenCalled();
      const lastHref = String(replace.mock.calls[replace.mock.calls.length - 1]?.[0] ?? "");
      expect(lastHref).not.toContain(staleSnapshotId);
      expect(lastHref).toContain(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    });
  });

  it("shows latest snapshot label when URL snapshotId is stale after cloudResourceId changes", async () => {
    const otherCloudResourceId = "88888888-8888-8888-8888-888888888888";
    const staleSnapshotId = "99999999-9999-9999-9999-999999999999";

    searchParams = new URLSearchParams(`tab=overview&snapshotId=${staleSnapshotId}`);
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(screen.getByText("Pinned snapshot")).toBeInTheDocument();
    });

    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    await waitFor(() => {
      expect(screen.queryByText("Pinned snapshot")).not.toBeInTheDocument();
      expect(screen.getByText("Latest inventory")).toBeInTheDocument();
    });
  });

  it("ignores URL snapshotId pin on hub fetch immediately after cloudResourceId changes", async () => {
    const otherCloudResourceId = "88888888-8888-8888-8888-888888888888";
    const staleSnapshotId = "99999999-9999-9999-9999-999999999999";

    searchParams = new URLSearchParams(`tab=overview&snapshotId=${staleSnapshotId}`);
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(fetchCachedInfraEvidenceResourceHub).toHaveBeenCalledWith(
        RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
        expect.objectContaining({ snapshotId: staleSnapshotId }),
      );
    });

    fetchCachedInfraEvidenceResourceHub.mockClear();
    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    await waitFor(() => {
      expect(fetchCachedInfraEvidenceResourceHub).toHaveBeenCalledWith(
        otherCloudResourceId,
        expect.objectContaining({ snapshotId: "" }),
      );
    });
  });

  it("clears prior hub evidence when cloudResourceId changes", async () => {
    const otherCloudResourceId = "33333333-3333-3333-3333-333333333333";

    fetchCachedInfraEvidenceResourceHub.mockImplementation(
      async (resourceId: string) =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve(
              buildResourceHubTestMockHub({
                cloudResourceId: resourceId,
                externalResourceId:
                  resourceId === otherCloudResourceId
                    ? "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/other-gateway"
                    : "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
                currentConfiguration: {
                  ...buildResourceHubTestMockHub().currentConfiguration,
                  azureResourceId:
                    resourceId === otherCloudResourceId
                      ? "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/other-gateway"
                      : "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway",
                },
              }),
            );
          }, 40);
        }),
    );

    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("gateway");
    });

    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("Resource name was not stored.");
    expect(screen.queryByText("Peering")).not.toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("other-gateway");
    });
  });

  it("does not let a stale resource request overwrite a newer URL selection", async () => {
    let resolveFirstRequest: ((hub: ReturnType<typeof buildResourceHubTestMockHub>) => void) | undefined;
    let resolveSecondRequest: ((hub: ReturnType<typeof buildResourceHubTestMockHub>) => void) | undefined;
    const firstRequest = new Promise<ReturnType<typeof buildResourceHubTestMockHub>>((resolve) => {
      resolveFirstRequest = resolve;
    });
    const secondRequest = new Promise<ReturnType<typeof buildResourceHubTestMockHub>>((resolve) => {
      resolveSecondRequest = resolve;
    });

    fetchCachedInfraEvidenceResourceHub.mockImplementation(
      async (_resourceId: string, options: { readonly runId?: string }) =>
        options.runId === "newer-run" ? secondRequest : firstRequest,
    );

    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=newer-run`,
    );
    rerender(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(resolveFirstRequest).toBeDefined();
      expect(resolveSecondRequest).toBeDefined();
    });

    if (resolveFirstRequest == null || resolveSecondRequest == null) {
      throw new Error("Expected both resource requests to be started.");
    }

    await act(async () => {
      resolveSecondRequest(
        buildResourceHubTestMockHub({
          externalResourceId:
            "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/newer-gateway",
          currentConfiguration: {
            ...buildResourceHubTestMockHub().currentConfiguration,
            azureResourceId:
              "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/newer-gateway",
          },
        }),
      );
      await Promise.resolve();
    });
    expect(await screen.findByTestId("infra-resource-hub-page-title")).toHaveTextContent("newer-gateway");

    await act(async () => {
      resolveFirstRequest(
        buildResourceHubTestMockHub({
          externalResourceId:
            "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/stale-gateway",
          currentConfiguration: {
            ...buildResourceHubTestMockHub().currentConfiguration,
            azureResourceId:
              "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/stale-gateway",
          },
        }),
      );
      await Promise.resolve();
    });

    expect(screen.getByTestId("infra-resource-hub-page-title")).toHaveTextContent("newer-gateway");
  });

  it("omits stale URL audit scope on drift workbench link after cloudResourceId changes", async () => {
    const otherCloudResourceId = "88888888-8888-8888-8888-888888888888";

    fetchCachedInfraEvidenceResourceHub.mockImplementation(async (resourceId: string) =>
      buildResourceHubTestMockHub({
        cloudResourceId: resourceId,
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          available: resourceId !== otherCloudResourceId,
          matches: resourceId === otherCloudResourceId ? [] : buildResourceHubTestMockHub().auditLineageLink.matches,
        },
      }),
    );

    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);
    await screen.findByTestId("infra-resource-hub-open-drift-work");

    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    const href = (await screen.findByTestId("infra-resource-hub-open-drift-work")).getAttribute("href") ?? "";
    expect(href).toContain(otherCloudResourceId);
    expect(href).not.toMatch(/assessmentId=|auditEvidenceSnapshotId=|controlId=/);
  });

  it("omits stale snapshotId on drift workbench link after cloudResourceId changes", async () => {
    const otherCloudResourceId = "88888888-8888-8888-8888-888888888888";
    const otherSnapshotId = "33333333-3333-3333-3333-333333333333";

    fetchCachedInfraEvidenceResourceHub.mockImplementation(async (resourceId: string) =>
      buildResourceHubTestMockHub({
        cloudResourceId: resourceId,
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          snapshotId:
            resourceId === otherCloudResourceId ? otherSnapshotId : RESOURCE_HUB_TEST_SNAPSHOT_ID,
        },
      }),
    );

    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-from-prior-resource`,
    );
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);
    await screen.findByTestId("infra-resource-hub-open-drift-work");

    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    const href = (await screen.findByTestId("infra-resource-hub-open-drift-work")).getAttribute("href") ?? "";
    expect(href).toContain(otherCloudResourceId);
    expect(href).not.toContain(RESOURCE_HUB_TEST_SNAPSHOT_ID);
    expect(href).toContain(`snapshotId=${otherSnapshotId}`);
  });

  it("omits stale runId on remediation workbench link after cloudResourceId changes", async () => {
    const otherCloudResourceId = "88888888-8888-8888-8888-888888888888";
    const staleRunId = "run-from-prior-resource";

    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=${staleRunId}`,
    );
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);
    await screen.findByTestId("infra-resource-hub-open-remediation-work");

    rerender(<ResourceHubClient cloudResourceId={otherCloudResourceId} />);

    const href = (await screen.findByTestId("infra-resource-hub-open-remediation-work")).getAttribute("href") ?? "";
    expect(href).toContain(otherCloudResourceId);
    expect(href).not.toContain(staleRunId);
    expect(href).not.toContain("runId=");
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
    expect(screen.getByTestId("infra-resource-hub-findings-stream-more-OperationalSecurity")).toHaveAttribute(
      "href",
      expect.stringContaining("/governance/infrastructure/remediation"),
    );
  });

  it("links architecture review pagination to the resource hub findings tab", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        architectureReviewFindings: {
          ...buildResourceHubTestMockHub().architectureReviewFindings,
          totalCount: 40,
          hasMore: true,
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const moreLink = await screen.findByTestId("infra-resource-hub-findings-stream-more-ArchitectureReview");
    expect(moreLink).toHaveTextContent("Showing 1 of 40");
    expect(moreLink).toHaveAttribute(
      "href",
      `/governance/infrastructure/resources/${RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID}?tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`,
    );
    expect(moreLink.getAttribute("href")).not.toContain("/governance/infrastructure/remediation");
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

  it("renders evidence pointers that share kind and relative path", async () => {
    const sharedPath = "snapshots/222/properties.json";
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        evidencePointers: [
          { kind: "inventory", relativePath: sharedPath },
          { kind: "inventory", relativePath: sharedPath },
        ],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByText("Evidence pointers");
    expect(screen.getAllByText(sharedPath)).toHaveLength(2);
    expect(screen.getAllByText("inventory")).toHaveLength(2);
  });

  it("shows drift risk omission copy when riskClassification is whitespace-only", async () => {
    const baseChange = buildResourceHubTestMockHub().recentChanges[0];
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        recentChanges: [
          {
            ...baseChange,
            riskClassification: "   ",
          },
        ],
      }),
    );
    searchParams = new URLSearchParams(`tab=drift&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Risk classification was not stored.")).toBeInTheDocument();
  });

  it("shows drift omission copy when property and old/new values are whitespace-only", async () => {
    const baseChange = buildResourceHubTestMockHub().recentChanges[0];
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        recentChanges: [
          {
            ...baseChange,
            property: "   ",
            oldValue: "   ",
            newValue: "   ",
          },
        ],
      }),
    );
    searchParams = new URLSearchParams(`tab=drift&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Property name was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Previous value was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Updated value was not stored.")).toBeInTheDocument();
  });

  it("renders drift rows that share changeId but differ in property", async () => {
    const baseChange = buildResourceHubTestMockHub().recentChanges[0];
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        recentChanges: [
          { ...baseChange, property: "sku" },
          { ...baseChange, property: "tier" },
        ],
      }),
    );
    searchParams = new URLSearchParams(`tab=drift&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-drift-tab-change-change-1-0");
    expect(screen.getByTestId("infra-resource-hub-drift-tab-change-change-1-1")).toHaveTextContent("tier");
    expect(screen.getByTestId("infra-resource-hub-drift-tab-change-change-1-0")).toHaveTextContent("sku");
  });

  it("renders RBAC rows that share principal and role but differ in scope", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        rbacAssignments: [
          {
            principalId: "principal-1",
            roleDefinitionId: "role-reader",
            scope: "/subscriptions/sub",
          },
          {
            principalId: "principal-1",
            roleDefinitionId: "role-reader",
            scope: "/subscriptions/sub/resourceGroups/rg-net",
          },
        ],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByText("RBAC assignments");
    expect(screen.getByText("/subscriptions/sub")).toBeInTheDocument();
    expect(screen.getByText("/subscriptions/sub/resourceGroups/rg-net")).toBeInTheDocument();
  });

  it("renders network relationships that share endpoints but differ in type", async () => {
    const sharedFrom =
      "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-a";
    const sharedTo =
      "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-b";
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        networkRelationships: [
          {
            relationshipType: "Peering",
            fromAzureResourceId: sharedFrom,
            toAzureResourceId: sharedTo,
          },
          {
            relationshipType: "PrivateEndpoint",
            fromAzureResourceId: sharedFrom,
            toAzureResourceId: sharedTo,
          },
        ],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByText("Network relationships");
    expect(screen.getByText("Peering")).toBeInTheDocument();
    expect(screen.getByText("PrivateEndpoint")).toBeInTheDocument();
  });

  it("lists cross-assessment audit controls that share control and snapshot ids", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          matches: [
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
              controlNumber: "AC-2",
              controlTitle: "Account management",
              snapshotCreatedUtc: "2026-01-01T00:00:00Z",
            },
            {
              assessmentId: "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
              controlNumber: "AC-2",
              controlTitle: "Account management (other assessment)",
              snapshotCreatedUtc: "2026-01-02T00:00:00Z",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(
      `tab=audit&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Other linked controls")).toBeInTheDocument();
    expect(screen.getByText("AC-2 · Account management (other assessment)")).toBeInTheDocument();
  });

  it("uses shared drift table with old and new values on overview and drift tab", async () => {
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-drift-change-change-1-0")).toBeInTheDocument();
    expect(screen.getAllByText("Basic").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Standard").length).toBeGreaterThan(0);

    searchParams = new URLSearchParams(`tab=drift&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    const { unmount } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);
    expect(await screen.findByTestId("infra-resource-hub-drift-tab-change-change-1-0")).toBeInTheDocument();
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

  it("shows finding title omission copy in create-remediation confirm dialog when title is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          items: [
            {
              id: "finding-whitespace-title",
              title: "   ",
              severity: "High",
              status: "Open",
              streamKind: "OperationalSecurity",
              streamLabel: "Operational security",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-whitespace-title"));
    const dialog = await screen.findByTestId("infra-resource-hub-create-remediation-dialog");
    expect(within(dialog).getByText("Finding title was not stored.")).toBeInTheDocument();
  });

  it("does not show Open in factory when create remediation returns whitespace-only instanceId", async () => {
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    createRemediationInstance.mockResolvedValueOnce({
      succeeded: true,
      instanceId: "   ",
      blockers: [] as string[],
      errorMessage: null as string | null,
    });
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    fireEvent.click(screen.getByTestId("infra-resource-hub-create-remediation-confirm"));
    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-finding-message-finding-1")).toHaveTextContent(
        "Remediation instance created.",
      );
    });
    expect(screen.queryByTestId("infra-resource-hub-finding-created-factory-finding-1")).not.toBeInTheDocument();
  });

  it("shows generic remediation create failed when blockers are whitespace-only", async () => {
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    createRemediationInstance.mockResolvedValueOnce({
      succeeded: false,
      instanceId: null,
      blockers: ["   ", "  "],
      errorMessage: null as string | null,
    });
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    fireEvent.click(screen.getByTestId("infra-resource-hub-create-remediation-confirm"));
    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-finding-message-finding-1")).toHaveTextContent(
        "Remediation create failed.",
      );
    });
  });

  it("shows generic remediation create failed when create remediation returns whitespace-only errorMessage", async () => {
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    createRemediationInstance.mockResolvedValueOnce({
      succeeded: false,
      instanceId: null,
      blockers: [] as string[],
      errorMessage: "   ",
    });
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    fireEvent.click(screen.getByTestId("infra-resource-hub-create-remediation-confirm"));
    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-finding-message-finding-1")).toHaveTextContent(
        "Remediation create failed.",
      );
    });
  });

  it("shows finding id omission copy and hides operational actions when finding id is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          items: [
            {
              id: "   ",
              title: "Public endpoint",
              severity: "High",
              status: "Open",
              streamKind: "OperationalSecurity",
              streamLabel: "Operational security",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Finding id was not stored.")).toBeInTheDocument();
    expect(screen.queryByTestId(/^infra-resource-hub-finding-factory-/)).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^infra-resource-hub-create-remediation-/)).not.toBeInTheDocument();
    expect(screen.queryByTestId(/^infra-resource-hub-finding-ask-/)).not.toBeInTheDocument();
  });

  it("uses trimmed finding id for operational actions and status messages when id is padded", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          items: [
            {
              id: "  finding-padded  ",
              title: "Padded id finding",
              severity: "High",
              status: "Open",
              streamKind: "OperationalSecurity",
              streamLabel: "Operational security",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-padded"));
    fireEvent.click(screen.getByTestId("infra-resource-hub-create-remediation-confirm"));
    await waitFor(() => {
      expect(matchOperationalFinding).toHaveBeenCalledWith("finding-padded");
      expect(createRemediationInstance).toHaveBeenCalledWith("finding-padded");
    });
    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-finding-message-finding-padded")).toHaveTextContent(
        "Remediation instance created.",
      );
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

  it("clears per-finding remediation message when the hub reloads for a new snapshot scope", async () => {
    const alternateSnapshotId = "snapshot-scope-2";
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-create-remediation-finding-1"));
    fireEvent.click(screen.getByTestId("infra-resource-hub-create-remediation-confirm"));
    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-finding-message-finding-1")).toHaveTextContent(
        "Remediation instance created.",
      );
    });

    searchParams = new URLSearchParams(`tab=findings&snapshotId=${alternateSnapshotId}`);
    rerender(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(fetchCachedInfraEvidenceResourceHub).toHaveBeenCalledWith(
        RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
        expect.objectContaining({ snapshotId: alternateSnapshotId }),
      );
    });
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

  it("preserves explorer workQueue when switching hub tabs via keyboard shortcut", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-remediation&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);
    await screen.findByTestId("infra-resource-hub-tabs");

    fireEvent.keyDown(window, { key: "6", altKey: true });

    expect(replace).toHaveBeenCalledWith(expect.stringContaining("workQueue=open-remediation"));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("tab=remediation"));
  });

  it("threads explorer workQueue on back-to-explorer link", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const backLink = await screen.findByTestId("infra-resource-hub-explorer-work-queue-back-link");

    expect(backLink).toHaveAttribute("href", expect.stringContaining("workQueue=open-findings"));
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

    expect(await screen.findByTestId("infra-resource-hub-drift-ask-change-1-0")).toHaveAttribute(
      "href",
      expect.stringContaining("runId=run-1"),
    );
  });

  it("preserves explorer workQueue on overview Infrastructure Ask link", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-open-ask")).toHaveAttribute(
      "href",
      expect.stringContaining("workQueue=open-findings"),
    );
  });

  it("passes resolved snapshot id to hub fetch when URL omits snapshotId", async () => {
    fetchCachedInfraEvidenceResourceHub.mockClear();
    searchParams = new URLSearchParams("tab=overview");
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-tabs");
    await waitFor(() => {
      expect(fetchCachedInfraEvidenceResourceHub).toHaveBeenCalledWith(
        RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
        expect.objectContaining({ snapshotId: RESOURCE_HUB_TEST_SNAPSHOT_ID }),
      );
    });
  });

  it("retains implicit snapshot pin on hub fetch when audit scope changes and URL omits snapshotId", async () => {
    fetchCachedInfraEvidenceResourceHub.mockClear();
    searchParams = new URLSearchParams("tab=overview");
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-tabs");
    await waitFor(() => {
      expect(fetchCachedInfraEvidenceResourceHub).toHaveBeenCalledWith(
        RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
        expect.objectContaining({ snapshotId: RESOURCE_HUB_TEST_SNAPSHOT_ID }),
      );
    });

    fetchCachedInfraEvidenceResourceHub.mockClear();
    searchParams = new URLSearchParams(`tab=overview${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`);
    rerender(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(fetchCachedInfraEvidenceResourceHub).toHaveBeenCalledWith(
        RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
        expect.objectContaining({ snapshotId: RESOURCE_HUB_TEST_SNAPSHOT_ID }),
      );
    });
  });

  it("omits partial stale URL assessmentId from hub fetch", async () => {
    fetchCachedInfraEvidenceResourceHub.mockClear();
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    expect(fetchCachedInfraEvidenceResourceHub).toHaveBeenCalledWith(
      RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID,
      expect.objectContaining({
        snapshotId: RESOURCE_HUB_TEST_SNAPSHOT_ID,
        assessmentId: "",
        auditEvidenceSnapshotId: "",
        controlId: "",
      }),
    );
  });

  it("omits unlinked URL audit scope from hub fetch after lineage loads", async () => {
    fetchCachedInfraEvidenceResourceHub.mockClear();
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    await waitFor(() => {
      expect(fetchCachedInfraEvidenceResourceHub.mock.calls.some((call) => {
        const options = call[1] as { controlId?: string };

        return options.controlId === "";
      })).toBe(true);
    });
  });

  it("clears partial stale URL audit params on overview Infrastructure Ask link", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    const askLink = await screen.findByTestId("infra-resource-hub-open-ask");
    expect(askLink.getAttribute("href")).toContain("auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(askLink.getAttribute("href")).toContain("controlId=cccccccc-cccc-cccc-cccc-cccccccccccc");
  });

  it("clears partial stale URL audit params on overview Ask link when audit lineage is unavailable", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          available: false,
          degradedReason: "No rows",
          matches: [],
        },
      }),
    );
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    const askLink = await screen.findByTestId("infra-resource-hub-open-ask");
    expect(askLink.getAttribute("href")).not.toContain("assessmentId=");
  });

  it("omits duplicate stale tab params on drift Infrastructure Ask links", async () => {
    searchParams = new URLSearchParams(
      `tab=not-a-real-tab&tab=drift&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-drift-tab-change-change-1-0");
    const askLink = await screen.findByTestId("infra-resource-hub-drift-tab-ask-change-1-0");
    expect(askLink.getAttribute("href")).not.toContain("not-a-real-tab");
    expect(askLink.getAttribute("href")).toContain("tab=drift");
  });

  it("preserves explorer workQueue on drift Infrastructure Ask links", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-drift-ask-change-1-0")).toHaveAttribute(
      "href",
      expect.stringContaining("workQueue=open-findings"),
    );
  });

  it("preserves explorer workQueue on findings Infrastructure Ask links", async () => {
    searchParams = new URLSearchParams(
      `tab=findings&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-finding-ask-finding-1")).toHaveAttribute(
      "href",
      expect.stringContaining("workQueue=open-findings"),
    );
  });

  it("preserves runId on overview drift change workbench links", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-drift-change-change-1-0")).toHaveAttribute(
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

  it("pins hub snapshotId on audit scope chip when URL omits snapshotId", async () => {
    searchParams = new URLSearchParams(
      "tab=overview&runId=run-1&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const chip = await screen.findByTestId("infra-resource-hub-audit-scope-chip");

    expect(chip).toHaveAttribute("href", expect.stringContaining(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`));
    expect(chip).toHaveAttribute("href", expect.stringContaining("runId=run-1"));
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

  it("preserves explorer workQueue on stale audit scope banner links", async () => {
    searchParams = new URLSearchParams(
      "tab=overview&workQueue=open-findings&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&runId=run-1",
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const banner = await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    const auditTabLink = within(banner).getByRole("link", { name: "Open audit tab" });
    const clearLink = within(banner).getByRole("link", { name: "Clear stale audit scope" });

    expect(auditTabLink).toHaveAttribute("href", expect.stringContaining("workQueue=open-findings"));
    expect(clearLink).toHaveAttribute("href", expect.stringContaining("workQueue=open-findings"));
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

  it("preserves explorer workQueue when clearing active audit scope", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&runId=run-1${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-audit-scope-bar-clear-scope"));

    expect(replace).toHaveBeenCalledWith(expect.stringContaining("workQueue=open-findings"));
  });

  it("preserves hub snapshot and runId when switching audit control via inline picker", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          matches: [
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
              controlNumber: "AC-2",
              controlTitle: "Account management",
              snapshotCreatedUtc: "2026-01-01T00:00:00Z",
            },
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              controlNumber: "AC-3",
              controlTitle: "Access enforcement",
              snapshotCreatedUtc: "2026-01-02T00:00:00Z",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(
      `tab=overview&runId=run-1&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const picker = await screen.findByTestId("infra-resource-hub-audit-scope-bar-control-picker");
    fireEvent.change(picker, { target: { value: "dddddddd-dddd-dddd-dddd-dddddddddddd" } });

    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`),
    );
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("runId=run-1"));
    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining("controlId=dddddddd-dddd-dddd-dddd-dddddddddddd"),
    );
  });

  it("preserves explorer workQueue on audit scope bar change-control link", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&runId=run-1${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const changeControlLink = await screen.findByTestId("infra-resource-hub-audit-scope-bar-change-control");
    expect(changeControlLink).toHaveAttribute("href", expect.stringContaining("workQueue=open-findings"));
  });

  it("preserves explorer workQueue on audit scope chip href", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&runId=run-1&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const chip = await screen.findByTestId("infra-resource-hub-audit-scope-chip");

    expect(chip).toHaveAttribute("href", expect.stringContaining("workQueue=open-findings"));
    expect(chip).toHaveAttribute("href", expect.stringContaining(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`));
  });

  it("preserves explorer workQueue on overview audit lineage cross-link", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-open-audit-work")).toHaveAttribute(
      "href",
      expect.stringContaining("workQueue=open-findings"),
    );
  });

  it("preserves explorer workQueue on remediation Infrastructure Ask links", async () => {
    searchParams = new URLSearchParams(
      `tab=remediation&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-remediation-ask-instance-1")).toHaveAttribute(
      "href",
      expect.stringContaining("workQueue=open-findings"),
    );
  });

  it("preserves explorer workQueue on audit Infrastructure Ask link", async () => {
    searchParams = new URLSearchParams(
      `tab=audit&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-audit-ask")).toHaveAttribute(
      "href",
      expect.stringContaining("workQueue=open-findings"),
    );
  });

  it("preserves explorer workQueue on diagram Infrastructure Ask link", async () => {
    searchParams = new URLSearchParams(
      `tab=diagram&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-diagram-ask")).toHaveAttribute(
      "href",
      expect.stringContaining("workQueue=open-findings"),
    );
  });

  it("preserves explorer workQueue when switching audit control via inline picker", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          matches: [
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
              controlNumber: "AC-2",
              controlTitle: "Account management",
              snapshotCreatedUtc: "2026-01-01T00:00:00Z",
            },
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              controlNumber: "AC-3",
              controlTitle: "Access enforcement",
              snapshotCreatedUtc: "2026-01-02T00:00:00Z",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&runId=run-1&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const picker = await screen.findByTestId("infra-resource-hub-audit-scope-bar-control-picker");
    fireEvent.change(picker, { target: { value: "dddddddd-dddd-dddd-dddd-dddddddddddd" } });

    expect(replace).toHaveBeenCalledWith(expect.stringContaining("workQueue=open-findings"));
  });

  it("uses the selected audit snapshot when duplicate control ids are linked", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          auditEvidenceSnapshotId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          controlId: "shared-control",
          controlNumber: "AC-9",
          controlTitle: "Second control",
          matches: [
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "shared-control",
              controlNumber: "AC-2",
              controlTitle: "First control",
              snapshotCreatedUtc: "2026-01-01T00:00:00Z",
            },
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              controlId: "shared-control",
              controlNumber: "AC-9",
              controlTitle: "Second control",
              snapshotCreatedUtc: "2026-01-02T00:00:00Z",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(
      "tab=audit&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=dddddddd-dddd-dddd-dddd-dddddddddddd&controlId=shared-control",
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("AE-10 chain of custody for AC-9 · Second control.")).toBeInTheDocument();
  });

  it("resolves audit lineage when URL has only assessmentId and hub link audit ids are whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          assessmentId: "   ",
          auditEvidenceSnapshotId: "   ",
          controlId: "   ",
        },
      }),
    );
    searchParams = new URLSearchParams(
      `tab=audit&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("AE-10 chain of custody for AC-2 · Account management.")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-audit-lineage-link")).toBeInTheDocument();
  });

  it("includes resolved audit scope on overview remediation link when hub link audit ids are whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          assessmentId: "   ",
          auditEvidenceSnapshotId: "   ",
          controlId: "   ",
        },
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const remediationLink = await screen.findByTestId("infra-resource-hub-open-remediation-work");
    expect(remediationLink).toHaveAttribute(
      "href",
      `/governance/infrastructure/remediation?cloudResourceId=${RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID}&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
  });

  it("resolves audit lineage from the first match when hub link audit ids are whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          assessmentId: "   ",
          auditEvidenceSnapshotId: "   ",
          controlId: "   ",
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=audit&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("AE-10 chain of custody for AC-2 · Account management.")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-audit-lineage-link")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-audit-degraded")).not.toBeInTheDocument();
  });

  it("resolves audit lineage when hub link audit ids are padded and URL omits audit scope", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          assessmentId: "  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ",
          auditEvidenceSnapshotId: "  bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb  ",
          controlId: "  cccccccc-cccc-cccc-cccc-cccccccccccc  ",
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=audit&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("AE-10 chain of custody for AC-2 · Account management.")).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-audit-lineage-link")).toBeInTheDocument();
  });

  it("does not show stale audit scope when URL audit ids match padded hub match rows", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          matches: [
            {
              assessmentId: "  aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa  ",
              auditEvidenceSnapshotId: "  bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb  ",
              controlId: "  cccccccc-cccc-cccc-cccc-cccccccccccc  ",
              controlNumber: "AC-2",
              controlTitle: "Account management",
              snapshotCreatedUtc: "2026-01-01T00:00:00Z",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(
      `tab=audit&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=cccccccc-cccc-cccc-cccc-cccccccccccc`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-audit-lineage-link");
    expect(screen.queryByTestId("infra-resource-hub-stale-audit-scope")).not.toBeInTheDocument();
  });

  it("shows audit control omission copy on other linked controls when control fields are whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          auditEvidenceSnapshotId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          controlId: "control-two",
          controlNumber: "AC-3",
          controlTitle: "Second control",
          matches: [
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "control-one",
              controlNumber: "   ",
              controlTitle: "   ",
              snapshotCreatedUtc: "2026-01-01T00:00:00Z",
            },
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              controlId: "control-two",
              controlNumber: "AC-3",
              controlTitle: "Second control",
              snapshotCreatedUtc: "2026-01-02T00:00:00Z",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(
      "tab=audit&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=dddddddd-dddd-dddd-dddd-dddddddddddd&controlId=control-two",
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(
      await screen.findByText("Control number was not stored. · Control title was not stored."),
    ).toBeInTheDocument();
  });

  it("lists every non-active audit control when a later match is selected", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          auditEvidenceSnapshotId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
          controlId: "control-two",
          controlNumber: "AC-3",
          controlTitle: "Second control",
          matches: [
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "control-one",
              controlNumber: "AC-2",
              controlTitle: "First control",
              snapshotCreatedUtc: "2026-01-01T00:00:00Z",
            },
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              controlId: "control-two",
              controlNumber: "AC-3",
              controlTitle: "Second control",
              snapshotCreatedUtc: "2026-01-02T00:00:00Z",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(
      "tab=audit&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=dddddddd-dddd-dddd-dddd-dddddddddddd&controlId=control-two",
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-audit-ask-control-one")).toBeInTheDocument();
  });

  it("preserves explorer workQueue when switching hub tabs from the tab bar", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-tab-drift"));

    expect(replace).toHaveBeenCalledWith(expect.stringContaining("workQueue=open-findings"));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("runId=run-1"));
  });

  it("preserves explorer workQueue when switching hub tabs without snapshot in URL", async () => {
    searchParams = new URLSearchParams("tab=overview&workQueue=open-findings&runId=run-1");
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-tab-findings"));

    expect(replace).toHaveBeenCalledWith(expect.stringContaining("workQueue=open-findings"));
    expect(replace).toHaveBeenCalledWith(
      expect.stringContaining(`snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`),
    );
  });

  it("clears overview arm path technical disclosure key when switching away from overview tab", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&infraResourceHubTechnicalKey=armResourcePath&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-tab-findings"));

    expect(replace).toHaveBeenCalledWith(
      expect.not.stringContaining("infraResourceHubTechnicalKey=armResourcePath"),
    );
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("workQueue=open-findings"));
  });

  it("clears terraform technical disclosure key when switching away from terraform tab", async () => {
    searchParams = new URLSearchParams(
      `tab=terraform&infraResourceHubTechnicalKey=terraformAddress&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    replace.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    fireEvent.click(await screen.findByTestId("infra-resource-hub-tab-overview"));

    expect(replace).toHaveBeenCalledWith(expect.not.stringContaining("infraResourceHubTechnicalKey=terraformAddress"));
    expect(replace).toHaveBeenCalledWith(expect.stringContaining("workQueue=open-findings"));
  });

  it("threads explorer workQueue when using G then E keyboard shortcut to return to explorer", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=open-findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`,
    );
    push.mockClear();
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);
    await screen.findByTestId("infra-resource-hub-tabs");

    fireEvent.keyDown(window, { key: "g" });
    fireEvent.keyDown(window, { key: "e" });

    expect(push).toHaveBeenCalledWith(expect.stringContaining("workQueue=open-findings"));
  });

  it("preserves explorer workQueue on overview view all drift hub tab link", async () => {
    const baseChange = buildResourceHubTestMockHub().recentChanges[0];
    const manyChanges = Array.from({ length: 6 }, (_, index) => ({
      ...baseChange,
      changeId: `change-${index + 1}`,
      diffId: `diff-${index + 1}`,
    }));
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({ recentChanges: manyChanges }),
    );
    searchParams = new URLSearchParams(
      `tab=overview&workQueue=recent-drift&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&runId=run-1`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-overview-view-all-drift")).toHaveAttribute(
      "href",
      expect.stringContaining("workQueue=recent-drift"),
    );
    expect(screen.getByTestId("infra-resource-hub-overview-view-all-drift")).toHaveAttribute(
      "href",
      expect.stringContaining("tab=drift"),
    );
  });

  it("treats whitespace-only terraform generation method as not stored", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({ terraformGenerationMethod: "  \t " }),
    );
    searchParams = new URLSearchParams(`tab=terraform&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Terraform generation method was not stored.")).toBeInTheDocument();
  });

  it("treats whitespace-only diagram correspondence explanation as not stored", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        diagramCorrespondence: {
          ...buildResourceHubTestMockHub().diagramCorrespondence!,
          explainText: "   ",
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=diagram&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Correspondence explanation was not stored.")).toBeInTheDocument();
  });

  it("shows remediation pattern omission copy when patternKey is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        remediationInstances: {
          ...buildResourceHubTestMockHub().remediationInstances,
          items: [
            {
              instanceId: "instance-whitespace-pattern",
              patternKey: "   ",
              status: "Draft",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=remediation&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Remediation pattern was not stored.")).toBeInTheDocument();
  });

  it("does not show remediation tab factory links when instanceId is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        remediationInstances: {
          ...buildResourceHubTestMockHub().remediationInstances,
          items: [
            {
              instanceId: "   ",
              patternKey: "public-ip-restrict",
              status: "Draft",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=remediation&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Remediation instance id was not stored.")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Open in factory" })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Ask" })).not.toBeInTheDocument();
  });

  it("treats whitespace-only remediation instance status as not stored", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        remediationInstances: {
          ...buildResourceHubTestMockHub().remediationInstances,
          items: [
            {
              instanceId: "instance-1",
              patternKey: "public-ip-restrict",
              status: "   ",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=remediation&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Remediation status was not stored.")).toBeInTheDocument();
  });

  it("shows findings stream section label omission copy when streamLabel is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          streamLabel: "   ",
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Findings stream label was not stored.")).toBeInTheDocument();
  });

  it("shows correspondence id omission copy and hides diagram actions when correspondenceId is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        diagramCorrespondence: {
          ...buildResourceHubTestMockHub().diagramCorrespondence!,
          correspondenceId: "   ",
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=diagram&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Correspondence id was not stored.")).toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-diagram-reconcile")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-diagram-remediation")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-diagram-ask")).not.toBeInTheDocument();
  });

  it("uses trimmed correspondence id in diagram ask handoff when correspondenceId is padded", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        diagramCorrespondence: {
          ...buildResourceHubTestMockHub().diagramCorrespondence!,
          correspondenceId: "  corr-padded  ",
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=diagram&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const askLink = await screen.findByTestId("infra-resource-hub-diagram-ask");
    expect(askLink).toHaveAttribute("href", expect.stringContaining("correspondenceId=corr-padded"));
    expect(askLink.getAttribute("href")).not.toMatch(/correspondenceId=%20/);
  });

  it("shows diagram match kind omission copy when matchKind is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        diagramCorrespondence: {
          ...buildResourceHubTestMockHub().diagramCorrespondence!,
          matchKind: "  ",
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=diagram&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Match kind was not stored.")).toBeInTheDocument();
  });

  it("shows severity omission copy when the captured severity is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          items: [
            {
              id: "finding-whitespace-severity",
              title: "Public endpoint",
              severity: "   ",
              status: "Open",
              streamKind: "OperationalSecurity",
              streamLabel: "Operational security",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Severity was not stored.")).toBeInTheDocument();
  });

  it("shows finding status omission copy on architecture review rows when status is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        architectureReviewFindings: {
          ...buildResourceHubTestMockHub().architectureReviewFindings,
          items: [
            {
              id: "arch-finding-whitespace-status",
              title: "Missing subnet segmentation",
              severity: "Medium",
              status: "   ",
              streamKind: "ArchitectureReview",
              streamLabel: "Architecture review",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Finding status was not stored.")).toBeInTheDocument();
  });

  it("shows finding title omission copy when the captured title is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          items: [
            {
              id: "finding-whitespace-title",
              title: "   ",
              severity: "High",
              status: "Open",
              streamKind: "OperationalSecurity",
              streamLabel: "Operational security",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Finding title was not stored.")).toBeInTheDocument();
  });

  it("does not show paginated caption on remediation tab when the instance list is empty", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        remediationInstances: {
          items: [],
          totalCount: 50,
          page: 1,
          pageSize: 25,
          hasMore: true,
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=remediation&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-remediation-empty");
    expect(screen.queryByText("Showing 0 of 50")).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-remediation-stream-caption")).not.toBeInTheDocument();
  });

  it("shows remediation stream caption when instances are visible and more exist off-page", async () => {
    searchParams = new URLSearchParams(`tab=remediation&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-remediation-stream-caption")).toHaveTextContent(
      "Showing 1 of 50",
    );
  });

  it("does not show findings stream pagination link when the stream has no rows", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          items: [],
          totalCount: 40,
          hasMore: true,
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-findings-empty-OperationalSecurity");
    expect(screen.queryByTestId("infra-resource-hub-findings-stream-more-OperationalSecurity")).not.toBeInTheDocument();
  });

  it("treats whitespace-only terraform address as not stored on the terraform tab", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({ terraformAddress: "   \t  " }),
    );
    searchParams = new URLSearchParams(`tab=terraform&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-terraform-not-mapped")).toBeInTheDocument();
    expect(screen.queryByText("Advisory Terraform mapping")).not.toBeInTheDocument();
    expect(screen.queryByText(/\s{3,}/)).not.toBeInTheDocument();
    expect(screen.queryByTestId("infra-resource-hub-terraform-open-workbench")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open drift workbench" })).toBeInTheDocument();
  });

  it("renders the same finding id in both operational and architecture review streams", async () => {
    const sharedFindingId = "shared-finding-id";
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          items: [
            {
              id: sharedFindingId,
              title: "Operational title for shared id",
              severity: "High",
              status: "Open",
              streamKind: "OperationalSecurity",
              streamLabel: "Operational security",
            },
          ],
        },
        architectureReviewFindings: {
          ...buildResourceHubTestMockHub().architectureReviewFindings,
          items: [
            {
              id: sharedFindingId,
              title: "Architecture title for shared id",
              severity: "Medium",
              status: "Open",
              streamKind: "ArchitectureReview",
              streamLabel: "Architecture review",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Operational title for shared id")).toBeInTheDocument();
    expect(screen.getByText("Architecture title for shared id")).toBeInTheDocument();
    expect(screen.getByTestId(`infra-resource-hub-create-remediation-${sharedFindingId}`)).toBeInTheDocument();
    expect(screen.getByTestId(`infra-resource-hub-architecture-finding-ask-${sharedFindingId}`)).toBeInTheDocument();
  });

  it("shows finding id omission copy on architecture review rows when finding id is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          items: [],
          totalCount: 0,
        },
        architectureReviewFindings: {
          ...buildResourceHubTestMockHub().architectureReviewFindings,
          items: [
            {
              id: "   ",
              title: "Architecture finding without id",
              severity: "Medium",
              status: "Open",
              streamKind: "ArchitectureReview",
              streamLabel: "Architecture review",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Architecture finding without id")).toBeInTheDocument();
    expect(screen.getByText("Finding id was not stored.")).toBeInTheDocument();
    expect(screen.queryByTestId(/^infra-resource-hub-architecture-finding-ask-/)).not.toBeInTheDocument();
  });

  it("uses trimmed architecture finding id on Ask handoff when id is padded", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...buildResourceHubTestMockHub().operationalSecurityFindings,
          items: [],
          totalCount: 0,
        },
        architectureReviewFindings: {
          ...buildResourceHubTestMockHub().architectureReviewFindings,
          items: [
            {
              id: "  arch-finding-padded  ",
              title: "Padded architecture finding",
              severity: "Low",
              status: "Open",
              streamKind: "ArchitectureReview",
              streamLabel: "Architecture review",
            },
          ],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=findings&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const askLink = await screen.findByTestId("infra-resource-hub-architecture-finding-ask-arch-finding-padded");
    expect(askLink).toHaveAttribute("href", expect.stringContaining("findingId=arch-finding-padded"));
    expect(askLink.getAttribute("href")).not.toMatch(/findingId=%20/);
  });

  it("omits terraform mapping from overview when address is absent", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({ terraformAddress: null, terraformGenerationMethod: null }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-open-remediation-work");
    expect(screen.queryByTestId("infra-resource-hub-open-terraform-work")).not.toBeInTheDocument();
  });

  it("shows evidence pointer kind omission copy when kind is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        evidencePointers: [{ kind: "   ", relativePath: "snapshots/222/properties.json" }],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Evidence pointer kind was not stored.")).toBeInTheDocument();
    expect(screen.getByText("snapshots/222/properties.json")).toBeInTheDocument();
  });

  it("shows evidence pointer path omission copy when relativePath is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        evidencePointers: [{ kind: "inventory", relativePath: "   " }],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Evidence pointer path was not stored.")).toBeInTheDocument();
    expect(screen.getByText("inventory")).toBeInTheDocument();
  });

  it("shows network relationship from omission copy when fromAzureResourceId is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        networkRelationships: [
          {
            relationshipType: "Peering",
            fromAzureResourceId: "   ",
            toAzureResourceId:
              "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-b-whitespace-from-test",
          },
        ],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Network relationship from resource was not stored.")).toBeInTheDocument();
    expect(screen.getByText(/vnet-b-whitespace-from-test/)).toBeInTheDocument();
  });

  it("shows network relationship to omission copy when toAzureResourceId is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        networkRelationships: [
          {
            relationshipType: "Peering",
            fromAzureResourceId:
              "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-a-whitespace-to-test",
            toAzureResourceId: "   ",
          },
        ],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Network relationship to resource was not stored.")).toBeInTheDocument();
    expect(screen.getByText(/vnet-a-whitespace-to-test/)).toBeInTheDocument();
  });

  it("shows network relationship type omission copy when relationshipType is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        networkRelationships: [
          {
            relationshipType: "   ",
            fromAzureResourceId:
              "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-a",
            toAzureResourceId:
              "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/virtualNetworks/vnet-b",
          },
        ],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Network relationship type was not stored.")).toBeInTheDocument();
  });

  it("shows RBAC principal omission copy when principalId is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        rbacAssignments: [
          {
            principalId: "   ",
            roleDefinitionId: "role-reader",
            scope: "/subscriptions/sub",
          },
        ],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("RBAC principal was not stored.")).toBeInTheDocument();
    expect(screen.getByText("role-reader")).toBeInTheDocument();
  });

  it("shows RBAC role omission copy when roleDefinitionId is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        rbacAssignments: [
          {
            principalId: "principal-1",
            roleDefinitionId: "   ",
            scope: "/subscriptions/sub",
          },
        ],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("RBAC role was not stored.")).toBeInTheDocument();
    expect(screen.getByText("principal-1")).toBeInTheDocument();
  });

  it("shows RBAC scope omission copy when a captured scope is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        rbacAssignments: [
          {
            principalId: "principal-1",
            roleDefinitionId: "role-reader",
            scope: "   ",
          },
        ],
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("RBAC scope was not stored.")).toBeInTheDocument();
    expect(screen.getByText("principal-1")).toBeInTheDocument();
  });

  it("shows tag key omission copy when a captured tag key is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          tags: {
            "   ": "prod-tag-value-for-whitespace-key",
          },
        },
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Tag key was not stored.")).toBeInTheDocument();
    expect(screen.getByText("prod-tag-value-for-whitespace-key")).toBeInTheDocument();
  });

  it("shows tag value omission copy when a captured tag value is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          tags: {
            costCenter: "   ",
          },
        },
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Tag value was not stored.")).toBeInTheDocument();
    expect(screen.getByText("costCenter")).toBeInTheDocument();
  });

  it("shows property key omission copy when a captured property key is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          properties: {
            "   ": "captured-property-value-for-whitespace-key",
          },
        },
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Property key was not stored.")).toBeInTheDocument();
    expect(screen.getByText("captured-property-value-for-whitespace-key")).toBeInTheDocument();
  });

  it("shows property value omission copy when a captured property value is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          properties: {
            skuName: "   ",
          },
        },
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Property value was not stored.")).toBeInTheDocument();
    expect(screen.getByText("skuName")).toBeInTheDocument();
  });

  it("shows resource type omission copy when resourceType is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          resourceType: "   ",
        },
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Resource type was not stored.")).toBeInTheDocument();
  });

  it("labels missing resource group and region with omission copy (P-13)", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        currentConfiguration: {
          ...buildResourceHubTestMockHub().currentConfiguration,
          resourceGroup: null,
          region: null,
        },
      }),
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByText("Resource group was not stored.")).toBeInTheDocument();
    expect(screen.getByText("Azure region was not stored.")).toBeInTheDocument();
  });

  it("shows default audit degraded copy when degradedReason is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          available: false,
          degradedReason: "   ",
          matches: [],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=audit&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(
      await screen.findByText("No audit evidence snapshot rows reference this cloud resource yet."),
    ).toBeInTheDocument();
    expect(screen.getByTestId("infra-resource-hub-audit-degraded")).toBeInTheDocument();
  });

  it("shows default audit degraded copy on overview when degradedReason is whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          available: false,
          degradedReason: "   ",
          matches: [],
        },
      }),
    );
    searchParams = new URLSearchParams(`tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}`);
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const banner = await screen.findByTestId("infra-resource-hub-overview-audit-unavailable");
    expect(banner).toHaveTextContent("No audit evidence snapshot rows reference this cloud resource yet.");
    expect(banner).not.toHaveTextContent("hub and workbench links stay resource-scoped only");
  });

  it("uses hub audit scope on overview remediation link when URL audit scope is unlinked", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    const remediationLink = screen.getByTestId("infra-resource-hub-open-remediation-work");
    expect(remediationLink).toHaveAttribute(
      "href",
      `/governance/infrastructure/remediation?cloudResourceId=${RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID}&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
    expect(remediationLink.getAttribute("href")).not.toContain("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
  });

  it("uses primary match audit scope on overview remediation when URL scope is unlinked and hub link ids are whitespace-only", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          assessmentId: "   ",
          auditEvidenceSnapshotId: "   ",
          controlId: "   ",
        },
      }),
    );
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee`,
    );
    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    const remediationLink = screen.getByTestId("infra-resource-hub-open-remediation-work");
    expect(remediationLink).toHaveAttribute(
      "href",
      `/governance/infrastructure/remediation?cloudResourceId=${RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID}&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
    expect(remediationLink.getAttribute("href")).not.toContain("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
  });

  it("surfaces stale audit banner when URL audit scope is not linked in hub matches", async () => {
    searchParams = new URLSearchParams(
      "tab=audit&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-stale-audit-scope")).toBeInTheDocument();
    expect(
      screen.queryByText("AE-10 chain of custody for AC-2 · Account management."),
    ).not.toBeInTheDocument();
  });

  it("clears unlinked audit scope from stale banner Open audit tab link", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee`,
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    const banner = await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    const auditTabLink = within(banner).getByRole("link", { name: "Open audit tab" });

    expect(auditTabLink.getAttribute("href")).not.toContain("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    expect(auditTabLink.getAttribute("href")).toContain("controlId=cccccccc-cccc-cccc-cccc-cccccccccccc");
  });

  it("hides audit scope chip when URL audit scope is unlinked in hub matches", async () => {
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee`,
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    expect(screen.queryByTestId("infra-resource-hub-audit-scope-chip")).not.toBeInTheDocument();
  });

  it("refetches hub evidence when linked audit control in the URL changes", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async (_id, options) => {
      const hub = buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          matches: [
            buildResourceHubTestMockHub().auditLineageLink.matches[0],
            {
              assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
              auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
              controlId: "dddddddd-dddd-dddd-dddd-dddddddddddd",
              controlNumber: "AC-9",
              controlTitle: "Alternate control",
              snapshotCreatedUtc: "2026-01-02T00:00:00Z",
            },
          ],
        },
      });
      const controlId = (options as { controlId?: string }).controlId ?? "";
      const totalCount =
        controlId === "dddddddd-dddd-dddd-dddd-dddddddddddd"
          ? 9
          : controlId === "cccccccc-cccc-cccc-cccc-cccccccccccc"
            ? 5
            : 99;

      return buildResourceHubTestMockHub({
        auditLineageLink: hub.auditLineageLink,
        operationalSecurityFindings: {
          ...hub.operationalSecurityFindings,
          totalCount,
        },
        architectureReviewFindings: {
          ...hub.architectureReviewFindings,
          totalCount: 0,
        },
      });
    });
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );
    const { rerender } = render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-tab-findings")).toHaveTextContent("Findings (5)");

    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=dddddddd-dddd-dddd-dddd-dddddddddddd`,
    );
    rerender(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await waitFor(() => {
      expect(screen.getByTestId("infra-resource-hub-tab-findings")).toHaveTextContent("Findings (9)");
    });
  });

  it("presents audit-scoped hub counts when URL carries linked audit scope", async () => {
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async (_id, options) => {
      const hub = buildResourceHubTestMockHub();
      const scoped = (options as { controlId?: string }).controlId?.length ?? 0 > 0;
      const totalCount = scoped ? 5 : 99;

      return buildResourceHubTestMockHub({
        operationalSecurityFindings: {
          ...hub.operationalSecurityFindings,
          totalCount,
        },
        architectureReviewFindings: {
          ...hub.architectureReviewFindings,
          totalCount: 0,
        },
      });
    });
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    expect(await screen.findByTestId("infra-resource-hub-tab-findings")).toHaveTextContent("Findings (5)");
    expect(screen.queryByText("Findings (99)")).not.toBeInTheDocument();
  });

  it("omits URL audit scope from hub fetch when audit lineage is unavailable", async () => {
    fetchCachedInfraEvidenceResourceHub.mockClear();
    fetchCachedInfraEvidenceResourceHub.mockImplementation(async () =>
      buildResourceHubTestMockHub({
        auditLineageLink: {
          ...buildResourceHubTestMockHub().auditLineageLink,
          available: false,
          degradedReason: "No rows",
          matches: [],
        },
      }),
    );
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}${RESOURCE_HUB_TEST_AUDIT_SUFFIX}`,
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-overview-audit-unavailable");
    for (const call of fetchCachedInfraEvidenceResourceHub.mock.calls) {
      const options = call[1] as {
        assessmentId?: string;
        auditEvidenceSnapshotId?: string;
        controlId?: string;
      };

      expect(options.assessmentId ?? "").toBe("");
      expect(options.auditEvidenceSnapshotId ?? "").toBe("");
      expect(options.controlId ?? "").toBe("");
    }
  });

  it("never passes unlinked URL audit controlId to hub fetch", async () => {
    fetchCachedInfraEvidenceResourceHub.mockClear();
    searchParams = new URLSearchParams(
      `tab=overview&snapshotId=${RESOURCE_HUB_TEST_SNAPSHOT_ID}&assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa&auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb&controlId=eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee`,
    );

    render(<ResourceHubClient cloudResourceId={RESOURCE_HUB_TEST_CLOUD_RESOURCE_ID} />);

    await screen.findByTestId("infra-resource-hub-stale-audit-scope");
    for (const call of fetchCachedInfraEvidenceResourceHub.mock.calls) {
      const options = call[1] as { controlId?: string };

      expect(options.controlId).not.toBe("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
    }
  });

});
