import { describe, expect, it } from "vitest";

import {
  formatInfraEvidenceAskScopeStack,
  resolveInfraEvidenceAskSnapshotFreshness,
} from "@/lib/infra-evidence/infra-evidence-ask-scope-summary";

describe("formatInfraEvidenceAskScopeStack", () => {
  it("formats a layered scope stack for Ask grounding", () => {
    expect(
      formatInfraEvidenceAskScopeStack({
        cloudResourceId: "11111111-1111-1111-1111-111111111111",
        snapshotId: "22222222-2222-2222-2222-222222222222",
        diffId: "diff-1",
        assessmentId: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        auditEvidenceSnapshotId: "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
        controlId: "cccccccc-cccc-cccc-cccc-cccccccccccc",
      }),
    ).toBe(
      "resource 11111111-1111-1111-1111-111111111111 → snapshot 22222222-2222-2222-2222-222222222222 → drift diff diff-1 → audit control cccccccc-cccc-cccc-cccc-cccccccccccc",
    );
  });

  it("includes snapshot capture time in the scope stack when known", () => {
    const summary = formatInfraEvidenceAskScopeStack({
      cloudResourceId: "11111111-1111-1111-1111-111111111111",
      snapshotId: "22222222-2222-2222-2222-222222222222",
      snapshotCapturedUtc: "2026-09-08T22:44:27Z",
    });

    expect(summary).toContain("snapshot 22222222-2222-2222-2222-222222222222");
    expect(summary).toContain("captured");
  });
});

describe("resolveInfraEvidenceAskSnapshotFreshness", () => {
  it("marks old snapshots as stale", () => {
    const freshness = resolveInfraEvidenceAskSnapshotFreshness(
      "22222222-2222-2222-2222-222222222222",
      "2020-01-01T00:00:00Z",
      Date.parse("2026-09-10T00:00:00Z"),
    );

    expect(freshness?.statusKind).toBe("needs-attention");
    expect(freshness?.statusLabel).toBe("Stale snapshot");
    expect(freshness?.snapshotId).toBe("22222222-2222-2222-2222-222222222222");
  });
});
