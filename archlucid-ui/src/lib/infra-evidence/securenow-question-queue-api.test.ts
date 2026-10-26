import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  answerSecureNowQuestion,
  ignoreSecureNowQuestion,
  listSecureNowQuestions,
  reopenSecureNowQuestion,
  mapSecureNowQuestionDisposition,
  secureNowQuestionDispositionResponseIsUsable,
  secureNowQuestionDispositionResponseRequiredStringFields,
  secureNowQuestionDispositionScopeRequiresResourceId,
  secureNowQuestionListedSnapshotMatchesContext,
  secureNowQuestionDispositionResponseQuestionKeyMatchesRequest,
  secureNowQuestionDispositionResponseEvidenceFingerprintMatchesRequest,
  secureNowQuestionDispositionResponseSubscriptionIdMatchesRequest,
  secureNowQuestionDispositionResponseResourceIdMatchesRequest,
  secureNowQuestionDispositionResponseScopeKindMatchesRequest,
  secureNowQuestionDispositionResponseSourceMatchesRequest,
} from "@/lib/infra-evidence/securenow-question-queue-api";
import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
  proxyJsonPost: vi.fn(),
}));

describe("secureNowQuestionDispositionResponseIsUsable", () => {
  const baseDisposition = mapSecureNowQuestionDisposition({
    dispositionId: "00000000-0000-0000-0000-000000000001",
    snapshotId: "00000000-0000-0000-0000-000000000002",
    subscriptionId: "sub-1",
    resourceId: "sub-1",
    questionKey: "subscription-ownership@v1",
    source: "PolicyPack",
    scopeKind: "Subscription",
    status: "Answered",
    answerCode: "Owner",
    answerText: "Owner",
    reason: "Reviewed.",
    expirationUtc: "2026-12-01T00:00:00.000Z",
    isExpired: false,
    evidenceFingerprint: "fingerprint",
    actorKey: "reviewer",
    updatedUtc: "2026-11-01T00:00:00.000Z",
    auditEntries: [],
  });

  it("rejects blank disposition id after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        dispositionId: "",
      }),
    ).toBe(false);
  });

  it("rejects blank question key after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        questionKey: "",
      }),
    ).toBe(false);
  });

  it("rejects blank snapshot id after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        snapshotId: "",
      }),
    ).toBe(false);
  });

  it("rejects blank evidence fingerprint after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        evidenceFingerprint: "",
      }),
    ).toBe(false);
  });

  it("rejects blank source after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        source: "",
      }),
    ).toBe(false);
  });

  it("rejects blank scope kind after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        scopeKind: "",
      }),
    ).toBe(false);
  });

  it("rejects blank status after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        status: "",
      }),
    ).toBe(false);
  });

  it("rejects blank subscription id after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        subscriptionId: "",
      }),
    ).toBe(false);
  });

  it("rejects blank values on every required POST disposition string field", () => {
    for (const field of secureNowQuestionDispositionResponseRequiredStringFields) {
      expect(
        secureNowQuestionDispositionResponseIsUsable({
          ...baseDisposition,
          [field]: "",
        }),
        field,
      ).toBe(false);
    }
  });

  it("rejects resource scope dispositions with blank resource id after trim", () => {
    expect(secureNowQuestionDispositionScopeRequiresResourceId("Resource")).toBe(true);
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        scopeKind: "Resource",
        resourceId: "",
      }),
    ).toBe(false);
  });

  it("allows subscription scope dispositions with blank resource id after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        scopeKind: "Subscription",
        resourceId: "",
      }),
    ).toBe(true);
  });

  it("rejects answered dispositions without answer code or text after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        answerCode: null,
        answerText: null,
      }),
    ).toBe(false);
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        answerCode: "   ",
        answerText: null,
      }),
    ).toBe(false);
  });

  it("rejects dismissed dispositions without a stored reason after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        status: "Ignored",
        answerCode: null,
        answerText: null,
        reason: "",
      }),
    ).toBe(false);
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        status: "Ignored",
        answerCode: null,
        answerText: null,
        reason: "   ",
      }),
    ).toBe(false);
  });

  it("allows dismissed dispositions with a stored reason after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        status: "Ignored",
        answerCode: null,
        answerText: null,
        reason: "Operator chose not to answer.",
      }),
    ).toBe(true);
  });

  it("rejects open dispositions that still carry answer metadata after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        status: "Open",
        answerCode: "Owner",
        answerText: null,
        reason: "Reviewed.",
      }),
    ).toBe(false);
  });

  it("rejects dismissed dispositions that still carry answer metadata after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        status: "Ignored",
        answerCode: "Owner",
        answerText: null,
        reason: "Operator chose not to answer.",
      }),
    ).toBe(false);
  });

  it("rejects dispositions with audit entries whose action is blank after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        auditEntries: [
          {
            action: "   ",
            actorKey: "reviewer",
            occurredUtc: "2026-11-01T00:00:00.000Z",
            reason: "",
          },
        ],
      }),
    ).toBe(false);
  });

  it("rejects dispositions with audit entries whose actor key is blank after trim", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        auditEntries: [
          {
            action: "Answered",
            actorKey: "   ",
            occurredUtc: "2026-11-01T00:00:00.000Z",
            reason: "",
          },
        ],
      }),
    ).toBe(false);
  });

  it("allows dispositions with empty audit entry lists", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        auditEntries: [],
      }),
    ).toBe(true);
  });

  it("rejects POST disposition statuses outside open, answered, and dismissed", () => {
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        status: "Pending",
      }),
    ).toBe(false);
    expect(
      secureNowQuestionDispositionResponseIsUsable({
        ...baseDisposition,
        status: "  Pending  ",
      }),
    ).toBe(false);
  });
});

