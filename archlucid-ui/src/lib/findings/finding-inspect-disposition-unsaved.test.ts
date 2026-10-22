import { describe, expect, it } from "vitest";

import {
  EMPTY_FINDING_INSPECT_DISPOSITION_BASELINE,
  EMPTY_FINDING_INSPECT_WAIVER_BASELINE,
  createFindingInspectRemediationBaseline,
  findingInspectDispositionHasUnsavedEdits,
  findingInspectHasUnsavedEdits,
  findingInspectRemediationHasUnsavedEdits,
} from "@/lib/findings/finding-inspect-disposition-unsaved";

describe("finding-inspect-disposition-unsaved (AD-01)", () => {
  it("detects remediation edits against the saved baseline", () => {
    const baseline = createFindingInspectRemediationBaseline("owner-1", "2026-09-04T10:00");

    expect(
      findingInspectRemediationHasUnsavedEdits(
        { assignedToUserId: "owner-2", remediationDueUtc: "2026-09-04T10:00" },
        baseline,
      ),
    ).toBe(true);

    expect(
      findingInspectRemediationHasUnsavedEdits(
        { assignedToUserId: "owner-1", remediationDueUtc: "2026-09-04T10:00" },
        baseline,
      ),
    ).toBe(false);
  });

  it("detects disposition proposal edits against last submit baseline", () => {
    expect(
      findingInspectDispositionHasUnsavedEdits(
        {
          disposition: "Accepted",
          rationale: "Ship with trade-off",
          revisitDueUtc: "",
          evidenceRequestText: "",
          tradeOffAcknowledgment: "",
        },
        EMPTY_FINDING_INSPECT_DISPOSITION_BASELINE,
      ),
    ).toBe(true);

    expect(
      findingInspectDispositionHasUnsavedEdits(
        EMPTY_FINDING_INSPECT_DISPOSITION_BASELINE,
        EMPTY_FINDING_INSPECT_DISPOSITION_BASELINE,
      ),
    ).toBe(false);
  });

  it("returns false when read-only or all fields match baseline", () => {
    expect(
      findingInspectHasUnsavedEdits({
        canMutate: false,
        remediation: { assignedToUserId: "a", remediationDueUtc: "" },
        remediationBaseline: { assignedToUserId: "", remediationDueUtc: "" },
        disposition: {
          disposition: "Deferred",
          rationale: "later",
          revisitDueUtc: "",
          evidenceRequestText: "",
          tradeOffAcknowledgment: "",
        },
        dispositionBaseline: EMPTY_FINDING_INSPECT_DISPOSITION_BASELINE,
        waiver: EMPTY_FINDING_INSPECT_WAIVER_BASELINE,
        waiverBaseline: EMPTY_FINDING_INSPECT_WAIVER_BASELINE,
      }),
    ).toBe(false);
  });
});
