import { describe, expect, it } from "vitest";

import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";
import {
  secureNowQuestionDispositionMutationResourceId,
  secureNowQuestionDispositionMutationScopeKind,
  secureNowQuestionDispositionMutationEvidenceFingerprint,
  secureNowQuestionDispositionMutationQuestionKey,
  secureNowQuestionDispositionMutationSource,
  secureNowQuestionReviewerEvidenceFingerprintLine,
  secureNowQuestionReviewerSubscriptionLabel,
  secureNowQuestionReviewerScopeLabel,
  secureNowQuestionShowsInferredConnectionReviewerCopy,
  secureNowQuestionDispositionMutationSubscriptionId,
  secureNowQuestionHasPackStyleDispositionScope,
  secureNowQuestionPackScopeKindFromPrompt,
  secureNowQuestionPackAnswerChoiceLabel,
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

describe("secureNowQuestionDispositionMutationQuestionKey", () => {
  it("returns null when question key is omitted or whitespace-only", () => {
    expect(secureNowQuestionDispositionMutationQuestionKey(null)).toBeNull();
    expect(secureNowQuestionDispositionMutationQuestionKey("   ")).toBeNull();
  });

  it("returns trimmed question keys for mutations", () => {
    expect(secureNowQuestionDispositionMutationQuestionKey(" unknown-evidence@v1 ")).toBe(
      "unknown-evidence@v1",
    );
  });
});

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

  it("returns null for resource scope when resource id is whitespace-only", () => {
    expect(
      secureNowQuestionDispositionMutationResourceId({
        ...baseQuestion,
        resourceId: "   ",
        scopeKind: "Resource",
      }),
    ).toBeNull();
  });

  it("returns trimmed resource ids for inventory mutations", () => {
    expect(
      secureNowQuestionDispositionMutationResourceId({
        ...baseQuestion,
        resourceId: " /subscriptions/sub/resource ",
      }),
    ).toBe("/subscriptions/sub/resource");
  });
});

describe("secureNowQuestionReviewerSubscriptionLabel", () => {
  it("shows the trimmed subscription id used on mutations", () => {
    expect(secureNowQuestionReviewerSubscriptionLabel("  subscription-1  ")).toBe("subscription-1");
  });
});

describe("secureNowQuestionReviewerEvidenceFingerprintLine", () => {
  it("shows the trimmed fingerprint used on mutations", () => {
    expect(secureNowQuestionReviewerEvidenceFingerprintLine("  fingerprint  ")).toBe(
      "Evidence fingerprint: fingerprint",
    );
  });
});

describe("secureNowQuestionShowsInferredConnectionReviewerCopy", () => {
  it("returns true when a proposed connection matches the question", () => {
    expect(
      secureNowQuestionShowsInferredConnectionReviewerCopy(
        { source: null },
        true,
      ),
    ).toBe(true);
  });

  it("returns false when source is omitted and no connection match exists", () => {
    expect(
      secureNowQuestionShowsInferredConnectionReviewerCopy(
        { source: null },
        false,
      ),
    ).toBe(false);
  });
});

describe("secureNowQuestionReviewerScopeLabel", () => {
  it("does not infer scope from inventory source when scopeKind is omitted", () => {
    expect(
      secureNowQuestionReviewerScopeLabel(
        {
          source: "InventoryEvidence",
          scopeKind: null,
          questionKey: "unknown-evidence@v1",
          questionText: "Should this resource connect?",
        },
        false,
      ),
    ).toBe("Question scope was not stored.");
  });

  it("does not infer pack scope from question text when scopeKind is omitted", () => {
    expect(
      secureNowQuestionReviewerScopeLabel(
        {
          source: "PolicyPack",
          scopeKind: null,
          questionKey: "rg-scope@v1",
          questionText: "Which resource group owns this workload?",
        },
        false,
      ),
    ).toBe("This resource group. Scope kind was not stored; inferred from pack prompt.");
  });
});

describe("secureNowQuestionPackAnswerChoiceLabel", () => {
  it("includes stored answer codes on policy pack rows", () => {
    expect(
      secureNowQuestionPackAnswerChoiceLabel(
        {
          source: "PolicyPack",
          scopeKind: "Subscription",
          questionKey: "subscription-ownership@v1",
          questionText: "Who owns this subscription workload?",
        },
        "Register",
      ),
    ).toBe("Register (Register)");
  });
});

describe("secureNowQuestionDispositionMutationEvidenceFingerprint", () => {
  it("returns null when evidence fingerprint is omitted", () => {
    expect(secureNowQuestionDispositionMutationEvidenceFingerprint(null)).toBeNull();
    expect(secureNowQuestionDispositionMutationEvidenceFingerprint(undefined)).toBeNull();
  });

  it("returns null when evidence fingerprint is blank", () => {
    expect(secureNowQuestionDispositionMutationEvidenceFingerprint("   ")).toBeNull();
  });

  it("returns trimmed fingerprint when stored", () => {
    expect(secureNowQuestionDispositionMutationEvidenceFingerprint("  fp  ")).toBe("fp");
  });
});

describe("secureNowQuestionDispositionMutationSource", () => {
  it("infers inventory evidence when resource scope omits question key", () => {
    expect(
      secureNowQuestionDispositionMutationSource({
        source: "InventoryEvidence",
        scopeKind: "Resource",
        questionKey: null,
      }),
    ).toBe("InventoryEvidence");
  });
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
    expect(secureNowQuestionPackScopeKindFromPrompt(null)).toBe("Subscription");
    expect(secureNowQuestionPackScopeKindFromPrompt(undefined)).toBe("Subscription");
    expect(secureNowQuestionPackScopeKindFromPrompt("")).toBe("Subscription");
    expect(
      secureNowQuestionDispositionMutationScopeKind({
        source: "PolicyPack",
        scopeKind: null,
        questionKey: "rg-scope@v1",
        questionText: "Which resource group owns this workload?",
      }),
    ).toBe("ResourceGroup");
  });

  it("defaults pack scope to subscription when prompt text was not stored", () => {
    expect(
      secureNowQuestionDispositionMutationScopeKind({
        source: "PolicyPack",
        scopeKind: null,
        questionKey: "subscription-ownership@v1",
        questionText: null,
      }),
    ).toBe("Subscription");
  });

  it("does not default inventory rows to Resource scope when scopeKind was omitted", () => {
    expect(
      secureNowQuestionDispositionMutationScopeKind({
        source: "InventoryEvidence",
        scopeKind: null,
        questionKey: "vm-reader@v1",
        questionText: "What does this VM do?",
      }),
    ).toBeNull();
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
