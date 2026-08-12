import { describe, expect, it } from "vitest";

import {
  PACKAGE_ACTIVITY_AUDIT_TRAIL_AUDIT_LINK,
  PACKAGE_ACTIVITY_AUDIT_TRAIL_COMPACT_LINE,
  PACKAGE_ACTIVITY_AUDIT_TRAIL_HEADING,
  PACKAGE_ACTIVITY_AUDIT_TRAIL_REVIEWS_PEER_LINK,
  PACKAGE_ACTIVITY_AUDIT_TRAIL_WHY_TWO,
  buildPackageActivityAuditTrailVocabulary,
  resolvePackageActivityAuditTrailPeerLink,
} from "@/lib/vocabulary/package-activity-audit-trail-vocabulary";
import { buildArchitectureWorkspaceTabHref } from "@/lib/architecture-workspace-tabs";
import { GOVERNANCE_AUDIT_PATH } from "@/lib/governance-route-paths";
import { buildReviewDetailTabHref } from "@/lib/review-detail-workspace-tabs";
import { REVIEWS_LIST_PATH } from "@/lib/architecture-routes";

describe("package-activity-audit-trail-vocabulary (TB-2305)", () => {
  it("explains package assessment progress vs operator audit log", () => {
    const model = buildPackageActivityAuditTrailVocabulary("run-abc");

    expect(model.heading).toBe(PACKAGE_ACTIVITY_AUDIT_TRAIL_HEADING);
    expect(model.whyTwo).toBe(PACKAGE_ACTIVITY_AUDIT_TRAIL_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("progress");
    expect(model.whyTwo.toLowerCase()).toContain("audit");
    expect(model.compactLine).toBe(PACKAGE_ACTIVITY_AUDIT_TRAIL_COMPACT_LINE);
    expect(model.packageActivityLink.label).toBe("Activity");
    expect(model.packageActivityLink.href).toBe(
      buildArchitectureWorkspaceTabHref("run-abc", "activity"),
    );
    expect(model.auditTrailLink.label).toBe(PACKAGE_ACTIVITY_AUDIT_TRAIL_AUDIT_LINK.label);
    expect(model.auditTrailLink.href).toBe(`${GOVERNANCE_AUDIT_PATH}?runId=run-abc`);
  });

  it("uses Reviews hub peer when no runId is in scope", () => {
    const model = buildPackageActivityAuditTrailVocabulary();

    expect(model.packageActivityLink).toEqual(PACKAGE_ACTIVITY_AUDIT_TRAIL_REVIEWS_PEER_LINK);
    expect(model.packageActivityLink.href).toBe(REVIEWS_LIST_PATH);
    expect(model.auditTrailLink.href).toBe(GOVERNANCE_AUDIT_PATH);
  });

  it("builds reviewTab Activity href when mounting on committed review", () => {
    const model = buildPackageActivityAuditTrailVocabulary("run-abc", "reviewTab");

    expect(model.packageActivityLink.href).toBe(buildReviewDetailTabHref("run-abc", "activity"));
  });

  it("resolves the peer surface from package activity and audit trail", () => {
    const model = buildPackageActivityAuditTrailVocabulary("run-abc");

    expect(resolvePackageActivityAuditTrailPeerLink("package-activity", model)).toEqual(
      model.auditTrailLink,
    );
    expect(resolvePackageActivityAuditTrailPeerLink("audit-trail", model)).toEqual(
      model.packageActivityLink,
    );
  });
});
