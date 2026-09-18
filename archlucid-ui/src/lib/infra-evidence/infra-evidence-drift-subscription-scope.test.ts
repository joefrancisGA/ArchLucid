import { describe, expect, it } from "vitest";

import type { InfraEvidenceDiffSummary, InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import {
  infraEvidenceSnapshotsShareSubscription,
  resolveInfraEvidenceDiffOtherSnapshot,
  resolveInfraEvidenceDiffOtherSnapshotId,
  resolveInfraEvidenceSnapshotSubscriptionLabel,
} from "@/lib/infra-evidence/infra-evidence-drift-subscription-scope";

function snapshot(overrides: Partial<InfraEvidenceSnapshotSummary> = {}): InfraEvidenceSnapshotSummary {
  return {
    snapshotId: "11111111-1111-1111-1111-111111111111",
    subscriptionId: "sub-prod",
    subscriptionName: "Prod",
    capturedUtc: "2026-09-01T12:00:00Z",
    captureStatus: 1,
    resourceCount: 10,
    relationshipCount: 2,
    ...overrides,
  };
}

function diff(overrides: Partial<InfraEvidenceDiffSummary> = {}): InfraEvidenceDiffSummary {
  return {
    diffId: "diff-1",
    snapshotAId: "11111111-1111-1111-1111-111111111111",
    snapshotBId: "22222222-2222-2222-2222-222222222222",
    subscriptionId: "sub-prod",
    totalChanges: 1,
    resourceAddedCount: 0,
    resourceRemovedCount: 0,
    resourceModifiedCount: 1,
    createdUtc: "2026-09-02T12:00:00Z",
    ...overrides,
  };
}

describe("infra-evidence-drift-subscription-scope", () => {
  it("treats matching subscription ids as the same scope regardless of casing", () => {
    expect(
      infraEvidenceSnapshotsShareSubscription(
        snapshot({ subscriptionId: "SUB-PROD" }),
        snapshot({ subscriptionId: "sub-prod", snapshotId: "22222222-2222-2222-2222-222222222222" }),
      ),
    ).toBe(true);
  });

  it("detects different subscriptions", () => {
    expect(
      infraEvidenceSnapshotsShareSubscription(
        snapshot(),
        snapshot({ subscriptionId: "sub-dev", subscriptionName: "Dev", snapshotId: "22222222-2222-2222-2222-222222222222" }),
      ),
    ).toBe(false);
  });

  it("skips mismatch checks when either subscription id is missing", () => {
    expect(
      infraEvidenceSnapshotsShareSubscription(snapshot(), snapshot({ subscriptionId: null, snapshotId: "22222222-2222-2222-2222-222222222222" })),
    ).toBe(true);
  });

  it("resolves the other snapshot in a diff pair", () => {
    const current = snapshot();
    const other = snapshot({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      subscriptionName: "Dev",
      subscriptionId: "sub-dev",
    });

    expect(resolveInfraEvidenceDiffOtherSnapshotId(diff(), current.snapshotId)).toBe(other.snapshotId);
    expect(resolveInfraEvidenceDiffOtherSnapshot(diff(), current.snapshotId, [current, other])).toEqual(other);
  });

  it("formats subscription labels for dialog copy", () => {
    expect(resolveInfraEvidenceSnapshotSubscriptionLabel(snapshot())).toBe("Prod");
    expect(resolveInfraEvidenceSnapshotSubscriptionLabel(snapshot({ subscriptionName: null, subscriptionId: "sub-prod" }))).toBe(
      "sub-prod",
    );
    expect(resolveInfraEvidenceSnapshotSubscriptionLabel(snapshot({ subscriptionName: null, subscriptionId: null }))).toBe(
      "Unknown subscription",
    );
  });
});
