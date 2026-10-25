import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  answerSecureNowQuestion,
  listSecureNowQuestions,
  mapSecureNowQuestionDisposition,
} from "@/lib/infra-evidence/securenow-question-queue-api";
import { proxyJsonGet, proxyJsonPost } from "@/lib/proxy-json-client";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
  proxyJsonPost: vi.fn(),
}));

describe("securenow-question-queue-api", () => {
  beforeEach(() => {
    vi.mocked(proxyJsonGet).mockReset();
    vi.mocked(proxyJsonPost).mockReset();
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

  it("drops blank answer code entries from list responses", async () => {
    vi.mocked(proxyJsonGet).mockResolvedValueOnce([
      {
        snapshotId: "snapshot-1",
        questionKey: "unknown-evidence@v1",
        questionText: "Should this resource connect?",
        answerCodes: ["", "NamePeer", "   "],
        evidenceFingerprint: "fingerprint",
      },
    ]);

    const questions = await listSecureNowQuestions("snapshot-1");

    expect(questions).toHaveLength(1);
    expect(questions[0].answerCodes).toEqual(["NamePeer"]);
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

  it("answer returns a disposition payload from POST /answer", async () => {
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
