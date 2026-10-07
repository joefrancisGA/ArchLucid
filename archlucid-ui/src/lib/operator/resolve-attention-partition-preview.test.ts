import { describe, expect, it } from "vitest";

import { resolveAttentionPartitionPreview } from "@/lib/operator/resolve-attention-partition-preview";
import type { AlertRecord } from "@/types/alerts";

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

  it("skips archived runs when falling back to the first active run title", () => {
    const preview = resolveAttentionPartitionPreview({
      partition: "unfinished-work",
      topUnfinishedItem: null,
      assignedFindingTitle: null,
      topAwaitingApproval: null,
      topAlert: null,
      runs: [
        {
          runId: "run-archived",
          projectId: "default",
          description: "Archived review",
          createdUtc: "2026-01-01T00:00:00.000Z",
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
          isArchived: true,
        },
        {
          runId: "run-active",
          projectId: "default",
          description: "Active review",
          createdUtc: "2026-01-02T00:00:00.000Z",
          hasFindingsSnapshot: false,
          hasGoldenManifest: false,
          isArchived: false,
        },
      ],
    });

    expect(preview).toBe("Active review");
  });

  it("returns empty preview when awaiting-approval name is whitespace-only", () => {
    const preview = resolveAttentionPartitionPreview({
      partition: "awaiting-approval",
      topUnfinishedItem: null,
      assignedFindingTitle: null,
      topAwaitingApproval: {
        runId: "run-await",
        name: "   ",
      },
      topAlert: null,
      runs: [],
    });

    expect(preview).toBe("");
  });

  it("returns empty preview when alert title is whitespace-only", () => {
    const preview = resolveAttentionPartitionPreview({
      partition: "alerts",
      topUnfinishedItem: null,
      assignedFindingTitle: null,
      topAwaitingApproval: null,
      topAlert: {
        alertId: "alert-1",
        title: "   ",
      } as AlertRecord,
      runs: [],
    });

    expect(preview).toBe("");
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
