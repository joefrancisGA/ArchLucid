import { describe, expect, it } from "vitest";

import {
  formatInfraEvidenceDiffLabel,
  formatInfraEvidenceScopeFreshnessLine,
  formatInfraEvidenceSnapshotCapturedLabel,
  formatInfraEvidenceSnapshotFreshness,
  formatInfraEvidenceSnapshotLabel,
  formatInfraEvidenceSubscriptionLabel,
} from "@/lib/infra-evidence/format-infra-evidence-snapshot-label";
import type { InfraEvidenceDiffSummary, InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";

function snapshot(overrides: Partial<InfraEvidenceSnapshotSummary> = {}): InfraEvidenceSnapshotSummary {
  return {
    snapshotId: "11111111-1111-1111-1111-111111111111",
    subscriptionId: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
    subscriptionName: "Prod",
    capturedUtc: "2026-09-08T22:44:27Z",
    captureStatus: 1,
    resourceCount: 61,
    relationshipCount: 10,
    ...overrides,
  };
}

function diff(overrides: Partial<InfraEvidenceDiffSummary> = {}): InfraEvidenceDiffSummary {
  return {
    diffId: "bd238e39-c859-450d-bfcc-1ab6758ff463",
    snapshotAId: "11111111-1111-1111-1111-111111111111",
    snapshotBId: "22222222-2222-2222-2222-222222222222",
    subscriptionId: "8aa56f3b-18bc-43ca-ad45-bad9e811d33b",
    totalChanges: 23,
    resourceAddedCount: 1,
    resourceRemovedCount: 0,
    resourceModifiedCount: 22,
    createdUtc: "2026-09-08T23:01:56Z",
    ...overrides,
  };
}

describe("formatInfraEvidenceSnapshotLabel", () => {
  it("prefers a human subscription name over ids", () => {
    expect(formatInfraEvidenceSnapshotLabel(snapshot())).toContain("Prod");
    expect(formatInfraEvidenceSnapshotLabel(snapshot())).toContain("61 resources");
    expect(formatInfraEvidenceSnapshotLabel(snapshot())).not.toContain("11111111-1111-1111-1111-111111111111");
    expect(formatInfraEvidenceSnapshotLabel(snapshot())).not.toContain("8aa56f3b-18bc-43ca-ad45-bad9e811d33b");
  });

  it("omits UUID subscription ids when no name is available", () => {
    const unlabeled = snapshot({ subscriptionName: null });

    expect(formatInfraEvidenceSnapshotLabel(unlabeled)).not.toContain("8aa56f3b-18bc-43ca-ad45-bad9e811d33b");
    expect(formatInfraEvidenceSnapshotLabel(unlabeled)).toContain("61 resources");
  });
});

describe("formatInfraEvidenceSubscriptionLabel", () => {
  it("returns null for UUID-only subscription identity", () => {
    expect(formatInfraEvidenceSubscriptionLabel(null, "8aa56f3b-18bc-43ca-ad45-bad9e811d33b")).toBeNull();
    expect(formatInfraEvidenceSubscriptionLabel("   ", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBeNull();
  });

  it("keeps a non-UUID subscription id", () => {
    expect(formatInfraEvidenceSubscriptionLabel(null, "prod-sub")).toBe("prod-sub");
  });
});

describe("formatInfraEvidenceSnapshotCapturedLabel", () => {
  it("returns a fallback when capture time is missing", () => {
    expect(formatInfraEvidenceSnapshotCapturedLabel(null)).toBe("unknown time");
    expect(formatInfraEvidenceSnapshotCapturedLabel("  ")).toBe("unknown time");
  });
});

describe("formatInfraEvidenceDiffLabel", () => {
  it("compares against the other snapshot capture time instead of a truncated id", () => {
    const current = snapshot();
    const other = snapshot({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      capturedUtc: "2026-09-08T23:01:56Z",
    });

    expect(formatInfraEvidenceDiffLabel(diff(), current.snapshotId, [current, other])).toBe(
      `23 changes vs ${formatInfraEvidenceSnapshotCapturedLabel(other.capturedUtc)}`,
    );
    expect(formatInfraEvidenceDiffLabel(diff(), current.snapshotId, [current, other])).not.toContain("22222222");
  });

  it("falls back to the diff created time when the other snapshot is not loaded", () => {
    const current = snapshot();

    expect(formatInfraEvidenceDiffLabel(diff(), current.snapshotId, [current])).toBe(
      `23 changes vs ${formatInfraEvidenceSnapshotCapturedLabel("2026-09-08T23:01:56Z")}`,
    );
  });
});

describe("formatInfraEvidenceScopeFreshnessLine", () => {
  it("summarizes capture freshness and change count without ids", () => {
    const line = formatInfraEvidenceScopeFreshnessLine({
      snapshot: snapshot(),
      selectedDiff: diff(),
    });

    expect(line).toBe(`${formatInfraEvidenceSnapshotFreshness(snapshot())} · 23 changes`);
    expect(line).not.toContain("bd238e39");
    expect(line).not.toContain("11111111-1111-1111-1111-111111111111");
  });

  it("returns null when neither snapshot nor diff is selected", () => {
    expect(formatInfraEvidenceScopeFreshnessLine({ snapshot: null, selectedDiff: null })).toBeNull();
  });
});
