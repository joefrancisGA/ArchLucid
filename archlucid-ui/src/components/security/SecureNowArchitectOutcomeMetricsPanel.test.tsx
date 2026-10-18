import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { useCallback, useState } from "react";
import { describe, expect, it, vi } from "vitest";

import {
  SecureNowArchitectOutcomeMetricsPanel,
  type SecureNowArchitectOutcomeQueryState,
} from "@/components/security/SecureNowArchitectOutcomeMetricsPanel";
import {
  SECURENOW_ARCHITECT_METRICS_CRITICAL_PATHS_REMOVED,
  SECURENOW_ARCHITECT_METRICS_TITLE,
} from "@/lib/product-line/securenow-architect-metrics-copy";

vi.mock("@/hooks/use-infra-evidence-snapshots-query", () => ({
  useInfraEvidenceSnapshotsQuery: vi.fn(),
}));

vi.mock("@/hooks/use-securenow-architect-metrics-query", () => ({
  useSecureNowArchitectOutcomeMetricsQuery: vi.fn(),
}));

import { useInfraEvidenceSnapshotsQuery } from "@/hooks/use-infra-evidence-snapshots-query";
import { useSecureNowArchitectOutcomeMetricsQuery } from "@/hooks/use-securenow-architect-metrics-query";

function renderPanel(
  props: Partial<React.ComponentProps<typeof SecureNowArchitectOutcomeMetricsPanel>> = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <SecureNowArchitectOutcomeMetricsPanel
        fromSnapshotId={null}
        toSnapshotId={null}
        hasUrlSnapshotPair={false}
        onSnapshotPairChange={vi.fn()}
        {...props}
      />
    </QueryClientProvider>,
  );
}

