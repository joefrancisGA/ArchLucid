import { beforeEach, describe, expect, it, vi } from "vitest";

import { listSecureNowQuestions } from "@/lib/infra-evidence/securenow-question-queue-api";
import { proxyJsonGet } from "@/lib/proxy-json-client";

vi.mock("@/lib/proxy-json-client", () => ({
  proxyJsonGet: vi.fn(),
}));

describe("securenow-question-queue-api", () => {
  beforeEach(() => {
    vi.mocked(proxyJsonGet).mockReset();
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
});
