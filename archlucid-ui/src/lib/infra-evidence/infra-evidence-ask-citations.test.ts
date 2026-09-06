import { describe, expect, it } from "vitest";

import { resolveInfraEvidenceAskCitationLink } from "@/lib/infra-evidence/infra-evidence-ask-citations";

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

  it("links audit lineage citations when assessment context is present", () => {
    const link = resolveInfraEvidenceAskCitationLink(
      { kind: "AuditLineageControlId", id: controlId, label: "AC-2" },
      { assessmentId, auditEvidenceSnapshotId: auditSnapshotId },
    );

    expect(link?.href).toBe(
      `/governance/audit-evidence/${assessmentId}/snapshots/${auditSnapshotId}/controls/${controlId}`,
    );
  });
});
