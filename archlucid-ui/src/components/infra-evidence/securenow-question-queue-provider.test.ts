import { describe, expect, it } from "vitest";

import { questionIdentity } from "@/components/infra-evidence/securenow-question-queue-provider";
import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";

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

describe("questionIdentity", () => {
  it("builds a missing-key identity when prompt text was not stored", () => {
    expect(
      questionIdentity({
        ...baseQuestion,
        questionKey: null,
        dispositionId: null,
        evidenceFingerprint: null,
        questionText: null,
      }),
    ).toBe("sub-1|/subscriptions/sub/resource|missing-key:");
  });
});
