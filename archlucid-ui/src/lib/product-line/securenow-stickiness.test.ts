import { beforeEach, describe, expect, it } from "vitest";

import { writeSecureNowPilotDisposition } from "@/lib/product-line/securenow-pilot-disposition-storage";

import {
  buildSecureNowReturnHomeRows,
  markSecureNowReturnHomeRecommendedFirst,
  countRemediationInstancesAwaitingVerification,
  countSecureNowExtendDispositionsInBrowserCache,
  formatSecureNowCapturePathDeltaCounts,
  readSecureNowPinnedPathId,
  resolveSecureNowPinnedPathStatus,
  secureNowPathInspectHref,
  writeSecureNowPinnedPathId,
} from "./securenow-stickiness";

describe("securenow stickiness", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("formats counts and path inspect links", () => {
    expect(
      formatSecureNowCapturePathDeltaCounts({
        added: ["a"],
        gone: [],
        unchanged: ["b", "c"],
      }),
    ).toBe("1 added, 0 gone, 2 unchanged");
    expect(secureNowPathInspectHref("path a")).toBe(
      "/security/remediation-factory?pathId=path%20a",
    );
  });

  it("counts instances that still lack verification", () => {
    expect(
      countRemediationInstancesAwaitingVerification([
        { status: "ChangeImplemented", verificationSnapshotId: null },
        { status: "Verified", verificationSnapshotId: "snap-2" },
        { status: "Closed", verificationSnapshotId: null },
      ]),
    ).toBe(1);
  });

  it("classifies one watched path against the two latest captures", () => {
    expect(resolveSecureNowPinnedPathStatus("shared", ["shared", "added"], ["shared", "gone"])).toBe(
      "unchanged",
    );
    expect(resolveSecureNowPinnedPathStatus("gone", ["shared"], ["shared", "gone"])).toBe("gone");
    expect(resolveSecureNowPinnedPathStatus("missing", ["shared"], ["shared"])).toBe("not-in-latest");
  });

  it("stores one pinned path per workspace and counts Extend cache rows", () => {
    const scope = { tenantId: "tenant-1", workspaceId: "ws-1" };
    writeSecureNowPinnedPathId(scope, "path-1");
    writeSecureNowPinnedPathId(scope, "path-2");
    writeSecureNowPilotDisposition("path-2", { outcome: "Extend", rationale: "Need a later capture." });

    expect(readSecureNowPinnedPathId(scope)).toBe("path-2");
    expect(countSecureNowExtendDispositionsInBrowserCache()).toBe(1);
  });

  it("surfaces the latest capture when Home has not recorded a last-opened snapshot", () => {
    expect(
      buildSecureNowReturnHomeRows({
        awaitingVerificationCount: 0,
        addedCount: 0,
        goneCount: 0,
        latestSnapshotId: "snap-1",
        lastOpenedSnapshotId: null,
        pinnedPathId: null,
        pinnedPathStatus: null,
        extendDispositionCount: 0,
      }),
    ).toEqual([
      {
        href: "/infrastructure/snapshots-drift?snapshotId=snap-1",
        label: "Latest capture on this workspace",
        summary:
          "Snapshot snap-1. This is not a usage claim. Do this next: open this capture in Changes and drift.",
      },
    ]);
  });

  it("omits return rows when nothing is unfinished and no capture exists", () => {
    expect(
      buildSecureNowReturnHomeRows({
        awaitingVerificationCount: 0,
        addedCount: 0,
        goneCount: 0,
        latestSnapshotId: null,
        lastOpenedSnapshotId: null,
        pinnedPathId: null,
        pinnedPathStatus: null,
        extendDispositionCount: 0,
      }),
    ).toEqual([]);
  });

  it("includes a return row only for open work", () => {
    const rows = buildSecureNowReturnHomeRows({
      awaitingVerificationCount: 2,
      addedCount: 1,
      goneCount: 0,
      latestSnapshotId: "snap-2",
      lastOpenedSnapshotId: "snap-1",
      pinnedPathId: "path-1",
      pinnedPathStatus: "gone",
      extendDispositionCount: 0,
    });

    expect(rows.map((row) => row.label)).toEqual([
      "Awaiting verification",
      "Recent changes",
      "Last opened snapshot",
      "New capture since you last opened Home",
      "Watched path",
    ]);
    expect(rows.find((row) => row.label === "Last opened snapshot")?.href).toBe(
      "/infrastructure/snapshots-drift?snapshotId=snap-1",
    );
  });

  it("keeps the last opened snapshot when it is also the latest capture", () => {
    const rows = buildSecureNowReturnHomeRows({
      awaitingVerificationCount: 0,
      addedCount: 0,
      goneCount: 0,
      latestSnapshotId: "snap-1",
      lastOpenedSnapshotId: "snap-1",
      pinnedPathId: null,
      pinnedPathStatus: null,
      extendDispositionCount: 0,
    });

    expect(rows).toEqual([
      {
        href: "/infrastructure/snapshots-drift?snapshotId=snap-1",
        label: "Last opened snapshot",
        summary: "Snapshot snap-1. This is not a usage claim. Do this next: reopen this capture.",
      },
    ]);
  });

  it("marks the row that matches Home collection next step as recommended first", () => {
    const rows = buildSecureNowReturnHomeRows({
      awaitingVerificationCount: 0,
      addedCount: 0,
      goneCount: 0,
      latestSnapshotId: "snap-9",
      lastOpenedSnapshotId: null,
      pinnedPathId: null,
      pinnedPathStatus: null,
      extendDispositionCount: 0,
    });

    const marked = markSecureNowReturnHomeRecommendedFirst(rows, "/infrastructure/snapshots-drift?snapshotId=snap-9");

    expect(marked[0]?.recommendedFirst).toBe(true);
  });
});
