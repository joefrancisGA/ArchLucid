import { describe, expect, it } from "vitest";

import { formatInfraEvidenceDiagramDropGateReasonLabel } from "@/lib/infra-evidence/format-infra-evidence-diagram-drop-gate-reason";
import { GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNATTACHED_NSG_LABEL } from "@/lib/governance/governance-infrastructure-copy";

describe("formatInfraEvidenceDiagramDropGateReasonLabel (P-18)", () => {
  it("maps known drop-gate reason codes to reviewer labels", () => {
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("nsg-unattached")).toBe(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_UNATTACHED_NSG_LABEL,
    );
  });

  it("returns the stored code when no mapping exists", () => {
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("custom-drop")).toBe("custom-drop");
  });

  it("labels blank drop reasons as not stored", () => {
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("   ")).toBe("Drop reason was not stored.");
  });
});
