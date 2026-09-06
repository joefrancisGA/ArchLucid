import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceAskCitationLink, buildResourceHubDiagramsWorkbenchHref } from "@/lib/infra-evidence/infra-evidence-ask-citations";

const resourceId = "11111111-1111-1111-1111-111111111111";
const snapshotId = "22222222-2222-2222-2222-222222222222";
const findingId = "33333333-3333-3333-3333-333333333333";
const changeId = "44444444-4444-4444-4444-444444444444";
const diffId = "55555555-5555-5555-5555-555555555555";
const assessmentId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const auditSnapshotId = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";
const controlId = "cccccccc-cccc-cccc-cccc-cccccccccccc";

describe("infra-evidence-ask-citations", () => {
  it("links FindingId citations into the scoped remediation factory", () => {
    const link = resolveInfraEvidenceAskCitationLink(
      { kind: "FindingId", id: findingId, label: "Public endpoint" },
      { cloudResourceId: resourceId },
    );

    expect(link).toEqual({
      href: `/governance/infrastructure/remediation?cloudResourceId=${resourceId}&findingId=${findingId}`,
      label: "Public endpoint",
    });
  });

  it("links ChangeId citations with ask session drift context", () => {
    const link = resolveInfraEvidenceAskCitationLink(
      { kind: "ChangeId", id: changeId, label: "sku change" },
      { cloudResourceId: resourceId, snapshotId, diffId },
    );

    expect(link?.href).toBe(
      `/governance/infrastructure/drift?snapshotId=${snapshotId}&cloudResourceId=${resourceId}&changeId=${changeId}&diffId=${diffId}`,
    );
  });

  it("links CloudResourceId citations to the hub with snapshot context", () => {
    const link = resolveInfraEvidenceAskCitationLink(
      { kind: "CloudResourceId", id: resourceId, label: "gateway-pip" },
      { snapshotId },
    );

    expect(link?.href).toBe(
      `/governance/infrastructure/resources/${resourceId}?snapshotId=${snapshotId}`,
    );
  });

  it("links CloudResourceId citations to the inferred hub tab when drift context is present", () => {
    const link = resolveInfraEvidenceAskCitationLink(
      { kind: "CloudResourceId", id: resourceId, label: "gateway-pip" },
      { snapshotId, diffId },
    );

    expect(link?.href).toBe(
      `/governance/infrastructure/resources/${resourceId}?tab=drift&snapshotId=${snapshotId}`,
    );
  });

  it("links audit lineage citations when assessment context is present", () => {
    const link = resolveInfraEvidenceAskCitationLink(
      { kind: "AuditLineageControlId", id: controlId, label: "AC-2" },
      { assessmentId, auditEvidenceSnapshotId: auditSnapshotId },
    );

    expect(link?.href).toBe(
      `/governance/audit-evidence/${assessmentId}/snapshots/${auditSnapshotId}/controls/${controlId}`,
    );
  });

  it("links diagram correspondence citations into the reconcile workbench", () => {
    const correspondenceId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const runId = "run-1";
    const link = resolveInfraEvidenceAskCitationLink(
      { kind: "DiagramCorrespondenceId", id: correspondenceId, label: "Gateway node" },
      { snapshotId, cloudResourceId: resourceId, runId },
    );

    expect(link?.href).toBe(
      `/governance/infrastructure/diagram-reconcile?runId=${runId}&snapshotId=${snapshotId}&cloudResourceId=${resourceId}&reconcileFilter=Conflict&correspondenceId=${correspondenceId}`,
    );
  });

  it("links FindingId citations with diagram reconcile handoff context", () => {
    const correspondenceId = "dddddddd-dddd-dddd-dddd-dddddddddddd";
    const runId = "run-1";
    const link = resolveInfraEvidenceAskCitationLink(
      { kind: "FindingId", id: findingId, label: "Conflict finding" },
      { cloudResourceId: resourceId, snapshotId, correspondenceId, runId },
    );

    expect(link?.href).toBe(
      `/governance/infrastructure/remediation?cloudResourceId=${resourceId}&findingId=${findingId}&correspondenceId=${correspondenceId}&runId=${runId}&snapshotId=${snapshotId}`,
    );
  });

  it("prefills hub diagrams workbench with dependency neighborhood seed from ARM id", () => {
    const armId = "/subscriptions/sub/resourceGroups/rg-net/providers/Microsoft.Network/publicIPAddresses/gateway";

    expect(buildResourceHubDiagramsWorkbenchHref(snapshotId, resourceId, armId)).toBe(
      `/governance/infrastructure/diagrams?snapshotId=${snapshotId}&cloudResourceId=${resourceId}&mermaidMode=dependencyNeighborhood&seedNodeId=${encodeURIComponent(armId)}`,
    );
  });

  it("forwards audit scope on ChangeId citations when Ask session includes audit lineage", () => {
    const link = resolveInfraEvidenceAskCitationLink(
      { kind: "ChangeId", id: changeId, label: "sku change" },
      {
        cloudResourceId: resourceId,
        snapshotId,
        diffId,
        assessmentId,
        auditEvidenceSnapshotId: auditSnapshotId,
        controlId,
      },
    );

    expect(link?.href).toContain("assessmentId=aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    expect(link?.href).toContain("auditEvidenceSnapshotId=bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    expect(link?.href).toContain("controlId=cccccccc-cccc-cccc-cccc-cccccccccccc");
  });
});
