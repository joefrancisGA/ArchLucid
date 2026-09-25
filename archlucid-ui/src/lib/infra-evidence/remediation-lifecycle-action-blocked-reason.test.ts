import { describe, expect, it } from "vitest";

import { remediationLifecycleActionBlockedReason } from "@/lib/infra-evidence/remediation-lifecycle-action-blocked-reason";

describe("remediationLifecycleActionBlockedReason", () => {
  it("blocks create when finding id is empty", () => {
    expect(
      remediationLifecycleActionBlockedReason("create", {
        actionBusy: false,
        selectedStatus: null,
        transitionsBlocked: false,
        findingIdInput: "",
        selectedWaveId: "wave-1",
        selectedSnapshotId: "snap-1",
      }),
    ).toMatch(/finding id/i);
  });

  it("blocks approve when preflight has not passed", () => {
    expect(
      remediationLifecycleActionBlockedReason("approve", {
        actionBusy: false,
        selectedStatus: "PreflightBlocked",
        transitionsBlocked: true,
        findingIdInput: "finding-1",
        selectedWaveId: "wave-1",
        selectedSnapshotId: "snap-1",
      }),
    ).toMatch(/preflight/i);
  });
});
