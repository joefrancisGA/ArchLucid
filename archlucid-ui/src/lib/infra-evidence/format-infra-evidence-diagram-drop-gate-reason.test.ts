import { describe, expect, it } from "vitest";

import { formatInfraEvidenceDiagramDropGateReasonLabel } from "@/lib/infra-evidence/format-infra-evidence-diagram-drop-gate-reason";
import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NSG_NO_ASSOCIATION_LABEL,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NSG_OFF_DIAGRAM_TARGET_LABEL,
} from "@/lib/governance/governance-infrastructure-copy";

describe("formatInfraEvidenceDiagramDropGateReasonLabel", () => {
  it("maps diagram ledger drop-gate codes to reviewer-facing labels", () => {
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("collocation")).toBe(
      "Resource-group collocation only. This diagram left it off. It is not a stored connection.",
    );
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("mode-filter")).toBe(
      "In the snapshot, and left off this diagram mode.",
    );
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("below-minimum-weight")).toBe(
      "Stored below the diagram weight cutoff, and left off this diagram.",
    );
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("endpoint-peeled-or-hidden")).toBe(
      "A subnet on this relationship is not drawn on this diagram.",
    );
  });

  it("maps NSG ledger drop reasons", () => {
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("nsg-unattached-no-association")).toBe(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NSG_NO_ASSOCIATION_LABEL,
    );
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("nsg-unattached-off-diagram")).toBe(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_OUTLINE_NSG_OFF_DIAGRAM_TARGET_LABEL,
    );
  });

  it("labels unmapped drop reason codes explicitly", () => {
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("custom-drop")).toBe(
      "Drop reason code was not mapped: custom-drop",
    );
  });

  it("labels blank drop reasons as not stored", () => {
    expect(formatInfraEvidenceDiagramDropGateReasonLabel("   ")).toBe("Drop reason was not stored.");
  });
});
