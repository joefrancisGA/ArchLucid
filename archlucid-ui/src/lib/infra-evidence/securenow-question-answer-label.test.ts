import { describe, expect, it } from "vitest";

import { secureNowQuestionAnswerLabel } from "@/lib/infra-evidence/securenow-question-answer-label";

describe("secureNowQuestionAnswerLabel", () => {
  it("maps known answer codes to reviewer labels", () => {
    expect(secureNowQuestionAnswerLabel("NamePeer")).toBe("Name the peer");
  });

  it("reports when an answer code has no reviewer label", () => {
    expect(secureNowQuestionAnswerLabel("UnknownCode")).toBe(
      "Answer code UnknownCode has no reviewer label.",
    );
  });
});