describe("SecureNowArchitectOutcomeMetricsPanel", () => {
  it("shows compact empty copy when fewer than two snapshots exist", () => {
    vi.mocked(useInfraEvidenceSnapshotsQuery).mockReturnValue({
      data: {
        items: [
          {
            snapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-02T00:00:00Z",
            captureStatus: 1,
            resourceCount: 10,
            relationshipCount: 5,
          },
        ],
        totalCount: 1,
        page: 1,
        pageSize: 25,
        hasMore: false,
      },
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    } as ReturnType<typeof useInfraEvidenceSnapshotsQuery>);
    vi.mocked(useSecureNowArchitectOutcomeMetricsQuery).mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: 0,
      refetch: vi.fn(),
    } as ReturnType<typeof useSecureNowArchitectOutcomeMetricsQuery>);

    renderPanel({
      snapshotsEmptyPreset: {
        title: "Snapshot comparison unavailable",
        description: "Need two snapshots",
        testId: "securenow-architect-snapshots-empty",
      },
    });

    expect(screen.getByText(SECURENOW_ARCHITECT_METRICS_TITLE)).toBeInTheDocument();
    expect(screen.getByTestId("securenow-architect-snapshots-empty")).toBeInTheDocument();
  });

  it("renders signed architect outcome metrics for a snapshot pair", () => {
    vi.mocked(useInfraEvidenceSnapshotsQuery).mockReturnValue({
      data: {
        items: [
          {
            snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-02T00:00:00Z",
            captureStatus: 1,
            resourceCount: 12,
            relationshipCount: 6,
          },
          {
            snapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-01T00:00:00Z",
            captureStatus: 1,
            resourceCount: 10,
            relationshipCount: 5,
          },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 25,
        hasMore: false,
      },
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    } as ReturnType<typeof useInfraEvidenceSnapshotsQuery>);
    vi.mocked(useSecureNowArchitectOutcomeMetricsQuery).mockReturnValue({
      data: {
        fromSnapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        toSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        ruleVersion: "SA11-metrics-v1",
        criticalOrHighConfidencePathsRemoved: 3,
        privilegedIdentityNodesOnPathsReduced: 2,
        unrestrictedEgressCapabilityPathsReduced: 1,
        assertedCrownJewelExposurePathsRemoved: 1,
        sharedControlBlastRadiusPathsRemoved: 0,
        exceptionsExpired: 4,
        remediationRecurrenceCount: 1,
        supportingOperationalMetrics: { openFindings: 7 },
      },
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    } as ReturnType<typeof useSecureNowArchitectOutcomeMetricsQuery>);

    renderPanel({
      fromSnapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      toSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      hasUrlSnapshotPair: true,
    });

    expect(screen.getByTestId("securenow-architect-metrics-snapshot-baseline")).toHaveTextContent(
      "From is the baseline. To is the snapshot you compare against.",
    );
    expect(screen.getByTestId("securenow-architect-outcome-metrics-grid")).toBeInTheDocument();
    expect(screen.getByText(SECURENOW_ARCHITECT_METRICS_CRITICAL_PATHS_REMOVED)).toBeInTheDocument();
    expect(screen.getByTestId("securenow-architect-metric-Critical/high paths removed")).toHaveTextContent("+3");
    expect(screen.getByTestId("securenow-architect-metrics-provenance")).toBeInTheDocument();
    expect(
      screen.getByText(
        /These snapshot-comparison headline numbers were calculated with the SA-11 architect metrics specification, version 1\./,
      ),
    ).toBeInTheDocument();
  });

  it("auto-requests compare when a complete snapshot pair is restored from URL state", () => {
    const metricsMock = vi.mocked(useSecureNowArchitectOutcomeMetricsQuery);

    vi.mocked(useInfraEvidenceSnapshotsQuery).mockReturnValue({
      data: {
        items: [
          {
            snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-02T00:00:00Z",
            captureStatus: 1,
            resourceCount: 12,
            relationshipCount: 6,
          },
          {
            snapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-01T00:00:00Z",
            captureStatus: 1,
            resourceCount: 10,
            relationshipCount: 5,
          },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 25,
        hasMore: false,
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useInfraEvidenceSnapshotsQuery>);

    metricsMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: true,
    } as ReturnType<typeof useSecureNowArchitectOutcomeMetricsQuery>);

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SecureNowArchitectOutcomeMetricsPanel
          fromSnapshotId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
          toSnapshotId="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
          onSnapshotPairChange={vi.fn()}
        />
      </QueryClientProvider>,
    );

    expect(metricsMock).toHaveBeenCalledWith(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      true,
    );
  });

  it("does not auto-compare after the operator changes a snapshot until Compare is pressed", () => {
    const metricsMock = vi.mocked(useSecureNowArchitectOutcomeMetricsQuery);

    vi.mocked(useInfraEvidenceSnapshotsQuery).mockReturnValue({
      data: {
        items: [
          {
            snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-02T00:00:00Z",
            captureStatus: 1,
            resourceCount: 12,
            relationshipCount: 6,
          },
          {
            snapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
            subscriptionId: "sub-1",
            subscriptionName: "Contoso",
            capturedUtc: "2026-01-01T00:00:00Z",
            captureStatus: 1,
            resourceCount: 10,
            relationshipCount: 5,
          },
        ],
        totalCount: 2,
        page: 1,
        pageSize: 25,
        hasMore: false,
      },
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useInfraEvidenceSnapshotsQuery>);

    metricsMock.mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
    } as ReturnType<typeof useSecureNowArchitectOutcomeMetricsQuery>);

    const onSnapshotPairChange = vi.fn();
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <SecureNowArchitectOutcomeMetricsPanel
          fromSnapshotId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
          toSnapshotId="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
          onSnapshotPairChange={onSnapshotPairChange}
        />
      </QueryClientProvider>,
    );

    metricsMock.mockClear();

    fireEvent.change(screen.getByTestId("securenow-architect-metrics-from-snapshot"), {
      target: { value: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb" },
    });

    expect(onSnapshotPairChange).toHaveBeenCalled();
    expect(metricsMock).toHaveBeenLastCalledWith(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
      false,
    );
  });

  it("does not exceed update depth when query hooks return new result objects each render", () => {
    const snapshotItems = [
      {
        snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        subscriptionId: "sub-1",
        subscriptionName: "Contoso",
        capturedUtc: "2026-01-02T00:00:00Z",
        captureStatus: 1,
        resourceCount: 12,
        relationshipCount: 6,
      },
      {
        snapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        subscriptionId: "sub-1",
        subscriptionName: "Contoso",
        capturedUtc: "2026-01-01T00:00:00Z",
        captureStatus: 1,
        resourceCount: 10,
        relationshipCount: 5,
      },
    ];
    const snapshotsRefetch = vi.fn();
    const metricsRefetch = vi.fn();
    const stableUpdatedAt = 1_700_000_000_000;

    vi.mocked(useInfraEvidenceSnapshotsQuery).mockImplementation(
      () =>
        ({
          data: {
            items: snapshotItems,
            totalCount: 2,
            page: 1,
            pageSize: 25,
            hasMore: false,
          },
          isError: false,
          isLoading: false,
          isFetching: false,
          dataUpdatedAt: stableUpdatedAt,
          refetch: snapshotsRefetch,
        }) as ReturnType<typeof useInfraEvidenceSnapshotsQuery>,
    );
    vi.mocked(useSecureNowArchitectOutcomeMetricsQuery).mockImplementation(
      () =>
        ({
          data: undefined,
          isError: false,
          isLoading: false,
          isFetching: false,
          dataUpdatedAt: stableUpdatedAt,
          refetch: metricsRefetch,
        }) as ReturnType<typeof useSecureNowArchitectOutcomeMetricsQuery>,
    );

    let queryStateUpdateCount = 0;

    function Harness() {
      const [, setOutcomeQueryState] = useState<SecureNowArchitectOutcomeQueryState | null>(null);

      const onQueryStateChange = useCallback((state: SecureNowArchitectOutcomeQueryState) => {
        queryStateUpdateCount += 1;
        setOutcomeQueryState(state);
      }, []);

      return (
        <SecureNowArchitectOutcomeMetricsPanel
          fromSnapshotId="aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"
          toSnapshotId="bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"
          hasUrlSnapshotPair={true}
          onSnapshotPairChange={vi.fn()}
          onQueryStateChange={onQueryStateChange}
        />
      );
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    );

    expect(screen.getByText(SECURENOW_ARCHITECT_METRICS_TITLE)).toBeInTheDocument();
    expect(queryStateUpdateCount).toBeLessThanOrEqual(2);
  });

  it("writes the default controlled snapshot pair only once when the callback identity changes", () => {
    const snapshotItems = [
      {
        snapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        subscriptionId: "sub-1",
        subscriptionName: "Contoso",
        capturedUtc: "2026-01-02T00:00:00Z",
        captureStatus: 1,
        resourceCount: 12,
        relationshipCount: 6,
      },
      {
        snapshotId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        subscriptionId: "sub-1",
        subscriptionName: "Contoso",
        capturedUtc: "2026-01-01T00:00:00Z",
        captureStatus: 1,
        resourceCount: 10,
        relationshipCount: 5,
      },
    ];

    vi.mocked(useInfraEvidenceSnapshotsQuery).mockReturnValue({
      data: {
        items: snapshotItems,
        totalCount: 2,
        page: 1,
        pageSize: 25,
        hasMore: false,
      },
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: Date.now(),
      refetch: vi.fn(),
    } as ReturnType<typeof useInfraEvidenceSnapshotsQuery>);
    vi.mocked(useSecureNowArchitectOutcomeMetricsQuery).mockReturnValue({
      data: undefined,
      isError: false,
      isLoading: false,
      isFetching: false,
      dataUpdatedAt: 0,
      refetch: vi.fn(),
    } as ReturnType<typeof useSecureNowArchitectOutcomeMetricsQuery>);

    let pairChangeCount = 0;

    function Harness() {
      const [pair, setPair] = useState<{ readonly fromSnapshotId: string; readonly toSnapshotId: string } | null>(
        null,
      );

      const onSnapshotPairChange = useCallback(
        (nextPair: { readonly fromSnapshotId: string; readonly toSnapshotId: string }) => {
          pairChangeCount += 1;
          setPair(nextPair);
        },
        [pair?.fromSnapshotId, pair?.toSnapshotId],
      );

      return (
        <SecureNowArchitectOutcomeMetricsPanel
          fromSnapshotId={pair?.fromSnapshotId ?? null}
          toSnapshotId={pair?.toSnapshotId ?? null}
          hasUrlSnapshotPair={false}
          onSnapshotPairChange={onSnapshotPairChange}
        />
      );
    }

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <Harness />
      </QueryClientProvider>,
    );

    expect(pairChangeCount).toBe(1);
    expect(screen.getByTestId("securenow-architect-metrics-from-snapshot")).toHaveValue(
      "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    );
    expect(screen.getByTestId("securenow-architect-metrics-to-snapshot")).toHaveValue(
      "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    );
  });
});
