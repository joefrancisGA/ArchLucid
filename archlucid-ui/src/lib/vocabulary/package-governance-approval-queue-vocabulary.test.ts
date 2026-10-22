import { describe, expect, it } from "vitest";

import {
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_COMPACT_LINE,
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_HEADING,
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_QUEUE_LINK,
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_REVIEWS_PEER_LINK,
  PACKAGE_GOVERNANCE_APPROVAL_QUEUE_WHY_TWO,
  buildPackageGovernanceApprovalQueueVocabulary,
  resolvePackageGovernanceApprovalQueuePeerLink,
} from "@/lib/vocabulary/package-governance-approval-queue-vocabulary";
import { buildReviewWorkspaceTabHref } from "@/lib/unified-review-workspace-tabs";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";
import { REVIEWS_LIST_PATH } from "@/lib/architecture/architecture-routes";

describe("package-governance-approval-queue-vocabulary (TB-2304)", () => {
  it("explains package governance readiness vs live approval queue", () => {
    const model = buildPackageGovernanceApprovalQueueVocabulary("run-abc");

    expect(model.heading).toBe(PACKAGE_GOVERNANCE_APPROVAL_QUEUE_HEADING);
    expect(model.whyTwo).toBe(PACKAGE_GOVERNANCE_APPROVAL_QUEUE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("readiness");
    expect(model.whyTwo.toLowerCase()).toContain("approve");
    expect(model.compactLine).toBe(PACKAGE_GOVERNANCE_APPROVAL_QUEUE_COMPACT_LINE);
    expect(model.packageGovernanceLink.label).toBe("Policies and standards");
    expect(model.packageGovernanceLink.href).toBe(buildReviewWorkspaceTabHref("run-abc", "policies"));
    expect(model.approvalQueueLink.label).toBe(
      PACKAGE_GOVERNANCE_APPROVAL_QUEUE_QUEUE_LINK.label,
    );
    expect(model.approvalQueueLink.href).toBe(
      `${GOVERNANCE_APPROVAL_QUEUE_PATH}?runId=run-abc`,
    );
  });

  it("uses Reviews hub peer when no runId is in scope", () => {
    const model = buildPackageGovernanceApprovalQueueVocabulary();

    expect(model.packageGovernanceLink).toEqual(
      PACKAGE_GOVERNANCE_APPROVAL_QUEUE_REVIEWS_PEER_LINK,
    );
    expect(model.packageGovernanceLink.href).toBe(REVIEWS_LIST_PATH);
    expect(model.approvalQueueLink.href).toBe(GOVERNANCE_APPROVAL_QUEUE_PATH);
  });

  it("resolves the peer surface from package governance and approval queue", () => {
    const model = buildPackageGovernanceApprovalQueueVocabulary("run-abc");

    expect(resolvePackageGovernanceApprovalQueuePeerLink("package-governance", model)).toEqual(
      model.approvalQueueLink,
    );
    expect(resolvePackageGovernanceApprovalQueuePeerLink("approval-queue", model)).toEqual(
      model.packageGovernanceLink,
    );
  });
});
