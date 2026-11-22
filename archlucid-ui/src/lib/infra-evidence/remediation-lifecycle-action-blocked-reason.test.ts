import { describe, expect, it } from "vitest";

import { remediationLifecycleActionBlockedReason } from "@/lib/infra-evidence/remediation-lifecycle-action-blocked-reason";
import type { RemediationInstanceStatus } from "@/lib/infra-evidence/infra-evidence-remediation-types";

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

  it("requires an inventory snapshot for preflight on a classified instance", () => {
    const context = {
      actionBusy: false,
      selectedStatus: "Classified" as const,
      transitionsBlocked: false,
      findingIdInput: "",
      selectedWaveId: "",
      selectedSnapshotId: "",
    };

    expect(remediationLifecycleActionBlockedReason("preflight", context)).toMatch(/inventory snapshot/i);
    expect(remediationLifecycleActionBlockedReason("preflight", {
      ...context,
      selectedSnapshotId: "snapshot-1",
    })).toBeNull();
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

  it("allows attest only after advisory output is generated", () => {
    const context = {
      actionBusy: false,
      selectedStatus: "Executed" as RemediationInstanceStatus,
      transitionsBlocked: false,
      findingIdInput: "finding-1",
      selectedWaveId: "wave-1",
      selectedSnapshotId: "snap-1",
    };

    expect(remediationLifecycleActionBlockedReason("attestChangeImplemented", context)).toBeNull();
    expect(
      remediationLifecycleActionBlockedReason("attestChangeImplemented", {
        ...context,
        selectedStatus: "ChangeImplemented",
      }),
    ).toMatch(/advisory output/i);
  });

  it("blocks close after verification fails", () => {
    expect(
      remediationLifecycleActionBlockedReason("close", {
        actionBusy: false,
        selectedStatus: "VerificationFailed",
        transitionsBlocked: false,
        findingIdInput: "finding-1",
        selectedWaveId: "wave-1",
        selectedSnapshotId: "snap-1",
      }),
    ).toMatch(/verification passes/i);
  });
});
