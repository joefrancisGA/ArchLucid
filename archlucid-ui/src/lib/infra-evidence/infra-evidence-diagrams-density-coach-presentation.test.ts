import { describe, expect, it } from "vitest";

import {
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_BODY,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_RECORDED_TYPES_PREFIX,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_TITLE,
  GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_TOO_LARGE_TITLE,
} from "@/lib/governance/governance-infrastructure-copy";
import { resolveInfraDiagramsDensityCoachPresentation } from "@/lib/infra-evidence/infra-evidence-diagrams-density-coach-presentation";

const readableFullSubscriptionPartition = {
  showFallbackCards: true,
  tooLargeForBrowser: false,
  diagramContentEmpty: false,
  renderStatus: "Succeeded",
  paintDiagramCanvas: true,
  selectedMode: "full",
  nodeCount: 11,
  maxNodes: 400,
  isExecutiveMode: false,
  inventoryFilteredIdentityArmTypes: [],
} as const;

describe("resolveInfraDiagramsDensityCoachPresentation", () => {
  it("returns empty-identity copy for succeeded identity mode with no nodes", () => {
    const presentation = resolveInfraDiagramsDensityCoachPresentation({
      ...readableFullSubscriptionPartition,
      selectedMode: "identity",
      diagramContentEmpty: true,
      paintDiagramCanvas: false,
      showFallbackCards: false,
      inventoryFilteredIdentityArmTypes: [
        {
          armResourceType: "Microsoft.ManagedIdentity/userAssignedIdentities",
          resourceCount: 4,
        },
      ],
    });

    expect(presentation?.variant).toBe("empty-identity");
    expect(presentation?.title).toBe(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_TITLE);
    expect(presentation?.body).toContain(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_BODY);
    expect(presentation?.body).toContain(
      GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_RECORDED_TYPES_PREFIX,
    );
    expect(presentation?.body).toContain("Microsoft.ManagedIdentity/userAssignedIdentities");
    expect(presentation?.body).not.toContain("Identity mode includes them");
  });

  it("explains capture omit when identity mode is empty and no identity types were recorded", () => {
    const presentation = resolveInfraDiagramsDensityCoachPresentation({
      ...readableFullSubscriptionPartition,
      selectedMode: "identity",
      diagramContentEmpty: true,
      paintDiagramCanvas: false,
      showFallbackCards: false,
      inventoryFilteredIdentityArmTypes: [],
    });

    expect(presentation?.variant).toBe("empty-identity");
    expect(presentation?.title).toBe(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_TITLE);
    expect(presentation?.body).toBe(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_EMPTY_IDENTITY_BODY);
    expect(presentation?.body).toContain("omits those types when it saves the snapshot");
  });

  it("returns too-large copy for partitioned full subscription", () => {
    const presentation = resolveInfraDiagramsDensityCoachPresentation({
      ...readableFullSubscriptionPartition,
      renderStatus: "Failed",
      paintDiagramCanvas: false,
    });

    expect(presentation?.variant).toBe("too-large");
    expect(presentation?.title).toBe(GOVERNANCE_INFRASTRUCTURE_DIAGRAMS_DENSITY_COACH_TOO_LARGE_TITLE);
  });
});
