import { describe, expect, it } from "vitest";

import type { SecureNowQuestion } from "@/lib/infra-evidence/securenow-question-queue-api";
import {
  secureNowQuestionResourceDisplayName,
  secureNowQuestionResourceTypeLabel,
} from "@/lib/infra-evidence/securenow-question-resource-identity-display";

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

describe("secureNowQuestionResourceIdentityDisplay", () => {
  it("distinguishes omitted resource name from stored empty string", () => {
    expect(
      secureNowQuestionResourceDisplayName({
        ...baseQuestion,
        resourceName: null,
      }),
    ).toBe("Resource-scoped question (resource name was not stored).");

    expect(
      secureNowQuestionResourceDisplayName({
        ...baseQuestion,
        resourceName: "",
      }),
    ).toBe("Resource name was stored empty.");
  });

  it("uses pack-friendly identity copy instead of empty-resource warnings", () => {
    const packQuestion: SecureNowQuestion = {
      ...baseQuestion,
      source: "PolicyPack",
      scopeKind: "Subscription",
      resourceId: "",
      resourceType: "",
      resourceName: "",
    };

    expect(secureNowQuestionResourceTypeLabel(packQuestion)).toBeNull();
    expect(secureNowQuestionResourceDisplayName(packQuestion)).toBe("Subscription question");
  });

  it("infers pack identity copy when policy pack source omits scopeKind", () => {
    const packQuestion: SecureNowQuestion = {
      ...baseQuestion,
      source: "PolicyPack",
      scopeKind: null,
      resourceId: "",
      resourceType: "",
      resourceName: "",
      questionText: "Which resource group owns this workload?",
    };

    expect(secureNowQuestionResourceTypeLabel(packQuestion)).toBeNull();
    expect(secureNowQuestionResourceDisplayName(packQuestion)).toBe("Resource group question");
  });

  it("labels resource group pack questions distinctly", () => {
    const packQuestion: SecureNowQuestion = {
      ...baseQuestion,
      source: "PolicyPack",
      scopeKind: "ResourceGroup",
      resourceId: "",
      resourceType: "",
      resourceName: "",
    };

    expect(secureNowQuestionResourceDisplayName(packQuestion)).toBe("Resource group question");
  });

  it("labels resource-scoped inventory questions without inventing a name (P-20)", () => {
    expect(
      secureNowQuestionResourceDisplayName({
        ...baseQuestion,
        scopeKind: "Resource",
        resourceName: null,
      }),
    ).toBe("Resource-scoped question (resource name was not stored).");
  });

  it("defaults unknown pack scope with missing prompt text to subscription copy", () => {
    const packQuestion: SecureNowQuestion = {
      ...baseQuestion,
      source: "PolicyPack",
      scopeKind: "Other",
      resourceId: "",
      resourceType: "",
      resourceName: "",
      questionText: null,
    };

    expect(secureNowQuestionResourceDisplayName(packQuestion)).toBe("Subscription question");
  });
});
