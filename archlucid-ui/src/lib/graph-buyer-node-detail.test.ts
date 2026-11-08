import { describe, expect, it } from "vitest";

import {
  graphBuyerTrailMetadataLines,
  graphBuyerTrailPanelTitle,
  graphBuyerTrailRecordTypeLine,
  visibleBuyerTrailTechnicalAppendixLines,
} from "./graph-buyer-node-detail";
import { CUSTOMER_INTAKE_SAMPLE_DEFINITION } from "@/lib/samples/customer-intake-modernization/definition";
import type { GraphNodeVm } from "@/types/graph";

const REGISTERED_HERO_FINDING_ID = CUSTOMER_INTAKE_SAMPLE_DEFINITION.primaryFindingId;

describe("graphBuyerTrailRecordTypeLine", () => {
  it("labels active sample hero finding with scenario-specific risk framing", () => {
    const node: GraphNodeVm = {
      id: REGISTERED_HERO_FINDING_ID,
      type: "Finding",
      label: "Sensitive data minimization risk",
      metadata: { referenced: REGISTERED_HERO_FINDING_ID },
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding: Sensitive data minimization risk",
      secondary: { label: "Risk area", value: "Risk area was not stored." },
    });
  });

  it("labels sample hero finding when OpenAPI metadata is null", () => {
    const node: GraphNodeVm = {
      id: REGISTERED_HERO_FINDING_ID,
      type: "Finding",
      label: "Sensitive data minimization risk",
      metadata: null,
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding: Sensitive data minimization risk",
      secondary: { label: "Risk area", value: "Risk area was not stored." },
    });
  });

  it("labels stored-empty risk area metadata on sample hero findings (P-20)", () => {
    const node: GraphNodeVm = {
      id: REGISTERED_HERO_FINDING_ID,
      type: "Finding",
      label: "Sensitive data minimization risk",
      metadata: { riskArea: "   " },
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding: Sensitive data minimization risk",
      secondary: { label: "Risk area", value: "Risk area was stored empty." },
    });
  });

  it("uses stored risk area metadata on sample hero findings", () => {
    const node: GraphNodeVm = {
      id: REGISTERED_HERO_FINDING_ID,
      type: "Finding",
      label: "Sensitive data minimization risk",
      metadata: { riskArea: "Stored risk" },
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding: Sensitive data minimization risk",
      secondary: { label: "Risk area", value: "Stored risk" },
    });
  });

  it("uses finding title omission copy in the panel title when the label is blank", () => {
    const node: GraphNodeVm = {
      id: "finding-empty-label",
      type: "Finding",
      label: "   ",
    };

    expect(graphBuyerTrailPanelTitle(node)).toBe(
      "Selected finding: Finding title was not stored.",
    );
  });

  it("labels topology resource nodes for buyer trail panel title", () => {
    const node: GraphNodeVm = {
      id: "topo-1",
      type: "TopologyResource",
      label: "vm-prod-01",
    };

    expect(graphBuyerTrailPanelTitle(node)).toBe("Selected inventory resource: vm-prod-01");
    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Inventory resource",
      secondary: null,
    });
  });

  it("labels generic finding nodes as Finding", () => {
    const node: GraphNodeVm = {
      id: "finding-other",
      type: "Finding",
      label: "Other finding",
    };

    expect(graphBuyerTrailRecordTypeLine(node)).toEqual({
      primary: "Finding: Other finding",
      secondary: null,
    });
  });
});

describe("graphBuyerTrailMetadataLines", () => {
  it("hides technical appendix for showcase finding linkage ids already summarized above", () => {
    const { summaryLines, technicalLines } = graphBuyerTrailMetadataLines({
      referenceId: REGISTERED_HERO_FINDING_ID,
      referenced: REGISTERED_HERO_FINDING_ID,
    });

    expect(summaryLines).toEqual([]);
    expect(technicalLines).toEqual([
      { label: "Reference ID", value: REGISTERED_HERO_FINDING_ID },
      { label: "Raw reference (referenced)", value: REGISTERED_HERO_FINDING_ID },
    ]);
    expect(visibleBuyerTrailTechnicalAppendixLines(technicalLines)).toEqual([]);
  });

  it("keeps technical appendix when extra metadata fields exist", () => {
    const technicalLines = [
      { label: "Reference ID", value: "finding-123" },
      { label: "sourceSystem", value: "ServiceNow" },
    ];

    expect(visibleBuyerTrailTechnicalAppendixLines(technicalLines)).toEqual([
      { label: "sourceSystem", value: "ServiceNow" },
    ]);
  });

  it("preserves missing, empty, and stored sample hero metadata", () => {
    const missing = graphBuyerTrailMetadataLines({
      referenceId: REGISTERED_HERO_FINDING_ID,
      referenced: REGISTERED_HERO_FINDING_ID,
    });
    const empty = graphBuyerTrailMetadataLines({
      referenceId: REGISTERED_HERO_FINDING_ID,
      referenced: REGISTERED_HERO_FINDING_ID,
      riskArea: "",
      monitoringCadence: "",
    });
    const stored = graphBuyerTrailMetadataLines({
      referenceId: REGISTERED_HERO_FINDING_ID,
      referenced: REGISTERED_HERO_FINDING_ID,
      riskArea: "Stored risk",
      monitoringCadence: "Stored cadence",
    });

    expect(missing.summaryLines).toEqual([]);
    expect(empty.summaryLines).toContainEqual({ label: "Risk area", value: "Risk area was stored empty." });
    expect(empty.summaryLines).toContainEqual({
      label: "Monitoring cadence",
      value: "Monitoring cadence was not stored.",
    });
    expect(stored.summaryLines).toContainEqual({ label: "Risk area", value: "Stored risk" });
    expect(stored.summaryLines).toContainEqual({ label: "Monitoring cadence", value: "Stored cadence" });
  });

  it("labels empty role assignment and principal metadata as not stored", () => {
    const { summaryLines } = graphBuyerTrailMetadataLines({
      roleName: "",
      principalId: "",
    });

    expect(summaryLines).toContainEqual({ label: "Role assignment", value: "Role name was not stored." });
    expect(summaryLines).toContainEqual({ label: "Principal", value: "Principal id was not stored." });
  });

  it("labels empty decision impact, next action, and blocking status as not stored (P-17)", () => {
    const { summaryLines } = graphBuyerTrailMetadataLines({
      decisionImpact: "",
      nextAction: "",
      blockingStatus: "",
    });

    expect(summaryLines).toContainEqual({
      label: "Decision impact",
      value: "Decision impact was not stored.",
    });
    expect(summaryLines).toContainEqual({ label: "Next action", value: "Next action was not stored." });
    expect(summaryLines).toContainEqual({
      label: "Blocking status",
      value: "Blocking status was not stored.",
    });
  });
});