describe("secureNowQuestionDispositionResponseSourceMatchesRequest", () => {
  it("treats padded source values as matching the submitted write", () => {
    expect(
      secureNowQuestionDispositionResponseSourceMatchesRequest(
        "  InventoryEvidence  ",
        "InventoryEvidence",
      ),
    ).toBe(true);
  });

  it("rejects a different source after trim", () => {
    expect(
      secureNowQuestionDispositionResponseSourceMatchesRequest(
        "PolicyPack",
        "InventoryEvidence",
      ),
    ).toBe(false);
  });
});

describe("secureNowQuestionDispositionResponseScopeKindMatchesRequest", () => {
  it("treats padded scope kind values as matching the submitted write", () => {
    expect(
      secureNowQuestionDispositionResponseScopeKindMatchesRequest("  Resource  ", "Resource"),
    ).toBe(true);
  });

  it("rejects a different scope kind after trim", () => {
    expect(
      secureNowQuestionDispositionResponseScopeKindMatchesRequest(
        "Subscription",
        "Resource",
      ),
    ).toBe(false);
  });
});

describe("secureNowQuestionDispositionResponseResourceIdMatchesRequest", () => {
  it("treats padded resource ids as matching the submitted request", () => {
    const resourceId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev";
    expect(
      secureNowQuestionDispositionResponseResourceIdMatchesRequest(
        `  ${resourceId}  `,
        resourceId,
      ),
    ).toBe(true);
  });

  it("rejects a different resource id after trim", () => {
    expect(
      secureNowQuestionDispositionResponseResourceIdMatchesRequest(
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other",
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev",
      ),
    ).toBe(false);
  });

  it("matches empty resource ids for subscription-scope writes", () => {
    expect(secureNowQuestionDispositionResponseResourceIdMatchesRequest("", "")).toBe(true);
    expect(secureNowQuestionDispositionResponseResourceIdMatchesRequest("   ", "")).toBe(true);
  });
});

