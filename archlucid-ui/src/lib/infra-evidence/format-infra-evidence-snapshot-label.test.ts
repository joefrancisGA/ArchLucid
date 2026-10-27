import { describe, expect, it } from "vitest";

import {
  formatInfraEvidenceDiffLabel,
  formatInfraEvidenceDiffTotalChangesPhrase,
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

  it("labels UUID-only subscriptions without using the id as the name (P-07)", () => {
    const unlabeled = snapshot({ subscriptionName: null });

    expect(formatInfraEvidenceSnapshotLabel(unlabeled)).toContain("Subscription name was not stored.");
    expect(formatInfraEvidenceSnapshotLabel(unlabeled)).toContain("Subscription id 8aa56f3b-18bc-43ca-ad45-bad9e811d33b.");
    expect(formatInfraEvidenceSnapshotLabel(unlabeled)).not.toMatch(/^8aa56f3b/);
    expect(formatInfraEvidenceSnapshotLabel(unlabeled)).toContain("61 resources");
  });

  it("states when subscription fields were not stored", () => {
    const missing = snapshot({ subscriptionName: null, subscriptionId: null });

    expect(formatInfraEvidenceSnapshotLabel(missing)).toContain("Subscription was not stored.");
  });
});

describe("formatInfraEvidenceSubscriptionLabel", () => {
  it("labels UUID-only subscription ids without substituting the id for the name (P-07)", () => {
    expect(formatInfraEvidenceSubscriptionLabel(null, "8aa56f3b-18bc-43ca-ad45-bad9e811d33b")).toBe(
      "Subscription name was not stored. Subscription id 8aa56f3b-18bc-43ca-ad45-bad9e811d33b.",
    );
    expect(formatInfraEvidenceSubscriptionLabel("   ", "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")).toBe(
      "Subscription name was not stored. Subscription id aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.",
    );
  });

  it("keeps a non-UUID subscription id when the name is missing", () => {
    expect(formatInfraEvidenceSubscriptionLabel(null, "prod-sub")).toBe(
      "Subscription name was not stored. Subscription id prod-sub.",
    );
  });
});

describe("formatInfraEvidenceSnapshotCapturedLabel", () => {
  it("returns a fallback when capture time is missing", () => {
    expect(formatInfraEvidenceSnapshotCapturedLabel(null)).toBe("Captured time was not stored");
    expect(formatInfraEvidenceSnapshotCapturedLabel("  ")).toBe("Captured time was not stored");
  });

  it("formats capture time at minute precision without seconds", () => {
    const label = formatInfraEvidenceSnapshotCapturedLabel("2026-09-08T22:44:27Z", "America/New_York");

    expect(label).toBe("9/8/2026, 6:44 PM EDT");
    expect(label).not.toMatch(/:\d{2}:\d{2}/u);
  });
});

describe("formatInfraEvidenceDiffTotalChangesPhrase", () => {
  it("states when total change count was not stored", () => {
    expect(formatInfraEvidenceDiffTotalChangesPhrase(undefined)).toBe("Change count was not stored.");
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
