import { describe, expect, it } from "vitest";

import {
  APPROVAL_LINEAGE_QUEUE_COMPACT_LINE,
  APPROVAL_LINEAGE_QUEUE_HEADING,
  APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK,
  APPROVAL_LINEAGE_QUEUE_QUEUE_LINK,
  APPROVAL_LINEAGE_QUEUE_WHY_TWO,
  buildApprovalLineageQueueVocabulary,
  resolveApprovalLineageQueuePeerLink,
} from "@/lib/vocabulary/approval-lineage-queue-vocabulary";
import { APPROVAL_LINEAGE_CANONICAL_PATH_PATTERN } from "@/lib/approval-lineage-evidence-copy";
import { GOVERNANCE_APPROVAL_QUEUE_PATH } from "@/lib/governance/governance-route-paths";

describe("approval-lineage-queue-vocabulary (TB-2271)", () => {
  it("explains approval lineage vs approval queue", () => {
    const model = buildApprovalLineageQueueVocabulary();

    expect(model.heading).toBe(APPROVAL_LINEAGE_QUEUE_HEADING);
    expect(model.heading.toLowerCase()).toContain("lineage");
    expect(model.heading.toLowerCase()).toContain("queue");
    expect(model.whyTwo).toBe(APPROVAL_LINEAGE_QUEUE_WHY_TWO);
    expect(model.whyTwo.toLowerCase()).toContain("linkage");
    expect(model.whyTwo.toLowerCase()).toContain("decision workflow");
    expect(model.compactLine).toBe(APPROVAL_LINEAGE_QUEUE_COMPACT_LINE);

    expect(model.lineageLink).toEqual(APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK);
    expect(model.lineageLink.href).toBe(APPROVAL_LINEAGE_CANONICAL_PATH_PATTERN);
    expect(model.lineageLink.href).toBe("/governance/approval-requests/[id]/lineage");

    expect(model.queueLink).toEqual(APPROVAL_LINEAGE_QUEUE_QUEUE_LINK);
    expect(model.queueLink.href).toBe(GOVERNANCE_APPROVAL_QUEUE_PATH);
    expect(model.queueLink.href).toBe("/governance/approval-queue");
  });

  it("resolves the peer surface from lineage and queue", () => {
    expect(resolveApprovalLineageQueuePeerLink("approval-lineage")).toEqual(
      APPROVAL_LINEAGE_QUEUE_QUEUE_LINK,
    );

    expect(resolveApprovalLineageQueuePeerLink("approval-queue")).toEqual(
      APPROVAL_LINEAGE_QUEUE_LINEAGE_LINK,
    );
  });
});
