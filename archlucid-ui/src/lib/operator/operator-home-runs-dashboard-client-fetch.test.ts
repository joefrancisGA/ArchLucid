import { describe, expect, it } from "vitest";

import type { OperatorHomeRunsDashboardModel } from "@/app/(operator)/_sections/operator-home-runs-dashboard-model";

import {
  isOperatorHomeRunsDashboardServerSnapshotFresh,
  resolveRunsDashboardClientLoadMode,
  shouldShowRunsDashboardInitialSkeleton,
  shouldSkipRunsDashboardClientFetchOnMount,
} from "@/lib/operator/operator-home-runs-dashboard-client-fetch";

function buildModel(
  overrides: Partial<OperatorHomeRunsDashboardModel> = {},
): OperatorHomeRunsDashboardModel {
  return {
    projectId: "default",
    page: 1,
    pageSize: 5,
    items: [],
    totalCount: 0,
    loadFailure: null,
    malformedMessage: null,
    usedStaticRunsFallback: false,
    buyerPolishedShell: true,
    ...overrides,
  };
}

describe("isOperatorHomeRunsDashboardServerSnapshotFresh", () => {
  it("accepts a successful empty server snapshot", () => {
    expect(
      isOperatorHomeRunsDashboardServerSnapshotFresh(
        buildModel({ scopeQueryKeySnapshot: "tenant-a:workspace-a:default" }),
        "default",
        "tenant-a:workspace-a:default",
      ),
    ).toBe(true);
  });

  it("accepts a successful populated server snapshot", () => {
    const model = buildModel({
      scopeQueryKeySnapshot: "tenant-a:workspace-a:default",
      items: [
        {
          runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00Z",
          hasGoldenManifest: true,
        },
      ],
      totalCount: 1,
    });

    expect(
      isOperatorHomeRunsDashboardServerSnapshotFresh(model, "default", "tenant-a:workspace-a:default"),
    ).toBe(true);
  });

  it("rejects SSR snapshot when scopeQueryKeySnapshot is missing", () => {
    const model = buildModel({
      items: [
        {
          runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00Z",
          hasGoldenManifest: true,
        },
      ],
      totalCount: 1,
    });

    expect(
      isOperatorHomeRunsDashboardServerSnapshotFresh(model, "default", "tenant-a:workspace-a:default"),
    ).toBe(false);
    expect(
      shouldSkipRunsDashboardClientFetchOnMount(model, "default", "tenant-a:workspace-a:default"),
    ).toBe(false);
  });

  it("rejects missing, mismatched, or failed snapshots", () => {
    expect(isOperatorHomeRunsDashboardServerSnapshotFresh(null, "default", "tenant-a:workspace-a:default")).toBe(
      false,
    );
    expect(
      isOperatorHomeRunsDashboardServerSnapshotFresh(buildModel({ projectId: "other" }), "default", ""),
    ).toBe(false);
    expect(
      isOperatorHomeRunsDashboardServerSnapshotFresh(
        buildModel({
          scopeQueryKeySnapshot: "tenant-a:workspace-a:default",
          loadFailure: {
            message: "fail",
            problem: null,
            correlationId: null,
            httpStatus: null,
            retryAfterSeconds: null,
          },
        }),
        "default",
        "tenant-a:workspace-a:default",
      ),
    ).toBe(false);
    expect(
      isOperatorHomeRunsDashboardServerSnapshotFresh(
        buildModel({ malformedMessage: "bad payload" }),
        "default",
        "tenant-a:workspace-a:default",
      ),
    ).toBe(false);
  });

  it("rejects SSR snapshot when tenant scope changed but project id matches", () => {
    const model = buildModel({
      scopeQueryKeySnapshot: "tenant-a:workspace-a:default",
      items: [
        {
          runId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          projectId: "default",
          createdUtc: "2026-01-01T00:00:00Z",
          hasGoldenManifest: true,
        },
      ],
      totalCount: 1,
    });

    expect(
      isOperatorHomeRunsDashboardServerSnapshotFresh(model, "default", "tenant-b:workspace-b:default"),
    ).toBe(false);
  });
});

describe("shouldSkipRunsDashboardClientFetchOnMount", () => {
  it("skips when the server snapshot is fresh", () => {
    expect(
      shouldSkipRunsDashboardClientFetchOnMount(
        buildModel({ scopeQueryKeySnapshot: "tenant-a:workspace-a:default" }),
        "default",
        "tenant-a:workspace-a:default",
      ),
    ).toBe(true);
    expect(shouldSkipRunsDashboardClientFetchOnMount(null, "default", "tenant-a:workspace-a:default")).toBe(
      false,
    );
  });

  it("does not skip when scope changed after SSR", () => {
    expect(
      shouldSkipRunsDashboardClientFetchOnMount(
        buildModel({ scopeQueryKeySnapshot: "tenant-a:workspace-a:default" }),
        "default",
        "tenant-b:workspace-b:default",
      ),
    ).toBe(false);
  });
});

describe("resolveRunsDashboardClientLoadMode", () => {
  it("uses background mode when rows are already painted", () => {
    expect(resolveRunsDashboardClientLoadMode(2)).toBe("background");
  });

  it("uses initial mode only for a true cold start", () => {
    expect(resolveRunsDashboardClientLoadMode(0)).toBe("initial");
  });
});

describe("shouldShowRunsDashboardInitialSkeleton", () => {
  it("shows skeleton only during initial loading with no painted rows", () => {
    expect(shouldShowRunsDashboardInitialSkeleton("loading", 0)).toBe(true);
    expect(shouldShowRunsDashboardInitialSkeleton("loading", 2)).toBe(false);
    expect(shouldShowRunsDashboardInitialSkeleton("ready", 0)).toBe(false);
  });
});
