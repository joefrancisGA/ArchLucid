import { describe, expect, it } from "vitest";

import {
  secureNowQuestionCountsAsAnsweredFilterRow,
  secureNowQuestionCountsAsOpenQueueRow,
  secureNowQuestionDispositionIsAnswered,
  secureNowQuestionDispositionIsClosed,
  secureNowQuestionDispositionIsDismissed,
  secureNowQuestionDispositionIsOpen,
  secureNowQuestionDispositionReviewerStatusLabel,
  secureNowQuestionDispositionShowsAnswerActions,
  secureNowQuestionDispositionShowsStoredAnswerMetadata,
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

  it("treats lowercase answered status as answered", () => {
    expect(secureNowQuestionDispositionIsAnswered("answered")).toBe(true);
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

  it("treats case-variant open status as open", () => {
    expect(secureNowQuestionDispositionIsOpen("  open  ")).toBe(true);
  });
});

describe("secureNowQuestionDispositionShowsStoredAnswerMetadata", () => {
  it("infers stored answer metadata when status is unknown but answer fields are present", () => {
    expect(secureNowQuestionDispositionShowsStoredAnswerMetadata({
      status: "Pending",
      answerCode: "NamePeer",
      answerText: null,
      reason: null,
    })).toBe(true);
  });

  it("infers stored answer metadata when status is omitted but answer fields are present", () => {
    expect(secureNowQuestionDispositionShowsStoredAnswerMetadata({
      status: null,
      answerCode: "NamePeer",
      answerText: null,
      reason: null,
    })).toBe(true);
  });

  it("infers stored answer metadata when status is Open but answer fields are present", () => {
    expect(secureNowQuestionDispositionShowsStoredAnswerMetadata({
      status: "Open",
      answerCode: "NamePeer",
      answerText: null,
      reason: null,
    })).toBe(true);
  });
});

describe("secureNowQuestionDispositionShowsAnswerActions", () => {
  it("shows answer actions when omitted status only has whitespace disposition fields", () => {
    expect(secureNowQuestionDispositionShowsAnswerActions({
      status: null,
      answerCode: "   ",
      answerText: "",
      reason: "   ",
    })).toBe(true);
  });

  it("hides answer actions when omitted status still carries stored answer metadata", () => {
    expect(secureNowQuestionDispositionShowsAnswerActions({
      status: null,
      answerCode: "NamePeer",
      answerText: "Name the peer",
      reason: "Operator selected the peer.",
    })).toBe(false);
  });
});

describe("secureNowQuestionCountsAsOpenQueueRow", () => {
  it("excludes rows with omitted status but stored answer metadata from the open queue", () => {
    expect(secureNowQuestionCountsAsOpenQueueRow({
      status: null,
      answerCode: "NamePeer",
      answerText: null,
      reason: null,
      expirationUtc: "2099-01-01T00:00:00Z",
      isExpired: false,
    })).toBe(false);
  });

  it("excludes rows with Open status but stored answer metadata from the open queue", () => {
    expect(secureNowQuestionCountsAsOpenQueueRow({
      status: "Open",
      answerCode: "NamePeer",
      answerText: null,
      reason: null,
      expirationUtc: "2099-01-01T00:00:00Z",
      isExpired: false,
    })).toBe(false);
  });

  it("excludes rows with unknown disposition status from the open queue", () => {
    expect(secureNowQuestionCountsAsOpenQueueRow({
      status: "Pending",
      answerCode: null,
      answerText: null,
      reason: null,
      expirationUtc: "2099-01-01T00:00:00Z",
      isExpired: false,
    })).toBe(false);
  });
});

describe("secureNowQuestionCountsAsAnsweredFilterRow", () => {
  it("includes rows with omitted status when answer metadata was stored", () => {
    expect(secureNowQuestionCountsAsAnsweredFilterRow({
      status: null,
      answerCode: "NamePeer",
      answerText: null,
      reason: null,
    })).toBe(true);
  });

  it("includes rows with Open status when answer metadata was stored", () => {
    expect(secureNowQuestionCountsAsAnsweredFilterRow({
      status: "Open",
      answerCode: "NamePeer",
      answerText: "Name the peer",
      reason: "Operator selected the peer.",
    })).toBe(true);
  });

  it("includes rows with unknown status when answer metadata was stored", () => {
    expect(secureNowQuestionCountsAsAnsweredFilterRow({
      status: "Pending",
      answerCode: "NamePeer",
      answerText: null,
      reason: null,
    })).toBe(true);
  });
});

describe("secureNowQuestionDispositionReviewerStatusLabel", () => {
  it("labels omitted status as Answered when answer metadata was stored", () => {
    expect(secureNowQuestionDispositionReviewerStatusLabel({
      status: null,
      answerCode: "NamePeer",
      answerText: null,
      reason: null,
    })).toBe("Answered");
  });

  it("labels omitted status as Dismissed when only a dismiss reason was stored", () => {
    expect(secureNowQuestionDispositionReviewerStatusLabel({
      status: null,
      answerCode: null,
      answerText: null,
      reason: "Operator chose not to answer.",
    })).toBe("Dismissed");
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
