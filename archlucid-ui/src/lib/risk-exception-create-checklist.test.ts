import { describe, expect, it } from "vitest";

import {
  resolveRiskExceptionCreateEmphasizedStepId,
  resolveRiskExceptionCreateSteps,
} from "@/lib/risk-exception-create-checklist";

describe("risk-exception-create-checklist", () => {
  it("tracks waiver create progress", () => {
    expect(
      resolveRiskExceptionCreateSteps({
        ownerAssigned: true,
        evidenceDocumented: true,
        waiverCreated: false,
      }),
    ).toEqual([
      { id: "owner", label: "Assign exception owner", complete: true },
      { id: "evidence", label: "Document rationale and evidence reference", complete: true },
      { id: "create", label: "Create risk exception waiver", complete: false },
    ]);
  });

  it("emphasizes owner when missing", () => {
    expect(
      resolveRiskExceptionCreateEmphasizedStepId({
        ownerAssigned: false,
        evidenceDocumented: false,
        waiverCreated: false,
      }),
    ).toBe("owner");
  });
});
