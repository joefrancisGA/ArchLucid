import { describe, expect, it } from "vitest";

import { resolveAttentionPartitionPreview } from "@/lib/operator/resolve-attention-partition-preview";

describe("resolveAttentionPartitionPreview", () => {
  it("prefers the top unfinished-work rail item title", () => {
    const preview = resolveAttentionPartitionPreview({
      partition: "unfinished-work",
      topUnfinishedItem: {
        id: "review-in-progress:run-1",
        kind: "review-in-progress",
        title: "Claims API review",
        href: "/architecture/reviews/run-1",
        statusLabel: "In progress",
        updatedUtc: null,
        workTypeLabel: "Architecture review",
        activityLabel: null,
        actionLabel: "Continue",
      },
      assignedFindingTitle: null,
      topAwaitingApproval: null,
      topAlert: null,
      runs: [],
    });

    expect(preview).toBe("Claims API review");
  });

  it("returns assigned finding title for assigned-to-me partition", () => {
    const preview = resolveAttentionPartitionPreview({
      partition: "assigned-to-me",
      topUnfinishedItem: null,
      assignedFindingTitle: "Open egress path",
      topAwaitingApproval: null,
      topAlert: null,
      runs: [],
    });

    expect(preview).toBe("Open egress path");
  });
});
