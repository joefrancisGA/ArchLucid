import { describe, expect, it } from "vitest";

import {
  secureNowQuestionDispositionIsAnswered,
  secureNowQuestionDispositionIsClosed,
  secureNowQuestionDispositionIsDismissed,
  secureNowQuestionDispositionStatusTrimmed,
  secureNowQuestionReviewerClosedAnswerCodeLine,
  secureNowQuestionReviewerClosedAnswerTextLine,
  secureNowQuestionReviewerClosedDispositionReasonLine,
} from "@/lib/infra-evidence/securenow-question-disposition-status";

describe("secureNowQuestionDispositionStatusTrimmed", () => {
  it("trims stored disposition status before comparisons", () => {
    expect(secureNowQuestionDispositionStatusTrimmed("  Answered  ")).toBe("Answered");
    expect(secureNowQuestionDispositionStatusTrimmed("   ")).toBeNull();
  });
});

describe("secureNowQuestionDispositionIsAnswered", () => {
  it("treats padded answered status as answered", () => {
    expect(secureNowQuestionDispositionIsAnswered("  Answered  ")).toBe(true);
  });
});

describe("secureNowQuestionDispositionIsDismissed", () => {
  it("treats padded ignored and dismissed statuses as dismissed", () => {
    expect(secureNowQuestionDispositionIsDismissed("  Ignored  ")).toBe(true);
    expect(secureNowQuestionDispositionIsDismissed(" Dismissed ")).toBe(true);
  });
});

describe("secureNowQuestionDispositionIsClosed", () => {
  it("treats padded closed statuses as closed", () => {
    expect(secureNowQuestionDispositionIsClosed(" Answered ")).toBe(true);
    expect(secureNowQuestionDispositionIsClosed(" Ignored ")).toBe(true);
  });
});

describe("secureNowQuestionReviewerClosedAnswerCodeLine", () => {
  it("labels whitespace-only answer codes as stored empty", () => {
    expect(secureNowQuestionReviewerClosedAnswerCodeLine("   ")).toBe("Answer code was stored empty.");
  });

  it("labels padded answer codes using the trimmed code", () => {
    expect(secureNowQuestionReviewerClosedAnswerCodeLine("  NamePeer  ")).toBe("Name the peer");
  });
});

describe("secureNowQuestionReviewerClosedAnswerTextLine", () => {
  it("returns trimmed answer text for display", () => {
    expect(secureNowQuestionReviewerClosedAnswerTextLine("  Name the peer  ")).toBe("Name the peer");
  });
});

describe("secureNowQuestionReviewerClosedDispositionReasonLine", () => {
  it("returns trimmed disposition reasons for display", () => {
    expect(secureNowQuestionReviewerClosedDispositionReasonLine("  Operator selected the peer.  ")).toBe(
      "Operator selected the peer.",
    );
  });
});
