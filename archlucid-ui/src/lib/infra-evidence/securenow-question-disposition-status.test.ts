import { describe, expect, it } from "vitest";

import {
  secureNowQuestionDispositionIsAnswered,
  secureNowQuestionDispositionIsClosed,
  secureNowQuestionDispositionIsDismissed,
  secureNowQuestionDispositionIsOpen,
  secureNowQuestionDispositionStatusTrimmed,
  secureNowQuestionReviewerClosedAnswerCodeLine,
  secureNowQuestionReviewerClosedAnswerTextLine,
  secureNowQuestionReviewerClosedDispositionReasonLine,
  secureNowQuestionReviewerReasonTextLine,
  secureNowQuestionReviewerSourceLine,
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

describe("secureNowQuestionDispositionIsOpen", () => {
  it("treats omitted status as open for answer chrome", () => {
    expect(secureNowQuestionDispositionIsOpen(null)).toBe(true);
    expect(secureNowQuestionDispositionIsOpen("   ")).toBe(true);
  });

  it("treats padded Open status as open", () => {
    expect(secureNowQuestionDispositionIsOpen("  Open  ")).toBe(true);
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

describe("secureNowQuestionReviewerReasonTextLine", () => {
  it("returns trimmed reason text for display", () => {
    expect(secureNowQuestionReviewerReasonTextLine("  SecureNow found no peer.  ")).toBe(
      "SecureNow found no peer.",
    );
  });
});

describe("secureNowQuestionReviewerSourceLine", () => {
  it("returns trimmed source lines for display", () => {
    expect(secureNowQuestionReviewerSourceLine("  Inventory evidence  ")).toBe("Inventory evidence");
  });
});
