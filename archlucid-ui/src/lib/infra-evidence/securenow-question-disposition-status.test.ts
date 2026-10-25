import { describe, expect, it } from "vitest";

import {
  secureNowQuestionDispositionIsAnswered,
  secureNowQuestionDispositionIsClosed,
  secureNowQuestionDispositionIsDismissed,
  secureNowQuestionDispositionStatusTrimmed,
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
