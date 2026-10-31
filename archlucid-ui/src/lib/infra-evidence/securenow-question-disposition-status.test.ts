import { describe, expect, it } from "vitest";

import {
  secureNowQuestionCountsAsAnsweredFilterRow,
  secureNowQuestionCountsAsMissingStatusFilterRow,
  secureNowQuestionCountsAsOpenQueueRow,
  secureNowQuestionQueueInitialReviewFilter,
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
  it("does not treat omitted status as open", () => {
    expect(secureNowQuestionDispositionIsOpen(null)).toBe(false);
    expect(secureNowQuestionDispositionIsOpen("   ")).toBe(false);
  });

  it("treats padded Open status as open", () => {
    expect(secureNowQuestionDispositionIsOpen("  Open  ")).toBe(true);
  });

  it("treats case-variant open status as open", () => {
    expect(secureNowQuestionDispositionIsOpen("  open  ")).toBe(true);
  });
});

describe("secureNowQuestionCountsAsMissingStatusFilterRow", () => {
  it("includes rows with omitted status that are not inferred answered or dismissed", () => {
    expect(
      secureNowQuestionCountsAsMissingStatusFilterRow({
        status: null,
        answerCode: null,
        answerText: null,
        reason: null,
      }),
    ).toBe(true);
    expect(
      secureNowQuestionCountsAsMissingStatusFilterRow({
        status: null,
        answerCode: "Yes",
        answerText: null,
        reason: null,
      }),
    ).toBe(false);
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
  it("hides answer actions when status was not stored even with whitespace disposition fields", () => {
    expect(secureNowQuestionDispositionShowsAnswerActions({
      status: null,
      answerCode: "   ",
      answerText: "",
      reason: "   ",
    })).toBe(false);
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

describe("secureNowQuestionQueueInitialReviewFilter", () => {
  it("opens answered when no open rows are reviewable", () => {
    expect(secureNowQuestionQueueInitialReviewFilter([{
      status: "Pending",
      answerCode: "NamePeer",
      answerText: null,
      reason: null,
      expirationUtc: "2099-01-01T00:00:00Z",
      isExpired: false,
    }])).toBe("Answered");
  });

  it("opens dismissed when only dismiss disposition rows are reviewable", () => {
    expect(secureNowQuestionQueueInitialReviewFilter([{
      status: null,
      answerCode: null,
      answerText: null,
      reason: "Operator chose not to answer.",
      expirationUtc: "2099-01-01T00:00:00Z",
      isExpired: false,
    }])).toBe("Dismissed");
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

  it("excludes open rows with past expirationUtc when isExpired is omitted", () => {
    expect(secureNowQuestionCountsAsOpenQueueRow({
      status: "Open",
      answerCode: null,
      answerText: null,
      reason: null,
      expirationUtc: "2020-01-01T00:00:00.000Z",
      isExpired: null,
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

  it("labels stored-empty reason separately from omitted reason", () => {
    expect(secureNowQuestionReviewerReasonTextLine(null)).toBe("Reason was not stored.");
    expect(secureNowQuestionReviewerReasonTextLine("   ")).toBe("Reason was stored empty.");
  });
});

describe("secureNowQuestionReviewerSourceLine", () => {
  it("returns trimmed source lines for display", () => {
    expect(secureNowQuestionReviewerSourceLine("  Inventory evidence  ")).toBe("Inventory evidence");
  });

  it("labels omitted and stored-empty source lines separately", () => {
    expect(secureNowQuestionReviewerSourceLine(null)).toBe("Source line was not stored.");
    expect(secureNowQuestionReviewerSourceLine("")).toBe("Source line was stored empty.");
    expect(secureNowQuestionReviewerSourceLine("   ")).toBe("Source line was stored empty.");
  });
});