describe("secureNowQuestionDispositionResponseSubscriptionIdMatchesRequest", () => {
  it("treats padded subscription ids as matching the submitted request", () => {
    expect(
      secureNowQuestionDispositionResponseSubscriptionIdMatchesRequest(
        "  subscription-1  ",
        "subscription-1",
      ),
    ).toBe(true);
  });

  it("rejects a different subscription id after trim", () => {
    expect(
      secureNowQuestionDispositionResponseSubscriptionIdMatchesRequest(
        "subscription-2",
        "subscription-1",
      ),
    ).toBe(false);
  });

  it("rejects when the submitted subscription id is null or blank after trim", () => {
    expect(
      secureNowQuestionDispositionResponseSubscriptionIdMatchesRequest("subscription-1", null),
    ).toBe(false);
    expect(
      secureNowQuestionDispositionResponseSubscriptionIdMatchesRequest("subscription-1", "   "),
    ).toBe(false);
  });
});

describe("secureNowQuestionDispositionResponseEvidenceFingerprintMatchesRequest", () => {
  it("treats padded evidence fingerprints as matching the submitted request", () => {
    expect(
      secureNowQuestionDispositionResponseEvidenceFingerprintMatchesRequest(
        "  fingerprint-1  ",
        "fingerprint-1",
      ),
    ).toBe(true);
  });

  it("rejects a different evidence fingerprint after trim", () => {
    expect(
      secureNowQuestionDispositionResponseEvidenceFingerprintMatchesRequest(
        "fingerprint-2",
        "fingerprint-1",
      ),
    ).toBe(false);
  });

  it("rejects blank evidence fingerprints after trim", () => {
    expect(
      secureNowQuestionDispositionResponseEvidenceFingerprintMatchesRequest(
        "   ",
        "fingerprint-1",
      ),
    ).toBe(false);
  });
});

describe("secureNowQuestionDispositionResponseQuestionKeyMatchesRequest", () => {
  it("treats padded question keys as matching the submitted request", () => {
    expect(
      secureNowQuestionDispositionResponseQuestionKeyMatchesRequest(
        "  subscription-ownership@v1  ",
        "subscription-ownership@v1",
      ),
    ).toBe(true);
  });

  it("rejects a different question key after trim", () => {
    expect(
      secureNowQuestionDispositionResponseQuestionKeyMatchesRequest(
        "unknown-evidence@v1",
        "subscription-ownership@v1",
      ),
    ).toBe(false);
  });

  it("rejects blank question keys after trim", () => {
    expect(
      secureNowQuestionDispositionResponseQuestionKeyMatchesRequest("   ", "subscription-ownership@v1"),
    ).toBe(false);
  });
});

describe("secureNowQuestionListedSnapshotMatchesContext", () => {
  it("treats padded listed snapshot ids as matching the active context", () => {
    expect(secureNowQuestionListedSnapshotMatchesContext("  snapshot-1  ", "snapshot-1")).toBe(true);
  });

  it("rejects a different listed snapshot id after trim", () => {
    expect(secureNowQuestionListedSnapshotMatchesContext("snapshot-2", "snapshot-1")).toBe(false);
  });

  it("rejects an empty listed snapshot id after trim", () => {
    expect(secureNowQuestionListedSnapshotMatchesContext("", "snapshot-1")).toBe(false);
    expect(secureNowQuestionListedSnapshotMatchesContext("   ", "snapshot-1")).toBe(false);
  });
});

