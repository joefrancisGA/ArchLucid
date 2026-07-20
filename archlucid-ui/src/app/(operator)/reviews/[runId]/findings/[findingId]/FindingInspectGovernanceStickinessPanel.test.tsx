import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindingInspectGovernanceStickinessPanel } from "./FindingInspectGovernanceStickinessPanel";

vi.mock("@/hooks/use-operate-capability", () => ({
  useOperateCapability: () => true,
}));

vi.mock("@/lib/api/governance-stickiness-api", () => ({
  listFindingDispositions: async () => [],
  listRiskExceptions: async () => [],
  createRiskException: vi.fn(),
  recordFindingDisposition: vi.fn(),
  revokeRiskException: vi.fn(),
  defaultRiskExceptionExpiresAtUtc: () => "2099-01-01T00:00:00.000Z",
}));

vi.mock("@/lib/api/finding-remediation-assignment-api", () => ({
  upsertFindingRemediationAssignment: vi.fn(),
}));

vi.mock("@/lib/demo-ui-env", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/demo-ui-env")>();
  return {
    ...actual,
    isBuyerPolishedOperatorShellEnv: () => true,
  };
});

describe("FindingInspectGovernanceStickinessPanel", () => {
  it("uses one primary save action per subsection", () => {
    render(
      <FindingInspectGovernanceStickinessPanel
        findingId="phi-minimization-risk"
        runId="claims-intake-modernization"
      />,
    );

    const remediationSave = screen.getByTestId("finding-remediation-save");
    const dispositionSave = screen.getByTestId("finding-disposition-save");
    const markRemediated = screen.getByTestId("finding-mark-remediated");

    expect(remediationSave.className).toContain("bg-neutral-900");
    expect(dispositionSave.className).toContain("bg-neutral-900");
    expect(markRemediated.className).not.toContain("bg-teal");
    expect(screen.getByLabelText(/Remediation owner/i)).toBeTruthy();
  });
});
