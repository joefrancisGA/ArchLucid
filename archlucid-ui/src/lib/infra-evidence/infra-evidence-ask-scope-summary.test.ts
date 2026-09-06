import { describe, expect, it } from "vitest";

import { formatInfraEvidenceAskScopeStack } from "@/lib/infra-evidence/infra-evidence-ask-scope-summary";

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
});
