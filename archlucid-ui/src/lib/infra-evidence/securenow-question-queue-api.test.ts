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
    expect(questions[0].questionText).toBe("");
    expect(questions[0].answerCodes).toEqual(["Yes", ""]);
  });
});
