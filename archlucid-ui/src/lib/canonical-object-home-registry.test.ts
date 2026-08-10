import { describe, expect, it } from "vitest";

import {
  buildCanonicalObjectSecondaryView,
  canonicalObjectHomeHref,
  canonicalObjectHomeActionLabel,
  GOLDEN_PATH_SECONDARY_OBJECT_SURFACES,
  governanceApprovalRequestLineagePath,
  secondaryAppearanceSurfaceLabel,
} from "@/lib/canonical-object-home-registry";
import { DECISION_REGISTER_CANONICAL_PATH } from "@/lib/decision-register-evidence-copy";
import { getFindingDetailHref } from "@/lib/finding-evidence-navigation";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance-route-paths";
import { signedRecordDetailPath } from "@/lib/signed-records-paths";

describe("canonical-object-home-registry (TB-2153)", () => {
  it("builds canonical home hrefs for all governed object types", () => {
    expect(
      canonicalObjectHomeHref("finding", { runId: "run-1", findingId: "finding-1" }),
    ).toBe(getFindingDetailHref("run-1", "finding-1"));
    expect(canonicalObjectHomeHref("decision", {})).toBe(DECISION_REGISTER_CANONICAL_PATH);
    expect(canonicalObjectHomeHref("signedReviewRecord", { manifestId: "manifest-1" })).toBe(
      signedRecordDetailPath("manifest-1"),
    );
    expect(canonicalObjectHomeHref("approvalRequest", { approvalRequestId: "approval-1" })).toBe(
      governanceApprovalRequestLineagePath("approval-1"),
    );
    expect(canonicalObjectHomeHref("approvalRequest", { runId: "run-1" })).toBe(
      `${GOVERNANCE_APPROVAL_QUEUE_PATH}?runId=run-1#governance-approval-requests`,
    );
    expect(canonicalObjectHomeHref("approvalRequest", {})).toBe(GOVERNANCE_APPROVAL_QUEUE_PATH);
  });

  it("labels secondary surfaces and canonical home actions", () => {
    expect(secondaryAppearanceSurfaceLabel("governanceFindingsRegister")).toBe("Findings register");
    expect(canonicalObjectHomeActionLabel("finding")).toBe("finding record");
    expect(canonicalObjectHomeActionLabel("approvalRequest")).toBe("approval queue");
  });

  it("builds secondary-view presentation with home link", () => {
    const presentation = buildCanonicalObjectSecondaryView("finding", "reviewPackageFindingsTab", {
      runId: "run-abc",
      findingId: "finding-xyz",
    });

    expect(presentation.surfaceLabel).toBe("Architecture review findings");
    expect(presentation.homeHref).toBe(getFindingDetailHref("run-abc", "finding-xyz"));
    expect(presentation.homeActionLabel).toBe("finding record");
  });

  it("covers every golden-path secondary surface in the inventory", () => {
    const objectTypes = new Set(GOLDEN_PATH_SECONDARY_OBJECT_SURFACES.map((entry) => entry.objectType));

    expect(objectTypes.has("finding")).toBe(true);
    expect(objectTypes.has("decision")).toBe(true);
    expect(objectTypes.has("signedReviewRecord")).toBe(true);
    expect(objectTypes.has("approvalRequest")).toBe(true);
    expect(GOLDEN_PATH_SECONDARY_OBJECT_SURFACES.length).toBeGreaterThanOrEqual(6);
  });
});
