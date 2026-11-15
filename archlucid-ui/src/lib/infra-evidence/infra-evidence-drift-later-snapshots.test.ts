import { afterEach, describe, expect, it, vi } from "vitest";

import type { InfraEvidenceSnapshotSummary } from "@/lib/infra-evidence/infra-evidence-drift-types";
import { partitionInfraEvidenceLaterSnapshotsForAnchor } from "@/lib/infra-evidence/infra-evidence-drift-later-snapshots";

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

describe("partitionInfraEvidenceLaterSnapshotsForAnchor", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("partitions later captures by same vs cross subscription", () => {
    const anchor = snapshot();
    const sameSubLater = snapshot({
      snapshotId: "22222222-2222-2222-2222-222222222222",
      capturedUtc: "2026-09-08T12:00:00Z",
    });
    const crossSubLater = snapshot({
      snapshotId: "33333333-3333-3333-3333-333333333333",
      subscriptionId: "sub-dev",
      subscriptionName: "Dev",
      capturedUtc: "2026-09-10T12:00:00Z",
    });
    const earlier = snapshot({
      snapshotId: "44444444-4444-4444-4444-444444444444",
      capturedUtc: "2026-08-15T12:00:00Z",
    });

    expect(
      partitionInfraEvidenceLaterSnapshotsForAnchor(anchor, [anchor, sameSubLater, crossSubLater, earlier]),
    ).toEqual({
      sameSubscription: [sameSubLater],
      crossSubscription: [crossSubLater],
    });
  });

  it("compares offset-less capture times as UTC against explicit offsets", () => {
    vi.stubEnv("TZ", "America/Los_Angeles");
    const anchor = snapshot({ capturedUtc: "2026-09-01T12:00:00" });
    const later = snapshot({ snapshotId: "later", capturedUtc: "2026-09-01T14:30:00+02:00" });
    const earlier = snapshot({ snapshotId: "earlier", capturedUtc: "2026-09-01T11:30:00Z" });

    expect(partitionInfraEvidenceLaterSnapshotsForAnchor(anchor, [later, earlier])).toEqual({
      sameSubscription: [later],
      crossSubscription: [],
    });
  });
});
