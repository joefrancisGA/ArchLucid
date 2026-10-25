import { describe, expect, it } from "vitest";

import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";
import { secureNowQuestionDispositionMutationResourceId } from "@/lib/infra-evidence/securenow-question-mutation-resource-id";

const baseQuestion: SecureNowQuestion = {
  dispositionId: null,
  snapshotId: "snapshot-1",
  subscriptionId: "sub-1",
  resourceId: "/subscriptions/sub/resource",
  questionKey: "unknown-evidence@v1",
  source: "InventoryEvidence",
  scopeKind: "Resource",
  status: "Open",
  questionText: "Question?",
  resourceType: "Microsoft.Storage/storageAccounts",
  resourceName: "store",
  reasonText: "Reason",
  sourceLine: "Inventory evidence",
  answerCodes: ["NamePeer"],
  evidenceFingerprint: "fp",
  expirationUtc: null,
  isExpired: false,
  answerCode: null,
  answerText: null,
  reason: null,
};

describe("secureNowQuestionDispositionMutationResourceId", () => {
  it("returns empty string for subscription scope when resource id is null", () => {
    expect(
      secureNowQuestionDispositionMutationResourceId({
        ...baseQuestion,
        resourceId: null,
        scopeKind: "Subscription",
        source: "PolicyPack",
      }),
    ).toBe("");
  });

  it("returns null for resource scope when resource id is null", () => {
    expect(
      secureNowQuestionDispositionMutationResourceId({
        ...baseQuestion,
        resourceId: null,
        scopeKind: "Resource",
      }),
    ).toBeNull();
  });
});
