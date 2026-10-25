import { describe, expect, it } from "vitest";

import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";
import {
  secureNowQuestionDispositionMutationResourceId,
  secureNowQuestionDispositionMutationScopeKind,
  secureNowQuestionDispositionMutationSource,
  secureNowQuestionDispositionMutationSubscriptionId,
  secureNowQuestionHasPackStyleDispositionScope,
  secureNowQuestionPackScopeKindFromPrompt,
} from "@/lib/infra-evidence/securenow-question-mutation-resource-id";

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

describe("secureNowQuestionDispositionMutationSubscriptionId", () => {
  it("returns null for missing or blank subscription ids", () => {
    expect(secureNowQuestionDispositionMutationSubscriptionId(null)).toBeNull();
    expect(secureNowQuestionDispositionMutationSubscriptionId("   ")).toBeNull();
  });

  it("returns trimmed subscription ids for mutations", () => {
    expect(secureNowQuestionDispositionMutationSubscriptionId(" sub-1 ")).toBe("sub-1");
  });
});

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

  it("treats resource group scope as pack-style disposition scope", () => {
    expect(secureNowQuestionHasPackStyleDispositionScope("ResourceGroup")).toBe(true);
    expect(secureNowQuestionHasPackStyleDispositionScope("Subscription")).toBe(true);
    expect(secureNowQuestionHasPackStyleDispositionScope("Resource")).toBe(false);
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

describe("secureNowQuestionDispositionMutationSource", () => {
  it("infers PolicyPack when subscription scope omits source", () => {
    expect(
      secureNowQuestionDispositionMutationSource({
        source: null,
        scopeKind: "Subscription",
        questionKey: "subscription-ownership@v1",
      }),
    ).toBe("PolicyPack");
  });

  it("infers InventoryEvidence for resource scope when source is omitted", () => {
    expect(
      secureNowQuestionDispositionMutationSource({
        source: null,
        scopeKind: "Resource",
        questionKey: "unknown-evidence@v1",
      }),
    ).toBe("InventoryEvidence");
  });

  it("infers InferredConnection from question key when source is omitted", () => {
    expect(
      secureNowQuestionDispositionMutationSource({
        source: null,
        scopeKind: "Resource",
        questionKey: "unresolved-host-0123456789abcdef0123456789abcdef@v1",
      }),
    ).toBe("InferredConnection");
  });
});

describe("secureNowQuestionDispositionMutationScopeKind", () => {
  it("keeps subscription scope for pack rows", () => {
    expect(
      secureNowQuestionDispositionMutationScopeKind({
        source: null,
        scopeKind: "Subscription",
        questionKey: "subscription-ownership@v1",
        questionText: "Who owns this subscription?",
      }),
    ).toBe("Subscription");
  });

  it("infers resource group scope from prompt when pack source omits scopeKind", () => {
    expect(secureNowQuestionPackScopeKindFromPrompt("Which resource group owns this workload?")).toBe(
      "ResourceGroup",
    );
    expect(
      secureNowQuestionDispositionMutationScopeKind({
        source: "PolicyPack",
        scopeKind: null,
        questionKey: "rg-scope@v1",
        questionText: "Which resource group owns this workload?",
      }),
    ).toBe("ResourceGroup");
  });

  it("returns empty resource id for policy pack rows when scopeKind is omitted", () => {
    expect(
      secureNowQuestionDispositionMutationResourceId({
        ...baseQuestion,
        resourceId: null,
        source: "PolicyPack",
        scopeKind: null,
      }),
    ).toBe("");
  });
});