describe("securenow-question-queue-api", () => {
  beforeEach(() => {
    vi.mocked(proxyJsonGet).mockReset();
    vi.mocked(proxyJsonPost).mockReset();
  });

  it("returns an empty list when the proxy response is not an array", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce({ items: [] });

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions).toEqual([]);
  });

  it("maps non-string reasonText and sourceLine to empty strings without throwing", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        reasonText: 404,
        sourceLine: false,
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].reasonText).toBe("");
    expect(questions[0].sourceLine).toBe("");
  });

  it("maps whitespace-only snapshotId to empty string without throwing", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "   ",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].snapshotId).toBe("");
  });

  it("maps non-string snapshotId to empty string without throwing", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: 123,
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].snapshotId).toBe("");
  });

  it("maps explicit null answerCodes to null instead of an empty array", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: null,
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].answerCodes).toBeNull();
  });

  it("maps answerCodes with only non-string entries to an empty array", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: [1, 2],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].answerCodes).toEqual([]);
  });

  it("drops non-string entries from answerCodes without throwing", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: [1, "NamePeer", null, "StandsAlone"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].answerCodes).toEqual(["NamePeer", "StandsAlone"]);
  });

  it("maps non-string questionText to placeholder copy without throwing", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: 123,
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions).toHaveLength(1);
    expect(questions[0].questionText).toBe("Question text was not stored");
  });

  it("maps whitespace-only questionKey to null on list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "   ",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].questionKey).toBeNull();
  });

  it("maps whitespace-only identity fields to null on list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        subscriptionId: "  ",
        resourceId: "   ",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "   ",
        source: "  ",
        scopeKind: " ",
        resourceType: "  ",
        resourceName: "   ",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].subscriptionId).toBeNull();
    expect(questions[0].resourceId).toBeNull();
    expect(questions[0].evidenceFingerprint).toBeNull();
    expect(questions[0].source).toBeNull();
    expect(questions[0].scopeKind).toBeNull();
    expect(questions[0].resourceType).toBeNull();
    expect(questions[0].resourceName).toBeNull();
  });

  it("maps null questionKey to null instead of empty string", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: null,
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].questionKey).toBeNull();
  });

  it("maps non-string resourceId values to null instead of empty string", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        subscriptionId: "subscription-1",
        resourceId: 12345,
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].resourceId).toBeNull();
  });

  it("maps non-string subscriptionId values to null instead of empty string", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        subscriptionId: 12345,
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].subscriptionId).toBeNull();
  });

  it("maps non-string evidenceFingerprint values to null", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        evidenceFingerprint: 12345,
        answerCodes: ["NamePeer"],
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].evidenceFingerprint).toBeNull();
  });

  it("maps null evidenceFingerprint to null instead of empty string", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        evidenceFingerprint: null,
        answerCodes: ["NamePeer"],
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].evidenceFingerprint).toBeNull();
  });

  it("maps null resourceName to null instead of empty string", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        resourceName: null,
        resourceType: null,
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].resourceName).toBeNull();
    expect(questions[0].resourceType).toBeNull();
  });

  it("preserves null resource name and blank answer codes from list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "",
        resourceName: null,
        answerCodes: ["Yes", ""],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions).toHaveLength(1);
    expect(questions[0].resourceName).toBeNull();
    expect(questions[0].questionText).toBe("Question text was not stored");
    expect(questions[0].answerCodes).toEqual(["Yes"]);
  });

  it("maps string isExpired values from list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
        isExpired: "  TRUE  ",
        expirationUtc: "2099-01-01T00:00:00.000Z",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].isExpired).toBe(true);
  });

  it("maps numeric isExpired values from list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
        isExpired: 1,
        expirationUtc: "2099-01-01T00:00:00.000Z",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].isExpired).toBe(true);
  });

  it("maps whitespace-only listed disposition fields to null on list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
        dispositionId: "   ",
        expirationUtc: "  ",
        answerCode: "   ",
        answerText: "  ",
        reason: "   ",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].dispositionId).toBeNull();
    expect(questions[0].expirationUtc).toBeNull();
    expect(questions[0].answerCode).toBeNull();
    expect(questions[0].answerText).toBeNull();
    expect(questions[0].reason).toBeNull();
  });

  it("trims padded listed disposition fields on list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
        dispositionId: "  00000000-0000-0000-0000-000000000001  ",
        answerCode: "  NamePeer  ",
        reason: "  Operator dismissed.  ",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].dispositionId).toBe("00000000-0000-0000-0000-000000000001");
    expect(questions[0].answerCode).toBe("NamePeer");
    expect(questions[0].reason).toBe("Operator dismissed.");
  });

  it("maps whitespace-only status to null on list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["NamePeer"],
        evidenceFingerprint: "fingerprint",
        status: "   ",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].status).toBeNull();
  });

  it("maps padded false string isExpired on disposition responses", () => {
    const disposition = mapSecureNowQuestionDisposition({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      reason: "Answered in queue.",
      expirationUtc: "2099-01-01T00:00:00.000Z",
      isExpired: " FALSE ",
      evidenceFingerprint: "fingerprint",
      actorKey: "operator",
      updatedUtc: "2026-10-25T12:00:00.000Z",
      auditEntries: [],
    });

    expect(disposition.isExpired).toBe(false);
  });

  it("trims padded disposition id on mutation responses", () => {
    const disposition = mapSecureNowQuestionDisposition({
      dispositionId: "  00000000-0000-0000-0000-000000000001  ",
      snapshotId: "  00000000-0000-0000-0000-000000000002  ",
      subscriptionId: "  sub-1  ",
      resourceId: "  sub-1  ",
      questionKey: "  subscription-ownership@v1  ",
      source: "  PolicyPack  ",
      scopeKind: "  Subscription  ",
      status: "  Answered  ",
      reason: "  Answered in queue.  ",
      expirationUtc: "  2099-01-01T00:00:00.000Z  ",
      isExpired: false,
      evidenceFingerprint: "  fingerprint  ",
      actorKey: "  operator  ",
      updatedUtc: "  2026-10-25T12:00:00.000Z  ",
      answerCode: "  Owner  ",
      answerText: "  Owner  ",
      auditEntries: [],
    });

    expect(disposition.dispositionId).toBe("00000000-0000-0000-0000-000000000001");
    expect(disposition.snapshotId).toBe("00000000-0000-0000-0000-000000000002");
    expect(disposition.answerCode).toBe("Owner");
    expect(disposition.reason).toBe("Answered in queue.");
  });

  it("maps whitespace-only answerCode on disposition responses to null", () => {
    const disposition = mapSecureNowQuestionDisposition({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      answerCode: "   ",
      answerText: "   ",
      auditEntries: [],
    });

    expect(disposition.answerCode).toBeNull();
    expect(disposition.answerText).toBeNull();
  });

  it("trims padded answer code entries from list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["  NamePeer  ", " StandsAlone "],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions[0].answerCodes).toEqual(["NamePeer", "StandsAlone"]);
  });

  it("maps disposition mutation responses without inventing list-question display fields", () => {
    const disposition = mapSecureNowQuestionDisposition({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    expect(disposition.status).toBe("Answered");
    expect(disposition.questionKey).toBe("subscription-ownership@v1");
    expect("questionText" in disposition).toBe(false);
  });

  it("returns undefined when POST answer response has whitespace-only disposition id", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "   ",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has whitespace-only resource id on resource scope", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "   ",
      questionKey: "unknown-evidence@v1",
      source: "InventoryEvidence",
      scopeKind: "Resource",
      status: "Answered",
      answerCode: "NamePeer",
      answerText: "NamePeer",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId:
        "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev",
      questionKey: "unknown-evidence@v1",
      source: "InventoryEvidence",
      scopeKind: "Resource",
      answerCode: "NamePeer",
      answerText: "NamePeer",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has an unrecognized status", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Pending",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has open status with answer metadata", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Open",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has answered status without answer metadata", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: null,
      answerText: null,
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has whitespace-only subscription id", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "   ",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has whitespace-only status", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "   ",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has whitespace-only scope kind", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "   ",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has whitespace-only source", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "   ",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST reopen response has whitespace-only question key", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "   ",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Open",
      reason: "Reopened.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await reopenSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      reason: "Reopened.",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST ignore response has whitespace-only disposition id", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "   ",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Ignored",
      reason: "Dismissed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await ignoreSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      reason: "Dismissed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has whitespace-only evidence fingerprint", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "   ",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has audit entries with blank action after trim", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "snapshot-1",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [
        {
          action: "   ",
          actorKey: "reviewer",
          occurredUtc: "2026-11-01T00:00:00.000Z",
          reason: "Reviewed.",
        },
      ],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response source differs from the submitted write", async () => {
    const resourceId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev";

    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "snapshot-1",
      subscriptionId: "subscription-1",
      resourceId,
      questionKey: "unknown-evidence@v1",
      source: "PolicyPack",
      scopeKind: "Resource",
      status: "Answered",
      answerCode: "NamePeer",
      answerText: "NamePeer",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "subscription-1",
      resourceId,
      questionKey: "unknown-evidence@v1",
      source: "InventoryEvidence",
      scopeKind: "Resource",
      answerCode: "NamePeer",
      answerText: "NamePeer",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response scope kind differs from the submitted write", async () => {
    const resourceId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev";

    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "snapshot-1",
      subscriptionId: "subscription-1",
      resourceId,
      questionKey: "unknown-evidence@v1",
      source: "InventoryEvidence",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "NamePeer",
      answerText: "NamePeer",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "subscription-1",
      resourceId,
      questionKey: "unknown-evidence@v1",
      source: "InventoryEvidence",
      scopeKind: "Resource",
      answerCode: "NamePeer",
      answerText: "NamePeer",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response resource id differs from the submitted request", async () => {
    const resourceId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/adf-edw-hi-dev";
    const otherResourceId =
      "/subscriptions/sub/resourceGroups/rg/providers/Microsoft.DataFactory/factories/other-resource";

    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "snapshot-1",
      subscriptionId: "subscription-1",
      resourceId: otherResourceId,
      questionKey: "unknown-evidence@v1",
      source: "InventoryEvidence",
      scopeKind: "Resource",
      status: "Answered",
      answerCode: "NamePeer",
      answerText: "NamePeer",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "subscription-1",
      resourceId,
      questionKey: "unknown-evidence@v1",
      source: "InventoryEvidence",
      scopeKind: "Resource",
      answerCode: "NamePeer",
      answerText: "NamePeer",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response subscription id differs from the submitted request", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "snapshot-1",
      subscriptionId: "subscription-2",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "subscription-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response evidence fingerprint differs from the submitted request", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "snapshot-1",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "other-fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response question key differs from the submitted request", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "snapshot-1",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "unknown-evidence@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response snapshot id differs from the active snapshot", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "snapshot-2",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("accepts POST answer responses when the snapshot id matches after trim", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "  snapshot-1  ",
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition?.snapshotId).toBe("snapshot-1");
  });

  it("returns undefined when POST answer response has whitespace-only snapshot id", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "   ",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("returns undefined when POST answer response has whitespace-only question key", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "   ",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition).toBeUndefined();
  });

  it("maps malformed auditEntries elements without throwing", () => {
    const disposition = mapSecureNowQuestionDisposition({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "00000000-0000-0000-0000-000000000002",
      subscriptionId: "sub-1",
      resourceId: "sub-1",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [null, "not-an-object", { action: " Answered ", actorKey: " reviewer ", occurredUtc: " t ", reason: " r " }],
    });

    expect(disposition.auditEntries).toHaveLength(3);
    expect(disposition.auditEntries[2]?.action).toBe("Answered");
  });

  it("answer returns a disposition payload from POST /answer", async () => {
    vi.mocked(proxyJsonPost).mockResolvedValueOnce({
      dispositionId: "00000000-0000-0000-0000-000000000001",
      snapshotId: "snapshot-1",
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      status: "Answered",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      expirationUtc: "2026-12-01T00:00:00.000Z",
      isExpired: false,
      evidenceFingerprint: "fingerprint",
      actorKey: "reviewer",
      updatedUtc: "2026-11-01T00:00:00.000Z",
      auditEntries: [],
    });

    const disposition = await answerSecureNowQuestion("snapshot-1", {
      subscriptionId: "sub-1",
      resourceId: "",
      questionKey: "subscription-ownership@v1",
      source: "PolicyPack",
      scopeKind: "Subscription",
      answerCode: "Owner",
      answerText: "Owner",
      reason: "Reviewed.",
      evidenceFingerprint: "fingerprint",
    });

    expect(disposition?.status).toBe("Answered");
    expect(disposition).not.toHaveProperty("questionText");
  });
});
