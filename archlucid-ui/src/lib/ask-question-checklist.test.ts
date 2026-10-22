import { describe, expect, it } from "vitest";

import {
  isAskQuestionSent,
  resolveAskQuestionEmphasizedStepId,
  resolveAskQuestionSteps,
} from "@/lib/ask-question-checklist";
import type { ConversationMessage } from "@/types/conversation";

function message(role: string): ConversationMessage {
  return {
    messageId: "m-1",
    threadId: "t-1",
    role,
    content: "What changed?",
    createdUtc: "2026-01-01T00:00:00.000Z",
    metadataJson: "{}",
  };
}

describe("ask-question-checklist", () => {
  it("emphasizes the first incomplete step", () => {
    expect(
      resolveAskQuestionEmphasizedStepId({
        reviewPicked: false,
        questionWritten: false,
        questionSent: false,
      }),
    ).toBe("review");

    expect(
      resolveAskQuestionEmphasizedStepId({
        reviewPicked: true,
        questionWritten: false,
        questionSent: false,
      }),
    ).toBe("question");
  });

  it("returns three ask steps", () => {
    const steps = resolveAskQuestionSteps({
      reviewPicked: true,
      questionWritten: true,
      questionSent: false,
    });

    expect(steps).toHaveLength(3);
    expect(steps[2]?.complete).toBe(false);
  });

  it("treats loading or a user message as sent", () => {
    expect(isAskQuestionSent({ loading: true, messages: [] })).toBe(true);
    expect(isAskQuestionSent({ loading: false, messages: [message("assistant")] })).toBe(false);
    expect(isAskQuestionSent({ loading: false, messages: [message("user")] })).toBe(true);
  });
});
